import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onComplete: () => Promise<void> | void;
  onExit: () => Promise<void> | void;
}

export const PasswordRecoveryScreen = ({ onComplete, onExit }: Props) => {
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION'))) {
        setHasRecoverySession(true);
      }
    });
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      const hasAuthCode = new URLSearchParams(window.location.search).has('code');
      if (!sessionError && data.session) {
        setHasRecoverySession(true);
      } else if (!hasAuthCode) {
        setHasRecoverySession(false);
      } else {
        setTimeout(() => {
          if (!active) return;
          void supabase.auth.getSession().then(({ data: retryData }) => {
            if (active) setHasRecoverySession(Boolean(retryData.session));
          });
        }, 1200);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'This reset link may have expired. Request a new one and try again.');
        return;
      }
      await onComplete();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update your password. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--md-background)' }}>
      <section className="m3-surface-card" style={{ width: 'min(100%, 440px)', boxSizing: 'border-box' }}>
        <div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#EFF6FF', color: '#123C69', marginBottom: 16 }}>
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        <h1 style={{ margin: '0 0 8px', color: 'var(--md-text-primary)' }}>Choose a new password</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--md-text-secondary)', lineHeight: 1.5 }}>
          Use a unique password with at least 8 characters to secure your Career Pilot account.
        </p>

        {hasRecoverySession === null ? (
          <p role="status" style={{ color: 'var(--md-text-secondary)' }}>Verifying your reset link…</p>
        ) : !hasRecoverySession ? (
          <>
            <p role="alert" style={{ color: 'var(--md-error, #b42318)' }}>This password reset link is invalid or has expired. Request a new link from the sign-in screen.</p>
            <button className="auth-primary-btn" type="button" onClick={() => void onExit()} style={{ padding: '11px 18px', fontSize: 13.5 }}>Return to sign in</button>
          </>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, color: 'var(--md-text-primary)', fontSize: 13, fontWeight: 700 }}>
              New password
              <span className="password-reset-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid var(--md-outline)', borderRadius: 12, padding: '11px 13px', background: 'var(--md-surface)' }}>
                <Lock size={16} aria-hidden="true" color="var(--md-text-muted)" />
                <input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required style={{ width: '100%', minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--md-text-primary)', font: 'inherit' }} />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ background: 'none', border: 0, padding: 0, color: 'var(--md-text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <label style={{ display: 'grid', gap: 6, color: 'var(--md-text-primary)', fontSize: 13, fontWeight: 700 }}>
              Confirm new password
              <span className="password-reset-input-wrap" style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid var(--md-outline)', borderRadius: 12, padding: '11px 13px', background: 'var(--md-surface)' }}>
                <Lock size={16} aria-hidden="true" color="var(--md-text-muted)" />
                <input autoComplete="new-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required style={{ width: '100%', minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--md-text-primary)', font: 'inherit' }} />
                <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} style={{ background: 'none', border: 0, padding: 0, color: 'var(--md-text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {error && <p role="alert" style={{ margin: 0, color: 'var(--md-error, #b42318)', fontSize: 13 }}>{error}</p>}
            <button className="auth-primary-btn" type="submit" disabled={isSaving} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 13.5 }}>
              {isSaving ? 'Updating password…' : 'Update password'}
              {!isSaving && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
