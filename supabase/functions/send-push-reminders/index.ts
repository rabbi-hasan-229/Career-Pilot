import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@4.0.0';
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

function localClock(timeZone: string): { date: string; hour: number } {
  let safeTimeZone = timeZone;
  try { new Intl.DateTimeFormat('en-US', { timeZone }).format(); }
  catch { safeTimeZone = 'UTC'; }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value || '';
  return { date: `${part('year')}-${part('month')}-${part('day')}`, hour: Number(part('hour')) };
}

function isSupportedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (
      host === 'fcm.googleapis.com'
      || host.endsWith('.push.services.mozilla.com')
      || host === 'push.services.mozilla.com'
      || host.endsWith('.push.apple.com')
      || host === 'notify.windows.com'
      || host.endsWith('.notify.windows.com')
    );
  } catch {
    return false;
  }
}

serveObservedEdgeFunction('send-push-reminders', async (req: Request, observability) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers: corsHeaders });

  try {
    const expectedSecret = Deno.env.get('PUSH_SCHEDULER_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('WEB_PUSH_SUBJECT');
    if (!expectedSecret || expectedSecret.length < 32 || !supabaseUrl || !serviceKey
      || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      return new Response(JSON.stringify({ error: 'Push reminders are not configured.' }), { status: 503, headers: corsHeaders });
    }
    const bearer = req.headers.get('Authorization') || '';
    const providedSecret = bearer.startsWith('Bearer ') ? bearer.slice(7) : '';
    if (!providedSecret || !(await matchesSecret(providedSecret, expectedSecret))) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401, headers: corsHeaders });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const sb = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const subscriptions = [];
    for (let offset = 0; ; offset += 500) {
      const { data: page, error } = await sb
        .from('user_push_subscriptions')
        .select('id,user_id,endpoint,p256dh,auth_secret,timezone,last_sent_on,profiles!user_push_subscriptions_user_id_fkey(notification_daily_reminder,target_role)')
        .range(offset, offset + 499);
      if (error) throw error;
      subscriptions.push(...(page || []));
      if (!page || page.length < 500) break;
    }

    let sent = 0;
    let expired = 0;
    let skipped = 0;
    const deliveredByUser = new Map<string, { date: string; count: number; role: string }>();
    for (const row of subscriptions || []) {
      if (!isSupportedPushEndpoint(row.endpoint)) {
        observability.log('warn', 'push_subscription.unsupported_endpoint');
        skipped += 1;
        continue;
      }
      const clock = localClock(row.timezone || 'UTC');
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile || profile.notification_daily_reminder === false || clock.hour < 9 || clock.hour > 10 || row.last_sent_on === clock.date) {
        skipped += 1;
        continue;
      }
      const { count, error: taskError } = await sb.from('tasks')
        .select('id,milestones!inner(user_roadmaps!inner(status))', { count: 'exact', head: true })
        .eq('user_id', row.user_id).eq('milestones.user_roadmaps.status', 'active').is('done_at', null);
      if (taskError) throw taskError;
      if (!count) {
        await sb.from('user_push_subscriptions').update({ last_sent_on: clock.date }).eq('id', row.id);
        skipped += 1;
        continue;
      }
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_secret } }, JSON.stringify({
          title: 'Your Career Pilot roadmap is ready',
          body: `You have ${count} unfinished roadmap task${count === 1 ? '' : 's'} for ${profile.target_role || 'your career goal'}.`,
          url: '/', tag: `career-pilot-daily-${clock.date}`,
        }), { TTL: 3600, urgency: 'normal' });
        const { error: updateError } = await sb.from('user_push_subscriptions').update({ last_sent_on: clock.date }).eq('id', row.id);
        if (updateError) throw updateError;
        sent += 1;
        const existing = deliveredByUser.get(row.user_id);
        deliveredByUser.set(row.user_id, { date: clock.date, count, role: profile.target_role || existing?.role || 'your career goal' });
      } catch (sendError) {
        const statusCode = Number((sendError as { statusCode?: number })?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await sb.from('user_push_subscriptions').delete().eq('id', row.id);
          expired += 1;
          continue;
        }
        observability.log('error', 'push_delivery.failed', { status_code: statusCode || 'unknown' });
      }
    }

    for (const [userId, delivery] of deliveredByUser) {
      const { error: historyError } = await sb.from('user_notifications').insert({
        user_id: userId, category: 'task', title: 'Your Career Pilot roadmap is ready',
        body: `You have ${delivery.count} unfinished roadmap task${delivery.count === 1 ? '' : 's'} for ${delivery.role}.`,
        action_url: '/', metadata: { dedupe_key: `push_daily_reminder_${delivery.date}`, source: 'web_push' },
      });
      if (historyError && historyError.code !== '23505') throw historyError;
    }
    return new Response(JSON.stringify({ sent, expired, skipped }), { status: 200, headers: corsHeaders });
  } catch (error) {
    observability.log('error', 'push_reminder_job.failed', { error_name: error instanceof Error ? error.name : 'UnknownError' });
    return new Response(JSON.stringify({ error: 'Push reminder delivery failed.' }), { status: 500, headers: corsHeaders });
  }
});
