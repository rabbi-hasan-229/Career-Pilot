// Supabase Edge Function: send-email-otp
// Generates 6-digit OTP, records it in public.auth_otps, and dispatches email via Resend API

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { email, fullName = 'Adventurer', targetRole = 'Full Stack Engineer' } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // 1. Record in auth_otps
    const { error: dbError } = await sb.from('auth_otps').insert({
      email: normalizedEmail,
      otp_code: otp,
      full_name: fullName,
      target_role: targetRole,
      expires_at: expiresAt,
    });

    if (dbError) {
      console.warn('Database OTP insert error:', dbError);
    }

    // 2. Dispatch via Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const sender = Deno.env.get('RESEND_FROM_EMAIL') || 'Career Pilot <onboarding@resend.dev>';
    let emailSent = false;
    let resendMessage = null;

    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender,
          to: [normalizedEmail],
          subject: `Your Career Pilot Verification Code: ${otp}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 20px; padding: 36px 28px; border: 1px solid #334155;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">🧭 Career Pilot</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Gamified Career Acceleration & Roadmap Quest</p>
              </div>
              <div style="background: #1e293b; border-radius: 16px; padding: 24px; text-align: center; border: 1px solid #475569;">
                <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
                <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5;">Enter the following 6-digit authorization code to verify your email and embark on your career quest:</p>
                <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #818cf8; background: #0f172a; padding: 18px 24px; border-radius: 12px; display: inline-block; margin: 16px 0; border: 2px dashed #6366f1;">
                  ${otp}
                </div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">⏳ This code is valid for <strong>10 minutes</strong>.</p>
              </div>
              <p style="font-size: 11.5px; color: #64748b; text-align: center; margin-top: 24px;">
                If you did not request this login code, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
      } else {
        const errJson = await resendRes.json();
        resendMessage = errJson.message || 'Resend error';
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        resendConfigured: Boolean(resendApiKey),
        resendMessage,
        expiresAt,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
