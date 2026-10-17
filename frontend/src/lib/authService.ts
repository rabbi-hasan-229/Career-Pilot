import { supabase } from './supabase';
import type { Profile } from '../types';

const SESSION_STORAGE_KEY = 'career_pilot_user_session';

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
  profile?: Profile;
  error?: string;
}

/**
 * Deterministically generates a valid UUID v4-like string from an email
 * so the user keeps a persistent unique ID across sessions.
 */
function generateDeterministicUserId(email: string): string {
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
   * Request an Email OTP code via Resend API and server endpoint
   */
  async sendEmailOtp(params: {
    email: string;
    fullName?: string;
    targetRole?: string;
  }): Promise<SendOtpResult> {
    const { email, fullName, targetRole } = params;
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, targetRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          emailSent: false,
          resendStatus: 'error',
          error: data.error || 'Failed to send verification code.',
        };
      }

      return {
        success: true,
        emailSent: Boolean(data.emailSent),
        resendStatus: data.resendStatus,
        resendError: data.resendError,
        previewOtp: data.previewOtp,
        expiresIn: data.expiresIn || 600,
      };
    } catch (err: any) {
      console.warn('Network error requesting OTP:', err);
      return {
        success: false,
        emailSent: false,
        resendStatus: 'network_error',
        error: err.message || 'Network error while contacting authentication server.',
      };
    }
  },

  /**
   * Verify the 6-digit OTP code and authorize the user
   */
  async verifyEmailOtp(params: {
    email: string;
    otp: string;
  }): Promise<VerifyOtpResult> {
    const { email, otp } = params;
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Invalid verification code.',
        };
      }

      const normalizedEmail = email.trim().toLowerCase();
      const userId = generateDeterministicUserId(normalizedEmail);

      // Create new authenticated Profile
      const authenticatedProfile: Profile = {
        id: userId,
        full_name: data.fullName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        target_role: data.targetRole || 'Full Stack Engineer',
        plan: 'free',
        daily_minutes: 60,
        ai_prompts_left: 15,
        streak_days: 1,
        created_at: new Date().toISOString(),
        is_guest: false,
      };

      // Try syncing to Supabase if database tables are accessible
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (existingProfile) {
          authenticatedProfile.full_name = existingProfile.full_name || authenticatedProfile.full_name;
          authenticatedProfile.target_role = existingProfile.target_role || authenticatedProfile.target_role;
          authenticatedProfile.plan = existingProfile.plan || authenticatedProfile.plan;
          authenticatedProfile.daily_minutes = existingProfile.daily_minutes || authenticatedProfile.daily_minutes;
        } else {
          // Attempt insert (ignore if RLS requires auth.uid)
          await supabase.from('profiles').insert({
            id: userId,
            full_name: authenticatedProfile.full_name,
            target_role: authenticatedProfile.target_role,
            plan: authenticatedProfile.plan,
            daily_minutes: authenticatedProfile.daily_minutes,
          });
        }
      } catch (sbErr) {
        console.info('Supabase sync info:', sbErr);
      }

      // Save locally to persist user session across refreshes
      this.saveSession(authenticatedProfile);

      return {
        success: true,
        profile: authenticatedProfile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Verification failed. Please try again.',
      };
    }
  },

  /**
   * Retrieve active session from localStorage or Supabase
   */
  getSession(): Profile | null {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Profile;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Save session to localStorage
   */
  saveSession(profile: Profile): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  },

  /**
   * Log out active user and clear session
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
