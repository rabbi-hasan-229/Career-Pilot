// Authenticated, deterministic interview scoring. The answer key remains
// server-only until the learner submits an answer.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { serveObservedEdgeFunction } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[.,!?;:()"'/\\`]/g, ' ')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

serveObservedEdgeFunction('score-interview-answer', async (req: Request, observability) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const authorization = req.headers.get('Authorization') || '';
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!accessToken) return json({ error: 'Authentication required.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Interview scoring is not configured.' }, 503);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !user) return json({ error: 'Invalid or expired session.' }, 401);

    const contentLength = Number(req.headers.get('Content-Length') || 0);
    if (contentLength > 12_000) return json({ error: 'Request is too large.' }, 413);
    const rawBody = await req.text();
    if (rawBody.length > 12_000) return json({ error: 'Request is too large.' }, 413);
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Invalid request.' }, 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ error: 'Request must be valid JSON.' }, 400);
    }

    const questionId = typeof body.question_id === 'string' ? body.question_id : '';
    const requestId = typeof body.request_id === 'string' ? body.request_id : '';
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionId)
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)
      || !answer || answer.length > 6000) {
      return json({ error: 'Provide a valid question, request ID, and an answer up to 6,000 characters.' }, 400);
    }

    const { data: question, error: questionError } = await admin
      .from('interview_questions')
      .select('id,round,expected_keywords,model_answer')
      .eq('id', questionId)
      .maybeSingle();
    if (questionError) {
      observability.log('error', 'interview_rubric.lookup_failed', { error_code: questionError.code || 'unknown' });
      return json({ error: 'Could not load the interview rubric. Try again.' }, 503);
    }
    if (!question || !Array.isArray(question.expected_keywords) || typeof question.model_answer !== 'string') {
      return json({ error: 'This interview question is no longer available.' }, 404);
    }

    const normalizedAnswer = ` ${normalize(answer)} `;
    const containsPhrase = (phrase: string) => normalizedAnswer.includes(` ${normalize(phrase)} `);
    const containsAny = (phrases: string[]) => phrases.some(containsPhrase);
    const expectedKeywords = question.expected_keywords.filter((keyword: unknown): keyword is string =>
      typeof keyword === 'string' && keyword.trim().length > 0
    );
    const matchedKeywords = expectedKeywords.filter(containsPhrase);
    const behavioral = question.round === 'Behavioral';
    const hasSituation = behavioral
      ? containsAny(['situation', 'context', 'when', 'during', 'team'])
      : containsAny(['context', 'requirement', 'constraint', 'assumption', 'problem']);
    const hasTask = behavioral
      ? containsAny(['task', 'goal', 'objective', 'responsible'])
      : containsAny(['goal', 'objective', 'approach', 'design', 'architecture', 'decision']);
    const hasAction = behavioral
      ? containsAny(['action', 'implemented', 'built', 'optimized', 'deployed', 'led'])
      : containsAny(['tradeoff', 'tested', 'validated', 'implemented', 'monitored', 'measured']);
    const hasResult = containsAny(['result', 'outcome', 'reduced', 'improved', 'validated', 'latency', 'availability'])
      || /\b\d+(?:\.\d+)?\s*%/.test(answer);
    const structurePoints = (hasSituation ? 15 : 0) + (hasTask ? 15 : 0) + (hasAction ? 20 : 0) + (hasResult ? 20 : 0);
    const keywordPoints = Math.round((matchedKeywords.length / Math.max(1, expectedKeywords.length)) * 30);
    const score = Math.min(100, structurePoints + keywordPoints);
    const rubricFeedback = { situation: hasSituation, task: hasTask, action: hasAction, result: hasResult };

    const { data: attempt, error: insertError } = await admin
      .from('interview_attempts')
      .upsert({
        user_id: user.id,
        question_id: question.id,
        request_id: requestId,
        user_answer: answer,
        score,
        matched_keywords: matchedKeywords,
        rubric_feedback: rubricFeedback,
      }, { onConflict: 'user_id,request_id', ignoreDuplicates: true })
      .select('id,question_id,user_answer,score,matched_keywords,rubric_feedback,created_at')
      .maybeSingle();
    if (insertError || !attempt) {
      if (insertError) {
        observability.log('error', 'interview_attempt.write_failed', { error_code: insertError.code || 'unknown' });
        return json({ error: 'Your answer was scored, but could not be saved. Please retry.' }, 503);
      }
      const { data: existingAttempt, error: existingAttemptError } = await admin
        .from('interview_attempts')
        .select('id,question_id,user_answer,score,matched_keywords,rubric_feedback,created_at')
        .eq('user_id', user.id)
        .eq('request_id', requestId)
        .maybeSingle();
      if (existingAttemptError || !existingAttempt) {
        observability.log('error', 'interview_attempt.retry_lookup_failed', { error_code: existingAttemptError?.code || 'not_found' });
        return json({ error: 'Your answer could not be confirmed as saved. Please retry.' }, 503);
      }
      if (existingAttempt.question_id !== question.id || existingAttempt.user_answer !== answer) {
        return json({ error: 'This submission key has already been used for a different answer.' }, 409);
      }
      return json({
        attempt: {
          ...existingAttempt,
          expected_keywords: expectedKeywords,
          model_answer: question.model_answer,
        },
      });
    }

    return json({
      attempt: {
        ...attempt,
        expected_keywords: expectedKeywords,
        model_answer: question.model_answer,
      },
    });
  } catch (error) {
    observability.log('error', 'interview_scoring.request_failed', { error_name: error instanceof Error ? error.name : 'UnknownError' });
    return json({ error: 'Interview scoring is temporarily unavailable. Please retry.' }, 500);
  }
});
