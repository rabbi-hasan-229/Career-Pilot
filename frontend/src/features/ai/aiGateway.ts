import { supabase } from '../../lib/supabase';
import type { RolePlanOutline } from '../roadmap/careerCatalog';

export type AIFeature = 'coach' | 'cv' | 'interview' | 'role';

export type AIQuotaSummary = Record<AIFeature, { used: number; limit: number; remaining: number }>;

export type LiveVoiceName = 'Kore' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir';

export interface LiveInterviewTokenResponse {
  token: string;
  api_version?: 'v1alpha' | 'v1beta';
  live_models: string[];
  default_voice: LiveVoiceName;
  expires_at: string;
}

export interface ConversationalInterviewTurnResponse {
  action: 'start_question' | 'clarify' | 'ask_followup' | 'evaluate' | 'debrief';
  reply: string;
  score?: number;
  signal_label?: 'Strong Signal' | 'Solid Foundation' | 'Developing';
  strengths?: string[];
  growth_tip?: string;
  critique?: string;
  overall_score?: number;
  readiness_label?: 'Strong Hire Signal' | 'Solid Progress' | 'Promising Foundation' | 'Warm-Up Complete';
  dimensions?: Array<{ label: string; score: number; comment: string }>;
  priority_improvements?: string[];
}

export function isRolePlanOutline(value: unknown, expectedRoleTitle: string): value is RolePlanOutline {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const outline = value as Partial<RolePlanOutline>;
  return typeof outline.role_title === 'string'
    && outline.role_title.trim().toLowerCase() === expectedRoleTitle.trim().toLowerCase()
    && Number.isFinite(outline.total_hours) && Number(outline.total_hours) >= 40 && Number(outline.total_hours) <= 480
    && Array.isArray(outline.milestones) && outline.milestones.length === 4
    && outline.milestones.every((milestone, index) => milestone && milestone.position === index + 1
      && typeof milestone.title === 'string' && milestone.title.trim().length > 0 && milestone.title.length <= 90
      && typeof milestone.focus === 'string' && milestone.focus.trim().length > 0 && milestone.focus.length <= 160
      && Array.isArray(milestone.skills) && milestone.skills.length >= 2 && milestone.skills.length <= 5
      && milestone.skills.every((skill) => typeof skill === 'string' && skill.trim().length > 0 && skill.length <= 70)
      && Number.isFinite(milestone.effort_hours) && milestone.effort_hours >= 5 && milestone.effort_hours <= 200)
    && outline.milestones.reduce((sum, milestone) => sum + milestone.effort_hours, 0) === outline.total_hours;
}

const featureLimits = {
  free: { coach: 50, cv: 20, interview: 60, role: 5 },
  premium: { coach: 250, cv: 80, interview: 300, role: 20 },
} as const;

export async function loadAIQuotaSummary(userId: string, plan: 'free' | 'premium'): Promise<AIQuotaSummary> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('ai_usage')
    .select('feature,created_at')
    .eq('user_id', userId)
    .gte('created_at', since);
  if (error) throw error;

  const used = { coach: 0, cv: 0, interview: 0, role: 0 };
  for (const row of data ?? []) {
    if (row.feature in used) used[row.feature as AIFeature] += 1;
  }
  const limits = featureLimits[plan];
  return {
    coach: { used: used.coach, limit: limits.coach, remaining: Math.max(0, limits.coach - used.coach) },
    cv: { used: used.cv, limit: limits.cv, remaining: Math.max(0, limits.cv - used.cv) },
    interview: { used: used.interview, limit: limits.interview, remaining: Math.max(0, limits.interview - used.interview) },
    role: { used: used.role, limit: limits.role, remaining: Math.max(0, limits.role - used.role) },
  };
}

export interface AIGatewayResult<T> {
  source: 'model';
  model?: string;
  cached: boolean;
  response: T;
  usage: {
    feature: AIFeature;
    tokens_in: number;
    tokens_out: number;
    remaining_quota: number;
  };
}

export async function requestAI<T>(feature: AIFeature, input: Record<string, unknown>): Promise<AIGatewayResult<T>> {
  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: { feature, input },
  });

  if (error) {
    const context = (error as Error & { context?: unknown }).context;
    if (context instanceof Response) {
      let payload: { error?: string; message?: string; request_id?: string } | null = null;
      try {
        payload = await context.clone().json() as { error?: string; message?: string; request_id?: string };
      } catch { /* Use the SDK error when the response isn't JSON. */ }
      const message = payload?.message || payload?.error || error.message || 'Could not contact the AI service.';
      const requestId = payload?.request_id || context.headers.get('x-request-id');
      throw new Error(requestId ? `${message} (Reference: ${requestId})` : message);
    }
    throw new Error(error.message || 'Could not contact the AI service.');
  }

  if (!data || typeof data !== 'object') throw new Error('The AI service returned an invalid response.');
  const payload = data as Partial<AIGatewayResult<T>> & { error?: string; message?: string };
  if (payload.error) throw new Error(payload.message || payload.error);
  if (!payload.response || !payload.usage) throw new Error('The AI service returned an incomplete response.');
  return payload as AIGatewayResult<T>;
}

/** Mint a short-lived ephemeral token for browser WebSocket connection to Gemini Live API. */
export async function requestLiveInterviewToken(input: {
  target_role?: string;
  voice_name?: LiveVoiceName;
}): Promise<AIGatewayResult<LiveInterviewTokenResponse>> {
  return requestAI<LiveInterviewTokenResponse>('interview', {
    mode: 'live_token',
    target_role: input.target_role || '',
    voice_name: input.voice_name || 'Kore',
  });
}

/** Transcribe recorded speech audio via Gemini transcription + Flash fallbacks. */
export async function transcribeSpeechAudio(input: {
  audio_base64: string;
  mime_type: string;
  hint?: string;
}): Promise<AIGatewayResult<{ transcript: string }>> {
  return requestAI<{ transcript: string }>('interview', {
    mode: 'transcribe',
    audio_base64: input.audio_base64,
    mime_type: input.mime_type,
    hint: input.hint || '',
  });
}

/** Generate natural Gemini speech audio for an interviewer prompt. */
export async function synthesizeInterviewSpeech(input: {
  text: string;
  voice_name?: LiveVoiceName;
}): Promise<AIGatewayResult<{ audio_base64: string; mime_type: string }>> {
  return requestAI<{ audio_base64: string; mime_type: string }>('interview', {
    mode: 'tts',
    text: input.text.slice(0, 1500),
    voice_name: input.voice_name || 'Kore',
  });
}

/** Generate a realistic human interviewer turn (opening, warmup-to-Q1, clarification, follow-up, evaluation, or debrief). */
export async function requestInterviewTurn(input: {
  stage: 'opening' | 'warmup' | 'questioning' | 'debrief';
  target_role: string;
  experience_level?: string;
  focus_mode?: string;
  candidate_name?: string;
  question: string;
  answer: string;
  rubric?: string;
  history?: string;
  follow_up_count?: number;
}): Promise<AIGatewayResult<ConversationalInterviewTurnResponse>> {
  return requestAI<ConversationalInterviewTurnResponse>('interview', {
    mode: 'converse',
    stage: input.stage,
    target_role: input.target_role,
    experience_level: input.experience_level || '',
    focus_mode: input.focus_mode || '',
    candidate_name: input.candidate_name || '',
    question: input.question,
    answer: input.answer,
    rubric: input.rubric || '',
    history: input.history || '',
    follow_up_count: String(input.follow_up_count ?? 0),
  });
}
