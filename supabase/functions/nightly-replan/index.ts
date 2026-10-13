// Supabase Edge Function: nightly-replan
// Implementation of Section 6 (Nightly automated rescheduling via pg_cron)
// Zero-AI cost deterministic batch processor

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

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

        await sb
          .from('tasks')
          .update({ due_date: nextDate.toISOString().split('T')[0] })
          .eq('id', t.id);

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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
