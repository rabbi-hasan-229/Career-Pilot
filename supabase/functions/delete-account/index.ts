// Deletes the authenticated user's Auth identity; profile ownership cascades
// remove user-owned application data through database foreign keys.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { serveObservedEdgeFunction } from '../_shared/observability.ts';

serveObservedEdgeFunction('delete-account', async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const authorization = req.headers.get('Authorization') || '';
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!accessToken) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Account deletion is not configured on this server.');
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !user) return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401, headers });

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Account deletion failed.';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
