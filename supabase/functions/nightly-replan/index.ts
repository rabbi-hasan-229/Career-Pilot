// Supabase Edge Function: nightly-replan
// Optional scheduled maintenance endpoint. Requests must authenticate with a
// dedicated secret; it intentionally does not accept normal user sessions.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { serveObservedEdgeFunction } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

async function matchesSecret(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const actual = new Uint8Array(providedHash);
  const wanted = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ wanted[index];
  return difference === 0;
}

serveObservedEdgeFunction('nightly-replan', async (req: Request, observability) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get('NIGHTLY_REPLAN_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!expectedSecret || expectedSecret.length < 32 || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Scheduled re-planning is not configured.' }), { status: 503, headers: corsHeaders });
    }

    const authorization = req.headers.get('Authorization') || '';
    const providedSecret = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!providedSecret || !(await matchesSecret(providedSecret, expectedSecret))) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401, headers: corsHeaders });
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Find overdue unfinished tasks (due_date < today and done_at is null)
    const { data: overdueTasks, error: taskError } = await sb
      .from('tasks')
      .select('id, user_id, title, due_date')
      .lt('due_date', todayStr)
      .is('done_at', null);

    if (taskError) {
      throw taskError;
    }

    let rescheduledCount = 0;

    if (overdueTasks && overdueTasks.length > 0) {
      // Shift each overdue task forward to next available weekday
      for (const t of overdueTasks) {
        const nextDate = new Date();
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        // If weekend, advance to Monday
        if (nextDate.getUTCDay() === 0) nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        if (nextDate.getUTCDay() === 6) nextDate.setUTCDate(nextDate.getUTCDate() + 2);

        const { error: updateError } = await sb
          .from('tasks')
          .update({ due_date: nextDate.toISOString().split('T')[0] })
          .eq('id', t.id);
        if (updateError) throw updateError;

        rescheduledCount++;
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        processed_date: todayStr,
        overdue_rescheduled: rescheduledCount,
        cost_cents: 0,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: unknown) {
    observability.log('error', 'nightly_replan.request_failed', { error_name: err instanceof Error ? err.name : 'UnknownError' });
    return new Response(JSON.stringify({ error: 'Scheduled re-planning failed.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
