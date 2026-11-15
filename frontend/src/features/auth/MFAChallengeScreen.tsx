import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onVerified: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export function MFAChallengeScreen({ onVerified, onCancel }: Props) {
  const [factors, setFactors] = useState<Array<{ id: string; friendly_name?: string }>>([]);
  const [factorId, setFactorId] = useState('');
  const [factorName, setFactorName] = useState('authenticator app');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.mfa.listFactors().then(({ data, error: factorError }) => {
      if (!active) return;
      const verifiedFactors = data?.totp ?? [];
      const factor = verifiedFactors[0];
      if (factorError || !factor) {
        setError(factorError?.message ?? 'No verified authenticator is available for this account.');
      } else {
        setFactors(verifiedFactors);
        setFactorId(factor.id);
        setFactorName(factor.friendly_name || 'authenticator app');
      }
      setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code from your authenticator app.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) {
      setError('That code could not be verified. Check the code and try again.');
      setIsSubmitting(false);
      return;
    }
    try {
      await onVerified();
    } catch {
      setError('Verification succeeded, but your account could not be loaded. Sign in again.');
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--md-background)' }}>
      <section className="m3-surface-card" style={{ maxWidth: 440, width: '100%', padding: 32 }}>
        <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#EFF6FF', color: '#123C69' }}>
          <ShieldCheck size={24} />
        </div>
        <h1 style={{ margin: '20px 0 8px', color: 'var(--md-text-primary)' }}>Verify it’s you</h1>
        <p style={{ color: 'var(--md-text-secondary)', lineHeight: 1.6 }}>
          Enter the six-digit code from your {factorName} to continue. If you enrolled a backup authenticator, you can select it here.
        </p>
        <form onSubmit={submit}>
          {factors.length > 1 && (
            <>
              <label htmlFor="mfa-factor" style={{ display: 'block', margin: '22px 0 8px', fontWeight: 600, color: 'var(--md-text-primary)' }}>Authenticator</label>
              <select
                id="mfa-factor"
                value={factorId}
                onChange={(event) => {
                  const selected = factors.find((factor) => factor.id === event.target.value);
                  setFactorId(event.target.value);
                  setFactorName(selected?.friendly_name || 'authenticator app');
                }}
                disabled={isSubmitting}
                style={{ boxSizing: 'border-box', width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }}
              >
                {factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator app'}</option>)}
              </select>
            </>
          )}
          <label htmlFor="mfa-code" style={{ display: 'block', margin: '22px 0 8px', fontWeight: 600, color: 'var(--md-text-primary)' }}>Authenticator code</label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading || isSubmitting || !factorId}
            autoFocus
            style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)', fontSize: 22, letterSpacing: '0.35em', textAlign: 'center' }}
          />
          {error && <p role="alert" style={{ color: 'var(--md-error, #b3261e)', margin: '12px 0 0' }}>{error}</p>}
          <button className="auth-primary-btn" type="submit" disabled={isLoading || isSubmitting || !factorId || code.length !== 6} style={{ width: '100%', marginTop: 20, padding: '12px 20px', fontSize: 13.5 }}>
            {isLoading ? 'Loading…' : isSubmitting ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>
        <button type="button" onClick={() => void onCancel()} style={{ width: '100%', marginTop: 12, padding: 10, border: 0, background: 'transparent', color: 'var(--md-text-secondary)', cursor: 'pointer' }}>
          Sign out
        </button>
      </section>
    </main>
  );
}
