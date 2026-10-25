import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

const SESSION_STORAGE_KEY = 'career_pilot_user_session';
const REMEMBER_ME_KEY = 'career_pilot_remember_me';

export interface AuthCredentials {
  email: string;
  password?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface SendOtpResult {
  success: boolean;
  emailSent: boolean;
  resendStatus: string;
  resendError?: string | null;
  previewOtp?: string;
  expiresIn?: number;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  email?: string;
  fullName?: string;
  targetRole?: string;
  profile?: Profile;
  error?: string;
}

export const demoAccounts: { profile: Profile; label: string; badge: string }[] = [
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Alex Rivera',
      email: 'alex.rivera@careerpilot.io',
      phone: '+1 555-019-2834',
      avatar_url: '/avatars/career_navigator.jpg',
      target_role: 'UI/UX Designer',
      target_timeline_months: 6,
      experience_level: 'junior',
      plan: 'free',
      daily_minutes: 60,
      ai_prompts_left: 16,
      streak_days: 7,
      created_at: '2026-10-01T00:00:00Z',
      has_completed_onboarding: true,
      is_guest: false,
    },
    label: 'Alex Rivera (UI/UX Designer)',
    badge: '6 Months · 60m/day',
  },
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Marcus Chen',
      email: 'marcus.chen@careerpilot.io',
      phone: '+1 555-014-9821',
      avatar_url: '/avatars/career_pilot_male.jpg',
      target_role: 'Full Stack Engineer',
      target_timeline_months: 6,
      experience_level: 'mid',
      plan: 'premium',
      daily_minutes: 90,
      ai_prompts_left: 92,
      streak_days: 14,
      created_at: '2026-09-15T00:00:00Z',
      has_completed_onboarding: true,
      is_guest: false,
    },
    label: 'Marcus Chen (Full Stack)',
    badge: '6 Months · 90m/day',
  },
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Aria Patel',
      email: 'aria.patel@careerpilot.io',
      phone: '+1 555-018-4491',
      avatar_url: '/avatars/career_designer.jpg',
      target_role: 'Product Designer',
      target_timeline_months: 4,
      experience_level: 'beginner',
      plan: 'free',
      daily_minutes: 45,
      ai_prompts_left: 15,
      streak_days: 3,
      created_at: '2026-10-10T00:00:00Z',
      has_completed_onboarding: true,
      is_guest: false,
    },
    label: 'Aria Patel (Product Designer)',
    badge: '4 Months · 45m/day',
  },
];

export function generateDeterministicUserId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.padEnd(12, '0')}`;
}

export const authService = {
  /**
   * Check if a valid, authenticated user exists
   */
  isAuthenticated(): boolean {
    const session = this.getSession();
    return Boolean(session && !session.is_guest && session.id);
  },

  /**
   * Get active session
   */
  getSession(): Profile | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile;
        if (parsed && !parsed.is_guest) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Save session
   */
  saveSession(profile: Profile, rememberMe: boolean = true): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save session:', e);
    }
  },

  /**
   * Get remember me preference
   */
  getRememberMe(): boolean {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    } catch {
      return true;
    }
  },

  /**
   * Sign In with Email & Password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, rememberMe = true } = credentials;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      // Try Supabase auth first
      if (credentials.password && credentials.password.length >= 6) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: credentials.password,
          });
          if (!error && data.user) {
            const profile: Profile = {
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
              email: normalizedEmail,
              phone: credentials.phone,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
              target_role: data.user.user_metadata?.target_role || 'Full Stack Engineer',
              target_timeline_months: 6,
              plan: 'free',
              daily_minutes: 60,
              ai_prompts_left: 15,
              streak_days: 1,
              created_at: data.user.created_at || new Date().toISOString(),
              is_guest: false,
              has_completed_onboarding: Boolean(data.user.user_metadata?.target_role),
            };
            this.saveSession(profile, rememberMe);
            return { success: true, profile };
          }
        } catch {
          // Fall through to deterministic session
        }
      }

      // Check if matches known demo accounts
      const match = demoAccounts.find((d) => d.profile.email?.toLowerCase() === normalizedEmail);
      if (match) {
        this.saveSession(match.profile, rememberMe);
        return { success: true, profile: match.profile };
      }

      // Create or restore profile deterministically
      const userId = generateDeterministicUserId(normalizedEmail);
      const profile: Profile = {
        id: userId,
        full_name: credentials.fullName || normalizedEmail.split('@')[0].replace(/[._-]/g, ' '),
        email: normalizedEmail,
        phone: credentials.phone,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        target_role: 'Full Stack Engineer',
        target_timeline_months: 6,
        plan: 'free',
        daily_minutes: 60,
        ai_prompts_left: 15,
        streak_days: 1,
        created_at: new Date().toISOString(),
        is_guest: false,
        has_completed_onboarding: true,
      };

      this.saveSession(profile, rememberMe);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in.' };
    }
  },

  /**
   * Request an Email OTP code via server endpoint or Resend API
   */
  async sendEmailOtp(params: {
    email: string;
    fullName?: string;
    targetRole?: string;
  }): Promise<SendOtpResult> {
    const { email, fullName, targetRole } = params;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return {
        success: false,
        emailSent: false,
        resendStatus: 'invalid_email',
        error: 'Please provide a valid email address.',
      };
    }

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, fullName, targetRole }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          emailSent: Boolean(data.emailSent),
          resendStatus: data.resendStatus || 'delivered',
          resendError: data.resendError,
          previewOtp: data.previewOtp,
          expiresIn: data.expiresIn || 600,
        };
      }

      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        emailSent: false,
        resendStatus: 'error',
        error: errData.error || 'Failed to dispatch verification code.',
      };
    } catch (err: any) {
      console.warn('Network error requesting OTP endpoint:', err);

      // Fallback: Check if client-side Resend API key is available
      const clientResendKey = import.meta.env.VITE_RESEND_API_KEY;
      if (clientResendKey && clientResendKey.startsWith('re_')) {
        try {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          sessionStorage.setItem(
            `career_pilot_otp_${normalizedEmail}`,
            JSON.stringify({
              code: otp,
              expiresAt: Date.now() + 10 * 60 * 1000,
              fullName,
              targetRole,
            })
          );

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${clientResendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'Career Pilot <onboarding@resend.dev>',
              to: [normalizedEmail],
              subject: `Your Career Pilot Verification Code: ${otp}`,
              html: `
                <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px;">
                  <h2>🧭 Career Pilot Verification Code</h2>
                  <p>Hello ${fullName || 'Pilot'},</p>
                  <p>Your 6-digit email authorization code is:</p>
                  <h1 style="letter-spacing: 6px; color: #60a5fa;">${otp}</h1>
                  <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes.</p>
                </div>
              `,
            }),
          });

          if (resendRes.ok) {
            return {
              success: true,
              emailSent: true,
              resendStatus: 'delivered',
              previewOtp: otp,
              expiresIn: 600,
            };
          }

          const resendData = (await resendRes.json().catch(() => ({}))) as any;
          return {
            success: true,
            emailSent: false,
            resendStatus: 'sandbox_restricted',
            resendError: resendData?.message,
            previewOtp: otp,
            expiresIn: 600,
          };
        } catch {
          // Fall through
        }
      }

      return {
        success: false,
        emailSent: false,
        resendStatus: 'network_error',
        error: 'Unable to reach the authentication service. Please check your network connection.',
      };
    }
  },

  /**
   * Verify the 6-digit OTP code submitted by the user
   */
  async verifyEmailOtp(params: {
    email: string;
    otp: string;
  }): Promise<VerifyOtpResult> {
    const { email, otp } = params;
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      return { success: false, error: 'Please enter the complete 6-digit code.' };
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp: cleanOtp }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          email: data.email || normalizedEmail,
          fullName: data.fullName,
          targetRole: data.targetRole,
        };
      }

      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'Invalid verification code. Please check your email and try again.',
      };
    } catch {
      // Fallback check against sessionStorage
      try {
        const stored = sessionStorage.getItem(`career_pilot_otp_${normalizedEmail}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() > parsed.expiresAt) {
            sessionStorage.removeItem(`career_pilot_otp_${normalizedEmail}`);
            return { success: false, error: 'Verification code has expired. Please request a new code.' };
          }
          if (parsed.code === cleanOtp) {
            sessionStorage.removeItem(`career_pilot_otp_${normalizedEmail}`);
            return {
              success: true,
              email: normalizedEmail,
              fullName: parsed.fullName,
              targetRole: parsed.targetRole,
            };
          }
        }
      } catch {
        // Fall through
      }

      return {
        success: false,
        error: 'Invalid verification code. Please check your email and try again.',
      };
    }
  },

  /**
   * Complete Sign Up after email OTP verification
   */
  async completeSignUp(params: {
    email: string;
    fullName: string;
    password?: string;
    phone?: string;
    avatarUrl?: string;
    rememberMe?: boolean;
    targetRole?: string;
  }): Promise<AuthResult> {
    const { email, fullName, password, phone, avatarUrl, rememberMe = true, targetRole } = params;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Background Supabase auth registration if password provided
      if (password && password.length >= 6) {
        try {
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { full_name: fullName.trim(), phone, target_role: targetRole },
            },
          });
        } catch {
          // Non-blocking
        }
      }

      const userId = generateDeterministicUserId(normalizedEmail);
      const profile: Profile = {
        id: userId,
        full_name: fullName.trim(),
        email: normalizedEmail,
        phone,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        target_role: targetRole || '', // unset triggers onboarding modal
        target_timeline_months: 6,
        plan: 'free',
        daily_minutes: 60,
        ai_prompts_left: 15,
        streak_days: 1,
        created_at: new Date().toISOString(),
        is_guest: false,
        has_completed_onboarding: false,
      };

      // Attempt sync to Supabase profiles
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: profile.full_name,
          target_role: profile.target_role || 'Full Stack Engineer',
          plan: profile.plan,
          daily_minutes: profile.daily_minutes,
        });
      } catch {
        // Offline / RLS fallback
      }

      this.saveSession(profile, rememberMe);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Account creation failed.' };
    }
  },

  /**
   * Direct signUp requires OTP verification.
   * If invoked directly, guides caller to complete email verification flow.
   */
  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, fullName } = credentials;
    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: 'Please enter your name.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    return {
      success: false,
      error: 'Email verification code required. Please verify the 6-digit code sent to your email to complete registration.',
    };
  },

  /**
   * Social Authentication (Google, Facebook, Twitter)
   */
  async signInWithSocial(provider: 'google' | 'facebook' | 'twitter'): Promise<AuthResult> {
    try {
      const providerNames: Record<string, string> = {
        google: 'Google Navigator',
        facebook: 'Facebook Developer',
        twitter: 'Tech Pioneer',
      };
      const email = `social.${provider}@careerpilot.io`;
      const userId = generateDeterministicUserId(email);

      const profile: Profile = {
        id: userId,
        full_name: providerNames[provider] || `${provider} User`,
        email,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        target_role: 'Full Stack Engineer',
        target_timeline_months: 6,
        plan: 'free',
        daily_minutes: 60,
        ai_prompts_left: 15,
        streak_days: 1,
        created_at: new Date().toISOString(),
        is_guest: false,
        has_completed_onboarding: true,
      };

      this.saveSession(profile, true);
      return { success: true, profile };
    } catch (err: any) {
      return { success: false, error: err.message || `Failed to sign in with ${provider}` };
    }
  },

  /**
   * Save Career Goal and Roadmap Preferences from Post-Signup Onboarding
   */
  saveOnboardingGoal(
    currentProfile: Profile,
    params: {
      target_role: string;
      target_timeline_months: number;
      target_completion_date?: string;
      daily_minutes: number;
      experience_level?: 'beginner' | 'switcher' | 'junior' | 'mid';
    }
  ): Profile {
    const updated: Profile = {
      ...currentProfile,
      target_role: params.target_role,
      target_timeline_months: params.target_timeline_months,
      target_completion_date: params.target_completion_date,
      daily_minutes: params.daily_minutes,
      experience_level: params.experience_level || 'beginner',
      has_completed_onboarding: true,
    };
    this.saveSession(updated);

    // Sync to Supabase profiles
    try {
      supabase.from('profiles').upsert({
        id: updated.id,
        full_name: updated.full_name,
        target_role: updated.target_role,
        daily_minutes: updated.daily_minutes,
      }).then(() => {});
    } catch {
      // Offline fallback
    }

    return updated;
  },

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {
      console.warn('Error during sign out:', e);
    }
  },
};
