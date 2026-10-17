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
   * Sign Up with Name, Email, Phone, Password
   * Automatically sets has_completed_onboarding to false so they get the onboarding goal modal!
   */
  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, fullName, phone, rememberMe = true } = credentials;
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: 'Please enter your name.' };
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      if (credentials.password && credentials.password.length >= 6) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: credentials.password,
            options: {
              data: { full_name: fullName.trim(), phone },
            },
          });
          if (!error && data.user) {
            const profile: Profile = {
              id: data.user.id,
              full_name: fullName.trim(),
              email: normalizedEmail,
              phone,
              avatar_url: credentials.avatarUrl || '/avatars/career_navigator.jpg',
              target_role: '', // Unset so onboarding triggers
              target_timeline_months: 6,
              plan: 'free',
              daily_minutes: 60,
              ai_prompts_left: 15,
              streak_days: 1,
              created_at: new Date().toISOString(),
              is_guest: false,
              has_completed_onboarding: false,
            };
            this.saveSession(profile, rememberMe);
            return { success: true, profile };
          }
        } catch {
          // Fall through
        }
      }

      const userId = generateDeterministicUserId(normalizedEmail);
      const newProfile: Profile = {
        id: userId,
        full_name: fullName.trim(),
        email: normalizedEmail,
        phone,
        avatar_url: credentials.avatarUrl || '/avatars/career_navigator.jpg',
        target_role: '', // unset -> triggers onboarding
        target_timeline_months: 6,
        plan: 'free',
        daily_minutes: 60,
        ai_prompts_left: 15,
        streak_days: 1,
        created_at: new Date().toISOString(),
        is_guest: false,
        has_completed_onboarding: false,
      };

      this.saveSession(newProfile, rememberMe);
      return { success: true, profile: newProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  },

  /**
   * Social Authentication (Google, Facebook, Twitter)
   */
  async signInWithSocial(provider: 'google' | 'facebook' | 'twitter'): Promise<AuthResult> {
    try {
      // In production, invoke supabase.auth.signInWithOAuth({ provider })
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
      daily_minutes: number;
      experience_level?: 'beginner' | 'switcher' | 'junior' | 'mid';
    }
  ): Profile {
    const updated: Profile = {
      ...currentProfile,
      target_role: params.target_role,
      target_timeline_months: params.target_timeline_months,
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
