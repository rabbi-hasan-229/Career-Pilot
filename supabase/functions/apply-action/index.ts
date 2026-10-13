// Supabase Edge Function: apply-action
// Handles Planner Quick Actions without calling AI:
// - 'behind' (shift milestone later, compress optional tasks)
// - 'early' (pull next milestone forward)
// - 'pause' (shift all dates by 7 days)

import { createClient } from 'npm:@supabase/supabase-js@2';

interface ActionRequest {
  user_id: string;
  roadmap_id: string;
  action_type: 'behind' | 'early' | 'pause';
  days?: number; // default 3 or 7
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { user_id, roadmap_id, action_type, days = 7 } = await req.json() as ActionRequest;

    if (!user_id || !roadmap_id || !action_type) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user milestones
    const { data: milestones, error } = await sb
      .from('milestones')
      .select('*')
      .eq('roadmap_id', roadmap_id)
      .eq('user_id', user_id)
      .order('position', { ascending: true });

    if (error || !milestones) {
      return new Response(JSON.stringify({ error: 'Could not fetch user milestones' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let modifiedCount = 0;

    if (action_type === 'pause') {
      // Shift every uncompleted milestone by +7 days
      for (const m of milestones) {
        if (m.status !== 'done' && m.start_date && m.end_date) {
          const newStart = new Date(m.start_date);
          newStart.setUTCDate(newStart.getUTCDate() + 7);
          const newEnd = new Date(m.end_date);
          newEnd.setUTCDate(newEnd.getUTCDate() + 7);

          await sb
            .from('milestones')
            .update({
              start_date: newStart.toISOString().split('T')[0],
              end_date: newEnd.toISOString().split('T')[0],
            })
            .eq('id', m.id);

          modifiedCount++;
        }
      }
    } else if (action_type === 'behind') {
      // Shift currently active milestone by +3 days
      const active = milestones.find((m) => m.status === 'doing');
      if (active && active.end_date) {
        const shiftDays = days || 3;
        const newEnd = new Date(active.end_date);
        newEnd.setUTCDate(newEnd.getUTCDate() + shiftDays);

        await sb
          .from('milestones')
          .update({ end_date: newEnd.toISOString().split('T')[0] })
          .eq('id', active.id);

        modifiedCount++;
      }
    } else if (action_type === 'early') {
      // Advance to next milestone
      const activeIdx = milestones.findIndex((m) => m.status === 'doing');
      if (activeIdx >= 0) {
        await sb
          .from('milestones')
          .update({ status: 'done' })
          .eq('id', milestones[activeIdx].id);

        if (activeIdx + 1 < milestones.length) {
          await sb
            .from('milestones')
            .update({ status: 'doing' })
            .eq('id', milestones[activeIdx + 1].id);
        }
        modifiedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: action_type,
        modified_milestones: modifiedCount,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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
