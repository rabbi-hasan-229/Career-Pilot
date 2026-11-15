import {
  getRememberMePreference,
  getSupabasePublicConfig,
  isSupabaseConfigured,
  setRememberMePreference,
  supabase,
} from '../../lib/supabase';
import type { Profile } from '../../types';
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../legal/policyVersions';

const SESSION_STORAGE_KEY = 'career_pilot_user_session';
const PROFILE_EXT_STORAGE_PREFIX = 'career_pilot_profile_ext_';
const LEGAL_FALLBACK_PREFIX = 'career_pilot_legal_accepted_';
const LEGAL_VERSION_TOKEN = `${TERMS_VERSION}:${PRIVACY_NOTICE_VERSION}`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readProfileExtensionCache(userId: string): Partial<Profile> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(`${PROFILE_EXT_STORAGE_PREFIX}${userId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Profile>) : {};
  } catch {
    return {};
  }
}

function writeProfileExtensionCache(userId: string, changes: Partial<Profile>): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = readProfileExtensionCache(userId);
    const merged: Record<string, unknown> = { ...existing };
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) merged[key] = value;
    }
    window.localStorage.setItem(`${PROFILE_EXT_STORAGE_PREFIX}${userId}`, JSON.stringify(merged));
  } catch {
    // Ignore storage fallback failures
  }
}

const CORE_PROFILE_COLUMNS = 'id, full_name, avatar_url, target_role, plan, daily_minutes, created_at';
const FULL_PROFILE_COLUMNS =
  'id, full_name, avatar_url, target_role, target_role_category, target_timeline_months, target_completion_date, experience_level, phone, username, bio, location, portfolio_url, github_url, linkedin_url, notification_daily_reminder, notification_milestone_alerts, notification_weekly_digest, weekly_reminder_frequency, learning_style, plan, daily_minutes, created_at';
const CORE_EDITABLE_FIELDS: ReadonlySet<string> = new Set(['full_name', 'avatar_url', 'target_role', 'daily_minutes']);

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .* does not exist/i.test(error.message || '') ||
    /could not find the '.*' column/i.test(error.message || '')
  );
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined, tableName: string): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    new RegExp(`could not find the table 'public\\.${tableName}'`, 'i').test(error.message || '') ||
    new RegExp(`relation "?(?:public\\.)?${tableName}"? does not exist`, 'i').test(error.message || '')
  );
}

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
  mfaRequired?: boolean;
  needsEmailVerification?: boolean;
  error?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  rememberMe?: boolean;
  legalConsentAccepted: boolean;
}

export interface VerifySignUpOtpParams {
  email: string;
  otp: string;
  fullName?: string;
  phone?: string;
  rememberMe?: boolean;
  legalConsentAccepted: boolean;
  recordConsent?: boolean;
}

export interface SimpleAuthActionResult {
  success: boolean;
  error?: string;
}

function mapAuthErrorMessage(message?: string): string {
  const raw = (message || '').trim();
  if (!raw) return 'Authentication failed. Please try again.';
  if (/invalid login credentials/i.test(raw)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(raw)) return 'Verify your email address before signing in.';
  if (/user already registered|already exists/i.test(raw)) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (/rate limit|too many requests|for security purposes/i.test(raw)) {
    return raw;
  }
  return raw;
}

export const authService = {
  /**
   * Get persisted remember-me preference
   */
  getRememberMe(): boolean {
    return getRememberMePreference();
  },

  /**
   * Sign In with Email & Password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    const { email, rememberMe = true } = credentials;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!credentials.password) {
      return { success: false, error: 'Please enter your password.' };
    }

    setRememberMePreference(rememberMe);
    localStorage.removeItem(SESSION_STORAGE_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: credentials.password,
    });

    if (error || !data.user) {
      const needsEmailVerification = Boolean(error?.message && /email not confirmed/i.test(error.message));
      return {
        success: false,
        needsEmailVerification,
        error: mapAuthErrorMessage(error?.message),
      };
    }

    // Enrolled MFA accounts receive an AAL1 session first, which RLS intentionally
    // restricts from reading profiles until the second factor is verified.
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!assuranceError && assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
      return { success: true, mfaRequired: true };
    }

    const profile = await this.loadProfile(data.user);
    if (!profile) {
      return { success: false, error: 'Your account profile could not be loaded. Please try again.' };
    }

    return { success: true, profile };
  },

  /**
   * Sign Up with Email, Password, and Profile Metadata via Supabase Auth.
   * Respects Supabase's email confirmation setting: returns immediate session
   * when confirmations are off, or prompts verification when confirmations are on.
   */
  async signUp(params: SignUpParams): Promise<AuthResult> {
    const {
      email,
      password,
      fullName,
      phone,
      rememberMe = true,
      legalConsentAccepted,
    } = params;
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (cleanName.length < 2) {
      return { success: false, error: 'Please enter your name (at least 2 characters).' };
    }
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    if (legalConsentAccepted !== true) {
      return {
        success: false,
        error: 'Review and accept the Terms of Service and Privacy Notice before creating your account.',
      };
    }

    setRememberMePreference(rememberMe);
    localStorage.removeItem(SESSION_STORAGE_KEY);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          ...(phone?.trim() ? { phone: phone.trim() } : {}),
        },
      },
    });

    if (error) {
      return { success: false, error: mapAuthErrorMessage(error.message) };
    }

    // Supabase returns a user with empty identities instead of an error when an
    // account already exists and email confirmations are enabled (enumeration protection).
    if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
      return {
        success: false,
        error: 'An account with this email already exists. Sign in or reset your password instead.',
      };
    }

    if (!data.session) {
      return { success: true, needsEmailVerification: true };
    }

    return this.finalizeNewAccount(data.user, { fullName: cleanName, phone: phone?.trim() });
  },

  /**
   * Verify 6-digit Sign Up confirmation OTP issued by Supabase Auth
   */
  async verifySignUpOtp(params: VerifySignUpOtpParams): Promise<AuthResult> {
    const {
      email,
      otp,
      fullName,
      phone,
      rememberMe = true,
      legalConsentAccepted,
      recordConsent = true,
    } = params;
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.replace(/\D/g, '').trim();

    if (recordConsent && legalConsentAccepted !== true) {
      return {
        success: false,
        error: 'Review and accept the Terms of Service and Privacy Notice before continuing.',
      };
    }
    if (cleanOtp.length !== 6) {
      return { success: false, error: 'Enter the 6-digit verification code from your email.' };
    }

    setRememberMePreference(rememberMe);

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanOtp,
      type: 'signup',
    });

    if (error || !data.user) {
      return {
        success: false,
        error: mapAuthErrorMessage(error?.message) || 'Invalid or expired verification code.',
      };
    }

    if (!recordConsent) {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!assuranceError && assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
        return { success: true, mfaRequired: true };
      }
      const profile = await this.loadProfile(data.user);
      if (!profile) {
        return { success: false, error: 'Email verified, but your profile could not be loaded. Try signing in.' };
      }
      return { success: true, needsEmailVerification: false, profile };
    }

    return this.finalizeNewAccount(data.user, {
      fullName: fullName?.trim(),
      phone: phone?.trim(),
    });
  },

  /**
   * Resend 6-digit signup verification OTP via Supabase Auth
   */
  async resendVerificationEmail(email: string): Promise<SimpleAuthActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    if (error) {
      return { success: false, error: mapAuthErrorMessage(error.message) };
    }
    return { success: true };
  },

  /**
   * Request a password reset email via Supabase Auth
   */
  async requestPasswordReset(email: string): Promise<SimpleAuthActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return { success: false, error: 'Enter your account email first, then select Forgot password.' };
    }

    const redirectUrl = new URL(window.location.href);
    redirectUrl.search = '';
    redirectUrl.hash = '';
    redirectUrl.searchParams.set('recovery', '1');

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectUrl.toString(),
    });

    if (error) {
      return { success: false, error: mapAuthErrorMessage(error.message) };
    }
    return { success: true };
  },

  async finalizeNewAccount(
    user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> },
    details: { fullName?: string; phone?: string }
  ): Promise<AuthResult> {
    const cleanName = details.fullName || String(user.user_metadata?.full_name || user.email?.split('@')[0] || '');

    try {
      await this.acceptCurrentLegalPolicies(user.id);
    } catch (legalError) {
      // Do not block account activation if legal_acceptances write fails or is unavailable.
      console.warn('Could not record policy acceptance during account setup:', legalError);
    }

    const updates: Record<string, string> = {};
    if (cleanName) updates.full_name = cleanName;
    if (details.phone) updates.phone = details.phone;

    if (Object.keys(updates).length > 0) {
      let { data: row, error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(FULL_PROFILE_COLUMNS)
        .maybeSingle();

      if (isMissingColumnError(profileError)) {
        const coreUpdates: Record<string, string> = {};
        if (updates.full_name) coreUpdates.full_name = updates.full_name;
        if (Object.keys(coreUpdates).length > 0) {
          const fallbackRes = await supabase
            .from('profiles')
            .update(coreUpdates)
            .eq('id', user.id)
            .select(CORE_PROFILE_COLUMNS)
            .maybeSingle();
          row = fallbackRes.data as typeof row;
          profileError = fallbackRes.error;
        }
      }

      if (!profileError && row) {
        return { success: true, needsEmailVerification: false, profile: this.mapProfile(user, row) };
      }
    }

    const profile = await this.loadProfile(user);
    if (!profile) {
      return { success: false, error: 'Account created, but your profile could not be loaded. Please sign in.' };
    }
    return { success: true, needsEmailVerification: false, profile };
  },

  /**
   * Social OAuth Authentication (Google)
   */
  async signInWithSocial(
    provider: 'google',
    rememberMe: boolean = true
  ): Promise<SimpleAuthActionResult> {
    setRememberMePreference(rememberMe);

    const { url, anonKey } = getSupabasePublicConfig();
    if (isSupabaseConfigured() && url && anonKey && typeof fetch === 'function') {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
        try {
          const response = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/settings`, {
            headers: { apikey: anonKey },
            signal: controller?.signal,
          });
          if (response.ok) {
            const settings = (await response.json()) as { external?: Record<string, boolean> };
            if (settings?.external && settings.external[provider] === false) {
              return {
                success: false,
                error:
                  'Google sign-in is not enabled in your Supabase project yet. Enable Google under Authentication → Providers in the Supabase Dashboard.',
              };
            }
          }
        } finally {
          if (timeoutId !== null) clearTimeout(timeoutId);
        }
      } catch {
        // Proceed with standard OAuth flow if the settings preflight is unreachable.
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    return error ? { success: false, error: mapAuthErrorMessage(error.message) } : { success: true };
  },

  async loadProfile(user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }): Promise<Profile | null> {
    let { data, error } = await supabase
      .from('profiles')
      .select(FULL_PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();

    if (isMissingColumnError(error)) {
      const coreResult = await supabase
        .from('profiles')
        .select(CORE_PROFILE_COLUMNS)
        .eq('id', user.id)
        .maybeSingle();
      data = coreResult.data as typeof data;
      error = coreResult.error;
    }

    if (error || !data) return null;
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle();
    return { ...this.mapProfile(user, data), streak_days: gamification?.current_streak ?? 0 };
  },

  async hasCurrentLegalAcceptance(userId: string): Promise<boolean> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) throw new Error('Your session expired. Sign in again to verify policy acceptance.');
    const { data, error } = await supabase
      .from('legal_acceptances')
      .select('accepted_at')
      .eq('user_id', user.id)
      .eq('terms_version', TERMS_VERSION)
      .eq('privacy_notice_version', PRIVACY_NOTICE_VERSION)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error, 'legal_acceptances')) {
        try {
          return typeof window !== 'undefined' &&
            window.localStorage?.getItem(`${LEGAL_FALLBACK_PREFIX}${user.id}`) === LEGAL_VERSION_TOKEN;
        } catch {
          return false;
        }
      }
      throw new Error(error.message);
    }
    return Boolean(data?.accepted_at);
  },

  async acceptCurrentLegalPolicies(expectedUserId?: string): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || (expectedUserId && expectedUserId !== user.id)) {
      throw new Error('Your session expired. Sign in again to save policy acceptance.');
    }
    const { error } = await supabase.from('legal_acceptances').insert({
      user_id: user.id,
      terms_version: TERMS_VERSION,
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
    });
    if (error && error.code !== '23505') {
      if (isMissingTableError(error, 'legal_acceptances')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`${LEGAL_FALLBACK_PREFIX}${user.id}`, LEGAL_VERSION_TOKEN);
          }
        } catch {
          // Ignore storage fallback failure
        }
        return;
      }
      throw new Error(error.message);
    }
  },

  mapProfile(user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }, row: Record<string, unknown>): Profile {
    const ext = readProfileExtensionCache(user.id);
    const fullName = String(row.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Career Pilot');
    const targetRole = String(row.target_role || '');
    return {
      id: user.id,
      full_name: fullName,
      email: user.email,
      avatar_url: String(row.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || user.id)}`),
      target_role: targetRole,
      target_role_category: row.target_role_category ? String(row.target_role_category) as Profile['target_role_category'] : ext.target_role_category,
      target_timeline_months: row.target_timeline_months ? Number(row.target_timeline_months) : ext.target_timeline_months,
      target_completion_date: row.target_completion_date ? String(row.target_completion_date) : ext.target_completion_date,
      experience_level: (row.experience_level as Profile['experience_level']) || ext.experience_level,
      phone: row.phone ? String(row.phone) : ext.phone,
      username: row.username ? String(row.username) : ext.username,
      bio: row.bio ? String(row.bio) : ext.bio,
      location: row.location ? String(row.location) : ext.location,
      portfolio_url: row.portfolio_url ? String(row.portfolio_url) : ext.portfolio_url,
      github_url: row.github_url ? String(row.github_url) : ext.github_url,
      linkedin_url: row.linkedin_url ? String(row.linkedin_url) : ext.linkedin_url,
      notification_daily_reminder: row.notification_daily_reminder !== undefined ? row.notification_daily_reminder !== false : (ext.notification_daily_reminder ?? true),
      notification_milestone_alerts: row.notification_milestone_alerts !== undefined ? row.notification_milestone_alerts !== false : (ext.notification_milestone_alerts ?? true),
      notification_weekly_digest: row.notification_weekly_digest !== undefined ? row.notification_weekly_digest !== false : (ext.notification_weekly_digest ?? true),
      weekly_reminder_frequency: (row.weekly_reminder_frequency as Profile['weekly_reminder_frequency']) || ext.weekly_reminder_frequency || '3x',
      learning_style: (row.learning_style as Profile['learning_style']) || ext.learning_style,
      plan: row.plan === 'premium' ? 'premium' : 'free',
      daily_minutes: Number(row.daily_minutes || 60),
      streak_days: 0,
      created_at: String(row.created_at || user.created_at || new Date().toISOString()),
      is_guest: false,
      has_completed_onboarding: Boolean(targetRole),
    };
  },

  async updateProfile(currentProfile: Profile, changes: Partial<Profile>): Promise<Profile> {
    const editableFields: (keyof Profile)[] = [
      'full_name', 'avatar_url', 'target_role', 'target_role_category', 'target_timeline_months',
      'target_completion_date', 'experience_level', 'daily_minutes', 'phone',
      'username', 'bio', 'location', 'portfolio_url', 'github_url', 'linkedin_url',
      'notification_daily_reminder', 'notification_milestone_alerts',
      'notification_weekly_digest', 'learning_style',
      'weekly_reminder_frequency',
    ];
    const payload: Record<string, unknown> = {};
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) payload[field] = changes[field];
    }
    if (currentProfile.is_demo) return { ...currentProfile, ...payload } as Profile;
    if (Object.keys(payload).length === 0) return currentProfile;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== currentProfile.id) {
      throw new Error('Your session expired. Sign in again to save profile changes.');
    }
    let { data: row, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select(FULL_PROFILE_COLUMNS)
      .single();

    if (isMissingColumnError(error)) {
      writeProfileExtensionCache(user.id, payload as Partial<Profile>);
      const corePayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (CORE_EDITABLE_FIELDS.has(key)) corePayload[key] = value;
      }
      if (Object.keys(corePayload).length === 0) {
        return { ...currentProfile, ...payload } as Profile;
      }
      const fallbackResult = await supabase
        .from('profiles')
        .update(corePayload)
        .eq('id', user.id)
        .select(CORE_PROFILE_COLUMNS)
        .single();
      row = fallbackResult.data as typeof row;
      error = fallbackResult.error;
    }

    if (error || !row) throw error || new Error('Could not save your profile.');
    return { ...this.mapProfile(user, row), streak_days: currentProfile.streak_days };
  },

  /**
   * Save Career Goal and Roadmap Preferences from Post-Signup Onboarding
   */
  async saveOnboardingGoal(
    currentProfile: Profile,
    params: {
      target_role: string;
      target_role_category?: Profile['target_role_category'];
      target_timeline_months: number;
      target_completion_date?: string;
      daily_minutes: number;
      experience_level?: 'beginner' | 'switcher' | 'junior' | 'mid';
    }
  ): Promise<Profile> {
    const updated: Profile = {
      ...currentProfile,
      target_role: params.target_role,
      target_role_category: params.target_role_category,
      target_timeline_months: params.target_timeline_months,
      target_completion_date: params.target_completion_date,
      daily_minutes: params.daily_minutes,
      experience_level: params.experience_level || 'beginner',
      has_completed_onboarding: true,
    };
    return this.updateProfile(currentProfile, updated);
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

  async deleteAccount(): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) {
      let message = error.message || 'Could not delete this account.';
      const response = error.context as Response | undefined;
      if (response && typeof response.clone === 'function') {
        try {
          const body = await response.clone().json() as { error?: string };
          message = body.error || message;
        } catch {}
      }
      throw new Error(message);
    }
    await this.signOut();
  },
};
