// Retired endpoint. Email OTPs are now issued and verified by Supabase Auth.
// Keep this response for deployments that still have the old function URL so it
// cannot continue accepting requests or writing raw OTPs to public.auth_otps.
import { serveObservedEdgeFunction } from '../_shared/observability.ts';

serveObservedEdgeFunction('send-email-otp', (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  return new Response(JSON.stringify({ error: 'This endpoint is retired. Use Supabase Auth email OTP.' }), {
    status: 410,
    headers,
  });
});
