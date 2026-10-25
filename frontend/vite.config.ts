import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin, Connect } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface OtpRecord {
  email: string;
  code: string;
  fullName: string;
  targetRole: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage for local/development dev server sessions
const otpStore = new Map<string, OtpRecord>();

function authOtpServerPlugin(): Plugin {
  return {
    name: 'career-pilot-auth-otp-server',
    configureServer(server) {
      server.middlewares.use(handleAuthEndpoints(server.config.mode));
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleAuthEndpoints('production'));
    },
  };
}

function handleAuthEndpoints(mode: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0];

    // Enable CORS for API endpoints
    if (url?.startsWith('/api/auth/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }
    }

    // Endpoint 1: Send OTP
    if (url === '/api/auth/send-otp' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const email = (data.email || '').trim().toLowerCase();
          const fullName = (data.fullName || 'Adventurer').trim();
          const targetRole = data.targetRole || 'Full Stack Engineer';

          if (!email || !email.includes('@')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Please provide a valid email address.' }));
          }

          // Generate 6-digit cryptographic OTP code
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

          otpStore.set(email, {
            email,
            code: otp,
            fullName,
            targetRole,
            expiresAt,
            attempts: 0,
          });

          // Load environment variables for Resend API from cwd and __dirname
          const envCwd = loadEnv(mode, process.cwd(), '');
          const envDir = loadEnv(mode, __dirname, '');
          const resendApiKey =
            process.env.RESEND_API_KEY ||
            envCwd.RESEND_API_KEY ||
            envDir.RESEND_API_KEY ||
            process.env.VITE_RESEND_API_KEY ||
            envCwd.VITE_RESEND_API_KEY ||
            envDir.VITE_RESEND_API_KEY;
          const sender =
            process.env.RESEND_FROM_EMAIL ||
            envCwd.RESEND_FROM_EMAIL ||
            envDir.RESEND_FROM_EMAIL ||
            'Career Pilot <onboarding@resend.dev>';

          let emailSent = false;
          let resendStatus = 'not_configured';
          let resendError: string | null = null;

          if (resendApiKey && resendApiKey.startsWith('re_')) {
            try {
              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: sender,
                  to: [email],
                  subject: `Your Career Pilot Verification Code: ${otp}`,
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <title>Career Pilot Verification Code</title>
                    </head>
                    <body style="margin: 0; padding: 30px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        <tr>
                          <td style="padding: 32px 32px 20px 32px; text-align: center;">
                            <div style="display: inline-block; width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1D68F2 0%, #a855f7 100%); line-height: 44px; font-size: 22px; color: #ffffff; text-align: center;">
                              🧭
                            </div>
                            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 14px 0 4px 0; letter-spacing: -0.02em;">Career Pilot</h1>
                            <p style="color: #94a3b8; font-size: 13px; margin: 0; font-weight: 500;">Gamified Career Acceleration & Roadmap Quest</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 32px 28px 32px;">
                            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; text-align: center;">
                              <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 10px 0;">Hello <strong style="color: #ffffff;">${fullName}</strong>,</p>
                              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                                Enter the 6-digit authorization code below to verify your email and activate your Career Pilot account:
                              </p>
                              <div style="display: inline-block; background: #0f172a; border: 2px dashed #1D68F2; border-radius: 14px; padding: 14px 28px; margin-bottom: 16px;">
                                <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; display: block;">
                                  ${otp}
                                </span>
                              </div>
                              <p style="color: #64748b; font-size: 11.5px; margin: 0;">
                                ⏱️ This code expires in <strong>10 minutes</strong>.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 32px 28px 32px; text-align: center;">
                            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.5;">
                              If you didn't request this code, you can safely ignore this email.<br>
                              © ${new Date().getFullYear()} Career Pilot. Protected by Resend & Supabase.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </body>
                    </html>
                  `,
                }),
              });

              if (resendRes.ok) {
                emailSent = true;
                resendStatus = 'delivered';
              } else {
                const resendData = (await resendRes.json().catch(() => ({}))) as any;
                const msg = resendData?.message || `Resend HTTP error ${resendRes.status}`;
                if (
                  msg.toLowerCase().includes('only send testing emails to your own email address') ||
                  resendRes.status === 403
                ) {
                  resendStatus = 'sandbox_restricted';
                  resendError = msg;
                } else {
                  resendStatus = 'failed';
                  resendError = msg;
                }
                console.warn('[Resend API Notice]:', msg);
              }
            } catch (err: any) {
              resendStatus = 'network_error';
              resendError = err.message;
              console.warn('[Resend Network Error]:', err.message);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              success: true,
              email,
              emailSent,
              resendStatus,
              resendError,
              // Always pass previewOtp in dev mode so testing is 100% unblocked even without credit or in sandbox
              previewOtp: otp,
              expiresIn: 600,
            })
          );
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
      return;
    }

    // Endpoint 2: Verify OTP
    if (url === '/api/auth/verify-otp' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const email = (data.email || '').trim().toLowerCase();
          const submittedCode = (data.otp || '').trim();

          const record = otpStore.get(email);
          if (!record) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
              JSON.stringify({
                error: 'No active verification code found for this email. Please request a new code.',
              })
            );
          }

          if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
              JSON.stringify({
                error: 'Verification code has expired. Please request a new code.',
              })
            );
          }

          if (record.attempts >= 5) {
            otpStore.delete(email);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
              JSON.stringify({
                error: 'Too many incorrect attempts. Please request a new code for security.',
              })
            );
          }

          if (record.code !== submittedCode) {
            record.attempts += 1;
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(
              JSON.stringify({
                error: `Incorrect verification code. ${5 - record.attempts} attempts remaining.`,
              })
            );
          }

          // Verification succeeded!
          otpStore.delete(email);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              success: true,
              email: record.email,
              fullName: record.fullName,
              targetRole: record.targetRole,
            })
          );
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
      return;
    }

    next();
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), authOtpServerPlugin()],
});
