import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

const mockLocalStorage = createMemoryStorage();
const mockSessionStorage = createMemoryStorage();

const {
  mockSignInWithPassword,
  mockSignUp,
  mockVerifyOtp,
  mockResend,
  mockResetPasswordForEmail,
  mockSignInWithOAuth,
  mockGetUser,
  mockSignOut,
  mockFrom,
  mockSetRememberMePreference,
  mockGetRememberMePreference,
  mockGetSupabasePublicConfig,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockResend: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockGetUser: vi.fn(),
  mockSignOut: vi.fn(),
  mockFrom: vi.fn(),
  mockSetRememberMePreference: vi.fn(),
  mockGetRememberMePreference: vi.fn(() => true),
  mockGetSupabasePublicConfig: vi.fn(() => ({ url: '', anonKey: '' })),
}));

vi.mock('../../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/supabase')>();
  mockSetRememberMePreference.mockImplementation(actual.setRememberMePreference);
  mockGetRememberMePreference.mockImplementation(actual.getRememberMePreference);

  return {
    ...actual,
    isSupabaseConfigured: () => true,
    getSupabasePublicConfig: mockGetSupabasePublicConfig,
    getRememberMePreference: mockGetRememberMePreference,
    setRememberMePreference: mockSetRememberMePreference,
    supabase: {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        verifyOtp: mockVerifyOtp,
        resend: mockResend,
        resetPasswordForEmail: mockResetPasswordForEmail,
        signInWithOAuth: mockSignInWithOAuth,
        getUser: mockGetUser,
        signOut: mockSignOut,
      },
      from: mockFrom,
    },
  };
});

import { authService } from './authService';
import { getRememberMePreference, setRememberMePreference } from '../../lib/supabase';

function createProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'Ada Lovelace',
    avatar_url: null,
    target_role: null,
    daily_minutes: 60,
    target_timeline_months: 6,
    target_completion_date: null,
    experience_level: 'beginner',
    role: 'user',
    phone: null,
    username: 'adalovelace',
    bio: null,
    location: null,
    portfolio_url: null,
    github_url: null,
    linkedin_url: null,
    notification_in_app: true,
    notification_email: true,
    notification_push: false,
    weekly_reminder_frequency: '3x',
    learning_style: 'mixed',
    target_role_category: null,
    streak_count: 0,
    longest_streak: 0,
    last_activity_date: null,
    created_at: '2026-11-15T00:00:00.000Z',
    updated_at: '2026-11-15T00:00:00.000Z',
    ...overrides,
  };
}

function setupSupabaseTableMocks(options?: {
  profileRow?: Record<string, unknown> | null;
  profileError?: { message: string } | null;
  insertError?: { message: string } | null;
  updateError?: { message: string } | null;
  onProfileUpdate?: (payload: Record<string, unknown>) => void;
  onLegalInsert?: (payload: Record<string, unknown>) => void;
}) {
  const profileRow = options && 'profileRow' in options ? options.profileRow : createProfileRow();
  const profileError = options?.profileError ?? null;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: profileRow, error: profileError }),
            single: async () => ({ data: profileRow, error: profileError }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          options?.onProfileUpdate?.(payload);
          return {
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: profileRow, error: options?.updateError ?? null }),
                single: async () => ({ data: profileRow, error: options?.updateError ?? null }),
              }),
            }),
          };
        },
      };
    }

    if (table === 'legal_acceptances') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: 'legal-1' }, error: null }),
          }),
        }),
        insert: async (payload: Record<string, unknown>) => {
          options?.onLegalInsert?.(payload);
          return { error: options?.insertError ?? null };
        },
      };
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ error: null }),
      upsert: async () => ({ error: null }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    };
  });
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: mockLocalStorage,
      sessionStorage: mockSessionStorage,
      location: { origin: 'http://localhost:5173' },
    },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  vi.clearAllMocks();
  setupSupabaseTableMocks();
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        user_metadata: { full_name: 'Ada Lovelace' },
      },
    },
    error: null,
  });
});

describe('rememberMe storage routing', () => {
  it('defaults to persistent localStorage and migrates sb-* keys when toggled', () => {
    expect(getRememberMePreference()).toBe(true);
    expect(authService.getRememberMe()).toBe(true);

    mockLocalStorage.setItem('sb-project-auth-token', '{"access_token":"abc"}');
    setRememberMePreference(false);

    expect(getRememberMePreference()).toBe(false);
    expect(mockLocalStorage.getItem('sb-project-auth-token')).toBeNull();
    expect(mockSessionStorage.getItem('sb-project-auth-token')).toBe('{"access_token":"abc"}');

    setRememberMePreference(true);
    expect(getRememberMePreference()).toBe(true);
    expect(mockSessionStorage.getItem('sb-project-auth-token')).toBeNull();
    expect(mockLocalStorage.getItem('sb-project-auth-token')).toBe('{"access_token":"abc"}');
  });
});

describe('authService.signIn', () => {
  it('flags unconfirmed email errors with needsEmailVerification', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    });

    const result = await authService.signIn({
      email: 'pending@example.com',
      password: 'Password123!',
      rememberMe: true,
    });

    expect(result.success).toBe(false);
    expect(result.needsEmailVerification).toBe(true);
  });

  it('persists rememberMe preference and loads profile on normal sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'user@example.com', user_metadata: { full_name: 'Ada Lovelace' } },
        session: { access_token: 'tok' },
      },
      error: null,
    });

    const result = await authService.signIn({
      email: 'user@example.com',
      password: 'Password123!',
      rememberMe: false,
    });

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(false);
    expect(getRememberMePreference()).toBe(false);
    expect(result.success).toBe(true);
    expect(result.profile?.email).toBe('user@example.com');
  });
});

describe('authService.signUp', () => {
  it('rejects missing legal consent before calling Supabase', async () => {
    const result = await authService.signUp({
      email: 'new@example.com',
      password: 'Password123!',
      fullName: 'Grace Hopper',
      legalConsentAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('rejects short passwords before calling Supabase', async () => {
    const result = await authService.signUp({
      email: 'new@example.com',
      password: '123',
      fullName: 'Grace Hopper',
      legalConsentAccepted: true,
    });

    expect(result.success).toBe(false);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('detects obfuscated duplicate accounts when identities array is empty', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: 'existing-1', email: 'taken@example.com', identities: [] },
        session: null,
      },
      error: null,
    });

    const result = await authService.signUp({
      email: 'taken@example.com',
      password: 'Password123!',
      fullName: 'Grace Hopper',
      legalConsentAccepted: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/i);
  });

  it('returns needsEmailVerification when signup requires confirmation', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: 'new-1', email: 'new@example.com', identities: [{ id: 'id-1' }] },
        session: null,
      },
      error: null,
    });

    const result = await authService.signUp({
      email: 'new@example.com',
      password: 'Password123!',
      fullName: 'Grace Hopper',
      phone: '+1 555 0100',
      rememberMe: true,
      legalConsentAccepted: true,
    });

    expect(result).toEqual({ success: true, needsEmailVerification: true });
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        password: 'Password123!',
      })
    );
    const signUpCall = mockSignUp.mock.calls[0]?.[0] as { options?: Record<string, unknown> };
    expect(signUpCall.options?.emailRedirectTo).toBe('http://localhost:5173');
  });

  it('uses deployed origin such as https://project-career-pilot.vercel.app for emailRedirectTo', async () => {
    const previousLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://project-career-pilot.vercel.app' },
      configurable: true,
      writable: true,
    });
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-vercel', email: 'vercel@example.com', identities: [{ id: 'id-vercel' }] },
        session: null,
      },
      error: null,
    });

    try {
      const result = await authService.signUp({
        email: 'vercel@example.com',
        password: 'Password123!',
        fullName: 'Vercel User',
        legalConsentAccepted: true,
      });

      expect(result).toEqual({ success: true, needsEmailVerification: true });
      const signUpCall = mockSignUp.mock.calls[0]?.[0] as { options?: Record<string, unknown> };
      expect(signUpCall.options?.emailRedirectTo).toBe('https://project-career-pilot.vercel.app');
    } finally {
      Object.defineProperty(window, 'location', {
        value: previousLocation,
        configurable: true,
        writable: true,
      });
    }
  });

  it('records consent and syncs profile without forcing a fake target_role when session is immediate', async () => {
    let updatedProfilePayload: Record<string, unknown> | undefined;
    let legalInsertPayload: Record<string, unknown> | undefined;
    setupSupabaseTableMocks({
      profileRow: createProfileRow({ id: 'new-1', email: 'new@example.com', full_name: 'Grace Hopper', target_role: null }),
      onProfileUpdate: (payload) => {
        updatedProfilePayload = payload;
      },
      onLegalInsert: (payload) => {
        legalInsertPayload = payload;
      },
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'new-1',
          email: 'new@example.com',
          user_metadata: { full_name: 'Grace Hopper' },
        },
      },
      error: null,
    });

    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: 'new-1',
          email: 'new@example.com',
          identities: [{ id: 'id-1' }],
          user_metadata: { full_name: 'Grace Hopper' },
        },
        session: { access_token: 'tok' },
      },
      error: null,
    });

    const result = await authService.signUp({
      email: 'new@example.com',
      password: 'Password123!',
      fullName: 'Grace Hopper',
      phone: '+1 555 0100',
      rememberMe: false,
      legalConsentAccepted: true,
    });

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(false);
    expect(legalInsertPayload).toEqual(
      expect.objectContaining({
        user_id: 'new-1',
      })
    );
    expect(updatedProfilePayload).toEqual(
      expect.objectContaining({
        full_name: 'Grace Hopper',
        phone: '+1 555 0100',
      })
    );
    expect(updatedProfilePayload).not.toHaveProperty('target_role');
    expect(result.success).toBe(true);
    expect(result.profile?.target_role).toBe('');
    expect(result.profile?.has_completed_onboarding).toBe(false);
  });
});

describe('authService.verifySignUpOtp & resendVerificationEmail', () => {
  it('verifies signup OTP and records legal consent by default', async () => {
    let legalInsertCalls = 0;
    setupSupabaseTableMocks({
      profileRow: createProfileRow({ id: 'user-1', email: 'new@example.com', full_name: 'Grace Hopper' }),
      onLegalInsert: () => {
        legalInsertCalls += 1;
      },
    });

    mockVerifyOtp.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'new@example.com', user_metadata: { full_name: 'Grace Hopper' } },
        session: { access_token: 'tok' },
      },
      error: null,
    });

    const result = await authService.verifySignUpOtp({
      email: 'new@example.com',
      otp: '123456',
      fullName: 'Grace Hopper',
      legalConsentAccepted: true,
    });

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'new@example.com',
      token: '123456',
      type: 'signup',
    });
    expect(legalInsertCalls).toBe(1);
    expect(result.success).toBe(true);
  });

  it('skips legal consent insert during unconfirmed sign-in recovery (recordConsent: false)', async () => {
    let legalInsertCalls = 0;
    setupSupabaseTableMocks({
      onLegalInsert: () => {
        legalInsertCalls += 1;
      },
    });

    mockVerifyOtp.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'existing@example.com', user_metadata: { full_name: 'Ada Lovelace' } },
        session: { access_token: 'tok' },
      },
      error: null,
    });

    const result = await authService.verifySignUpOtp({
      email: 'existing@example.com',
      otp: '654321',
      legalConsentAccepted: false,
      recordConsent: false,
    });

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'existing@example.com',
      token: '654321',
      type: 'signup',
    });
    expect(legalInsertCalls).toBe(0);
    expect(result.success).toBe(true);
  });

  it('calls supabase.auth.resend with type signup and emailRedirectTo', async () => {
    mockResend.mockResolvedValue({ data: {}, error: null });

    const result = await authService.resendVerificationEmail('pending@example.com');

    expect(mockResend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'pending@example.com',
      options: { emailRedirectTo: 'http://localhost:5173' },
    });
    expect(result.success).toBe(true);
  });
});

describe('authService.checkEmailVerificationStatus', () => {
  it('finalizes account when confirmed user session already exists in storage', async () => {
    const result = await authService.checkEmailVerificationStatus({
      email: 'user@example.com',
      fullName: 'Ada Lovelace',
      rememberMe: true,
      legalConsentAccepted: true,
    });

    expect(result.success).toBe(true);
    expect(result.profile?.email).toBe('user@example.com');
  });

  it('falls back to password sign-in when confirmed on another device and reports unconfirmed cleanly', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    });

    const pendingResult = await authService.checkEmailVerificationStatus({
      email: 'pending@example.com',
      password: 'Password123!',
      rememberMe: true,
      legalConsentAccepted: true,
    });

    expect(pendingResult.success).toBe(false);
    expect(pendingResult.needsEmailVerification).toBe(true);

    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'user-1', email: 'user@example.com', user_metadata: { full_name: 'Ada Lovelace' } },
        session: { access_token: 'tok' },
      },
      error: null,
    });

    const confirmedResult = await authService.checkEmailVerificationStatus({
      email: 'user@example.com',
      password: 'Password123!',
      rememberMe: true,
      legalConsentAccepted: true,
    });

    expect(confirmedResult.success).toBe(true);
    expect(confirmedResult.profile?.email).toBe('user@example.com');
  });
});

describe('authService.signInWithSocial & schema fallbacks', () => {
  it('starts Google OAuth with account selection and rememberMe persistence', async () => {
    mockGetSupabasePublicConfig.mockReturnValue({ url: '', anonKey: '' });
    mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://accounts.google.com' }, error: null });

    const result = await authService.signInWithSocial('google', false);

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(false);
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    expect(result).toEqual({ success: true });
  });

  it('reports when Google provider is disabled on the connected Supabase project', async () => {
    mockGetSupabasePublicConfig.mockReturnValue({
      url: 'https://kkonlkzwxmlvaxlbskzl.supabase.co',
      anonKey: 'sb_publishable_test',
    });
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ external: { google: false, email: true } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await authService.signInWithSocial('google', true);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Google sign-in is not enabled/i);
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('falls back to core profile columns when optional columns return PGRST204', async () => {
    let profileSelectCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                profileSelectCalls += 1;
                if (profileSelectCalls === 1) {
                  return {
                    data: null,
                    error: { code: 'PGRST204', message: "Could not find the 'target_role_category' column" },
                  };
                }
                return {
                  data: {
                    id: 'user-1',
                    full_name: 'Ada Lovelace',
                    avatar_url: null,
                    target_role: 'Backend Engineer',
                    plan: 'free',
                    daily_minutes: 60,
                    created_at: '2026-11-15T00:00:00.000Z',
                  },
                  error: null,
                };
              },
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { current_streak: 4 }, error: null }),
          }),
        }),
      };
    });

    const profile = await authService.loadProfile({ id: 'user-1', email: 'user@example.com' });

    expect(profileSelectCalls).toBe(2);
    expect(profile?.target_role).toBe('Backend Engineer');
    expect(profile?.streak_days).toBe(4);
  });

  it('falls back cleanly when legal_acceptances table is missing (PGRST205)', async () => {
    mockFrom.mockImplementation(() => ({
      insert: async () => ({
        error: { code: 'PGRST205', message: "Could not find the table 'public.legal_acceptances' in the schema cache" },
      }),
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { code: 'PGRST205', message: "Could not find the table 'public.legal_acceptances' in the schema cache" },
              }),
            }),
          }),
        }),
      }),
    }));

    await expect(authService.acceptCurrentLegalPolicies('user-1')).resolves.toBeUndefined();
    await expect(authService.hasCurrentLegalAcceptance('user-1')).resolves.toBe(true);
  });

  it('uses Google OAuth name and picture metadata when row falls back to defaults', () => {
    const profile = authService.mapProfile(
      {
        id: 'oauth-1',
        email: 'rabbi@gmail.com',
        user_metadata: {
          name: 'Rabbi Hasan',
          picture: 'https://lh3.googleusercontent.com/a/photo.jpg',
        },
      },
      createProfileRow({ full_name: 'Adventurer', avatar_url: null })
    );

    expect(profile.full_name).toBe('Rabbi Hasan');
    expect(profile.avatar_url).toBe('https://lh3.googleusercontent.com/a/photo.jpg');
  });
});
