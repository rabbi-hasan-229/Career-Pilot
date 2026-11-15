import React, { useState } from 'react';
import { PRIVACY_NOTICE_VERSION, TERMS_VERSION } from './policyVersions';

interface Props {
  onAccepted: () => Promise<void>;
  onRetry: () => Promise<void>;
  verificationError?: string;
}

export const LegalAcceptanceScreen: React.FC<Props> = ({ onAccepted, onRetry, verificationError }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const accept = async () => {
    if (!confirmed || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      await onAccepted();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Could not save your acceptance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const retry = async () => {
    setError('');
    try {
      await onRetry();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Could not verify your account acceptance. Please try again.');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--md-bg)' }}>
      <section className="m3-surface-card" style={{ maxWidth: 560, width: '100%', display: 'grid', gap: 16 }}>
        <div>
          <p style={{ margin: '0 0 6px', color: 'var(--md-text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Account setup</p>
          <h1 style={{ margin: 0, color: 'var(--md-text-primary)', fontSize: 25 }}>Review the current policies</h1>
          <p style={{ margin: '10px 0 0', color: 'var(--md-text-secondary)', lineHeight: 1.55 }}>
            Review these current drafts before entering your workspace. Your acceptance is saved to your account with the policy versions and a server timestamp.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 8, padding: 14, border: '1px solid var(--md-outline)', borderRadius: 12, background: 'var(--md-surface-variant)' }}>
          <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--md-text-primary)', fontWeight: 700 }}>Terms of Service <span style={{ color: 'var(--md-text-secondary)', fontWeight: 500 }}>· {TERMS_VERSION}</span></a>
          <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--md-text-primary)', fontWeight: 700 }}>Privacy Notice <span style={{ color: 'var(--md-text-secondary)', fontWeight: 500 }}>· {PRIVACY_NOTICE_VERSION}</span></a>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--md-text-primary)', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#123C69' }} />
          <span>I have reviewed and agree to the Terms of Service and acknowledge the Privacy Notice shown above.</span>
        </label>

        {verificationError && <p role="status" style={{ margin: 0, color: 'var(--md-text-secondary)' }}>{verificationError}</p>}
        {error && <p role="alert" style={{ margin: 0, color: 'var(--md-error, #b3261e)' }}>{error}</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="auth-primary-btn" onClick={() => void accept()} disabled={!confirmed || isSaving} style={{ padding: '11px 20px', fontSize: 13.5 }}>
            {isSaving ? 'Saving acceptance…' : 'Continue to Career Pilot'}
          </button>
          {verificationError && <button type="button" className="btn-m3-white" onClick={() => void retry()}>Check again</button>}
        </div>
      </section>
    </main>
  );
};
