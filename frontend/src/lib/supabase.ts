import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
const localHosts = ['localhost', '127.0.0.1', '[::1]'];
const canInitializeUrl = (() => {
  try {
    const url = new URL(configuredUrl);
    return url.protocol === 'https:' || (url.protocol === 'http:' && localHosts.includes(url.hostname));
  } catch {
    return false;
  }
})();
const supabaseUrl = canInitializeUrl ? configuredUrl : 'https://demo-project.supabase.co';
const supabaseAnonKey = configuredAnonKey || 'public-anon-key-placeholder';

const KEEP_SIGNED_IN_KEY = 'career_pilot_keep_signed_in';

export function getRememberMePreference(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    return window.localStorage.getItem(KEEP_SIGNED_IN_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setRememberMePreference(rememberMe: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(KEEP_SIGNED_IN_KEY, rememberMe ? 'true' : 'false');
    if (!rememberMe && window.sessionStorage) {
      for (let idx = window.localStorage.length - 1; idx >= 0; idx -= 1) {
        const key = window.localStorage.key(idx);
        if (key && key.startsWith('sb-')) {
          const val = window.localStorage.getItem(key);
          if (val !== null) window.sessionStorage.setItem(key, val);
          window.localStorage.removeItem(key);
        }
      }
    } else if (rememberMe && window.sessionStorage) {
      for (let idx = window.sessionStorage.length - 1; idx >= 0; idx -= 1) {
        const key = window.sessionStorage.key(idx);
        if (key && key.startsWith('sb-')) {
          const val = window.sessionStorage.getItem(key);
          if (val !== null) window.localStorage.setItem(key, val);
          window.sessionStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Storage unavailable (private mode or non-browser environment)
  }
}

const authStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      const keepSignedIn = getRememberMePreference();
      if (!keepSignedIn) {
        return window.sessionStorage?.getItem(key) ?? window.localStorage?.getItem(key) ?? null;
      }
      return window.localStorage?.getItem(key) ?? window.sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      if (getRememberMePreference()) {
        window.localStorage?.setItem(key, value);
        window.sessionStorage?.removeItem(key);
      } else {
        window.sessionStorage?.setItem(key, value);
        window.localStorage?.removeItem(key);
      }
    } catch {
      // Ignore storage write errors
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage?.removeItem(key);
      window.sessionStorage?.removeItem(key);
    } catch {
      // Ignore storage removal errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSupabasePublicConfig = () => ({
  url: configuredUrl,
  anonKey: configuredAnonKey,
});

export const isSupabaseConfigured = () => {
  const isPlaceholderKey = /^(?:your[-_]?(?:supabase[-_]?)?anon[-_]?key|public[-_]anon[-_]key[-_]placeholder|replace[-_]me)$/i.test(configuredAnonKey);
  if (!configuredUrl || !configuredAnonKey || isPlaceholderKey) return false;
  try {
    const url = new URL(configuredUrl);
    if (!canInitializeUrl) return false;
    if (/your-project|demo-project/i.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
};
