// Supabase Edge Function: plan-roadmap
// Implementation of Section 6 (Rule-based roadmap and planner engine)
// Zero-AI Cost: Mathematical proportional effort distribution

import { createClient } from 'npm:@supabase/supabase-js@2';

interface PlanRequest {
  user_id: string;
  role_slug: string;
  target_date: string; // ISO date 'YYYY-MM-DD'
  daily_minutes?: number; // default 60
}

interface MilestoneTemplate {
  id: string;
  position: number;
  title: string;
  effort_hours: number;
  island_zone?: string;
}

Deno.serve(async (req: Request) => {
  // CORS headers
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

    const { user_id, role_slug, target_date, daily_minutes = 60 } = await req.json() as PlanRequest;

    if (!user_id || !role_slug || !target_date) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Pick a template from roles & role_milestones
    const { data: role, error: roleError } = await sb
      .from('roles')
      .select('id, title, slug')
      .eq('slug', role_slug)
      .single();

    if (roleError || !role) {
      return new Response(JSON.stringify({ error: `Role '${role_slug}' not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: templates, error: tmplError } = await sb
      .from('role_milestones')
      .select('*')
      .eq('role_id', role.id)
      .order('position', { ascending: true });

    if (tmplError || !templates || templates.length === 0) {
      return new Response(JSON.stringify({ error: 'No milestone templates found for role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Allocate time proportionally
    // Total effort sum E = sum(E_i)
    const totalEffortHours = templates.reduce((sum: number, m: MilestoneTemplate) => sum + m.effort_hours, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const target = new Date(target_date);
    target.setUTCHours(0, 0, 0, 0);

    const diffDays = Math.max(1, Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, diffDays / 7);

    // Step 3: Feasibility check (required hours/day vs daily_minutes)
    const requiredHoursPerDay = totalEffortHours / diffDays;
    const userCapacityHoursPerDay = daily_minutes / 60;
    const isOverloaded = requiredHoursPerDay > userCapacityHoursPerDay;

    // Step 4: Proportional distribution: weeks_i = W * (E_i / sum(E))
    let currentDate = new Date(today);
    const plannedMilestones = [];

    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i];
      const milestoneWeeks = totalWeeks * (tmpl.effort_hours / totalEffortHours);
      const milestoneDays = Math.max(3, Math.round(milestoneWeeks * 7));

      const startDate = new Date(currentDate);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + milestoneDays);

      plannedMilestones.push({
        position: tmpl.position,
        title: tmpl.title,
        effort_hours: tmpl.effort_hours,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        island_zone: tmpl.island_zone || 'Coastal Shore',
        status: i === 0 ? 'doing' : 'todo',
      });

      currentDate = new Date(endDate);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return new Response(
      JSON.stringify({
        role: role.title,
        target_date,
        total_effort_hours: totalEffortHours,
        diff_days: diffDays,
        is_overloaded: isOverloaded,
        suggested_daily_minutes: Math.round(requiredHoursPerDay * 60),
        milestones: plannedMilestones,
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
