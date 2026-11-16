import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  User,
  RefreshCw,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleIcon } from '../../components/SocialIcons';
import { authService } from './authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Profile } from '../../types';

interface Props {
  onAuthenticated: (profile: Profile) => void;
  onToast: (msg: string) => void;
}

const ACCENT_LINK = '#123C69';
const ACCENT_BORDER = '#1E4D8B';

export const AuthScreen: React.FC<Props> = ({ onAuthenticated, onToast }) => {
  const supabaseConfigured = isSupabaseConfigured();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [verificationStep, setVerificationStep] = useState<'form' | 'otp'>('form');
  const [verificationSource, setVerificationSource] = useState<'signup' | 'signin'>('signup');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => authService.getRememberMe());
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP Fields (6 individual digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCountdown, setResendCountdown] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setError(null);
    setResetEmailSent(false);
    setMode(nextMode);
    setVerificationStep('form');
  };

  const celebrateSignup = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {
      // Non-blocking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError('Connect this app to a Supabase project before signing in or creating an account.');
      return;
    }

    if (verificationStep === 'otp') {
      await handleVerifyOtp();
      return;
    }

    if (mode === 'signup') {
      const cleanFirst = firstName.trim();
      const fullName = `${cleanFirst} ${lastName.trim()}`.trim();
      if (cleanFirst.length < 2) {
        setError('Please enter your first name (at least 2 characters).');
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreeTerms) {
        setError('Please accept the Terms of Service and Privacy Notice to continue.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await authService.signUp({
          email: email.trim(),
          password,
          fullName,
          rememberMe,
          legalConsentAccepted: agreeTerms,
        });

        if (!res.success) {
          setError(res.error || 'Could not create your account. Please try again.');
          return;
        }

        if (res.needsEmailVerification) {
          setVerificationSource('signup');
          setResendCountdown(60);
          setOtpDigits(['', '', '', '', '', '']);
          setVerificationStep('otp');
          onToast(`Confirmation link sent to ${email.trim()}. Check your inbox to activate your account.`);
          return;
        }

        if (!res.profile) {
          setError('Account created, but profile initialization failed. Try signing in.');
          return;
        }

        celebrateSignup();
        onToast(`Account created. Welcome to Career Pilot, ${res.profile.full_name}.`);
        onAuthenticated(res.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to create your account right now.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Sign In
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signIn({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (res.needsEmailVerification) {
        setVerificationSource('signin');
        setOtpDigits(['', '', '', '', '', '']);
        setVerificationStep('otp');
        setError(res.error || 'Verify your email before signing in.');
        return;
      }

      if (!res.success || !res.profile) {
        setError(res.error || 'Incorrect email or password.');
        return;
      }

      onToast(`Welcome back, ${res.profile.full_name}.`);
      onAuthenticated(res.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    if (!isSupabaseConfigured()) {
      setError('Connect this app to a Supabase project before verifying your email.');
      return;
    }

    const code = codeOverride || otpDigits.join('').trim();
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const verifyRes = await authService.verifySignUpOtp({
        email: email.trim(),
        otp: code,
        fullName: fullName || undefined,
        rememberMe,
        legalConsentAccepted: verificationSource === 'signup' ? agreeTerms : true,
        recordConsent: verificationSource === 'signup',
      });

      if (!verifyRes.success || !verifyRes.profile) {
        setError(verifyRes.error || 'Incorrect verification code. Check your email or request a new one.');
        return;
      }

      completeVerifiedLogin(verifyRes.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeVerifiedLogin = (profile: NonNullable<Awaited<ReturnType<typeof authService.verifySignUpOtp>>['profile']>) => {
    if (verificationSource === 'signup') {
      celebrateSignup();
      onToast(`Email verified. Welcome, ${profile.full_name}.`);
    } else {
      onToast(`Email verified. Welcome back, ${profile.full_name}.`);
    }
    onAuthenticated(profile);
  };

  const handleCheckEmailConfirmed = async (silent = false) => {
    if (!isSupabaseConfigured()) {
      if (!silent) {
        setError('Connect this app to a Supabase project before verifying your email.');
      }
      return;
    }
    if (isLoading) return;

    if (!silent) {
      setError(null);
      setIsLoading(true);
    }
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await authService.checkEmailVerificationStatus({
        email: email.trim(),
        password,
        fullName: fullName || undefined,
        rememberMe,
        legalConsentAccepted: verificationSource === 'signup' ? agreeTerms : true,
        recordConsent: verificationSource === 'signup',
      });

      if (!res.success || !res.profile) {
        if (!silent) {
          setError(
            res.error ||
              'Email not confirmed yet. Click the confirmation link in your inbox, then try again.'
          );
        }
        return;
      }

      completeVerifiedLogin(res.profile);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Verification check failed. Please try again.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (verificationStep !== 'otp') return;

    const checkOnReturn = () => {
      if (document.visibilityState === 'hidden') return;
      void handleCheckEmailConfirmed(true);
    };

    window.addEventListener('focus', checkOnReturn);
    document.addEventListener('visibilitychange', checkOnReturn);
    return () => {
      window.removeEventListener('focus', checkOnReturn);
      document.removeEventListener('visibilitychange', checkOnReturn);
    };
  });

  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const clean = val.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = clean[i] || '';
        }
        setOtpDigits(nextDigits);
        if (clean.length === 6) {
          void handleVerifyOtp(clean);
        } else {
          otpInputRefs.current[Math.min(clean.length, 5)]?.focus();
        }
      }
      return;
    }

    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const full = updated.join('');
      if (full.length === 6) {
        void handleVerifyOtp(full);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || isLoading) return;
    if (!isSupabaseConfigured()) {
      setError('Connect this app to a Supabase project before requesting an email code.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.resendVerificationEmail(email.trim());
      if (!res.success) {
        setError(res.error || 'Failed to resend verification email.');
        return;
      }
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      onToast(`Confirmation email resent to ${email.trim()}. Check your inbox or spam folder.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resending verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      setError('Connect this app to a Supabase project before using Google sign-in.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.signInWithSocial('google', rememberMe);
      if (!res.success) {
        setError(res.error || 'Google sign-in could not be started.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!isSupabaseConfigured()) {
      setError('Connect this app to a Supabase project before requesting a password reset.');
      return;
    }
    setError(null);
    setResetEmailSent(false);
    setIsLoading(true);
    try {
      const res = await authService.requestPasswordReset(email);
      if (!res.success) {
        setError(res.error || 'Could not send a password reset email.');
        return;
      }
      setResetEmailSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not send a password reset email. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitLabel = isLoading
    ? mode === 'signup'
      ? 'Creating account...'
      : 'Signing in...'
    : mode === 'signup'
      ? 'Create account'
      : 'Sign in';

  return (
    <div className="auth-page-shell">
      <div
        className="auth-main-window"
        style={{
          width: '100%',
          maxWidth: mode === 'signup' ? '1000px' : '940px',
          minHeight: '600px',
          background: '#FFFFFF',
          borderRadius: '22px',
          boxShadow: '0 20px 50px -15px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          transition: 'max-width 0.25s ease',
        }}
      >
        {/* Left Scenic Brand Panel (Desktop & Web) */}
        <div
          className="auth-left-brand-panel"
          style={{
            width: mode === 'signup' ? '42%' : '44%',
            position: 'relative',
            background: '#0B1E38',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/career-auth-desktop.png"
            alt="Illuminated winding career path rising through layered navy mountains toward sunrise"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          <div className="auth-brand-header" aria-hidden="true">
            <div className="auth-brand-lockup">
              <span className="auth-brand-mark"><Compass size={25} strokeWidth={2.2} /></span>
              <span>Career Pilot</span>
            </div>
            <p>Plan today,<br />build tomorrow.</p>
          </div>
          <div className="auth-brand-footer" aria-hidden="true">
            <strong>200+ curated career paths</strong>
            <span>A clear next step, built around you.</span>
          </div>
        </div>

        {/* Mobile Brand Hero Banner (< 860px) */}
        <div className="auth-mobile-header-graphic">
          <img
            src="/assets/career-auth-mobile.png"
            alt="Career Pilot mountain pathway illustration"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 45%',
              display: 'block',
            }}
          />
          <div className="auth-mobile-header-overlay" aria-hidden="true">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: '#123C69',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                }}
              >
                <Compass size={18} strokeWidth={2.2} />
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Career Pilot
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.86)', marginTop: '4px', fontWeight: 500 }}>
              Plan today, build tomorrow · 200+ curated career paths
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div
          className="auth-right-form-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px 48px',
            boxSizing: 'border-box',
            position: 'relative',
            overflowY: 'auto',
          }}
        >
          {mode === 'signup' && verificationStep === 'form' && (
            <div
              className="auth-top-switch-link"
              style={{
                position: 'absolute',
                top: '28px',
                right: '40px',
                fontSize: '12.5px',
                color: '#64748B',
                fontWeight: 500,
              }}
            >
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('signin')}
                style={{
                  fontSize: '12.5px',
                }}
              >
                Sign in
              </button>
            </div>
          )}

          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            {mode === 'signup' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: ACCENT_BORDER,
                  }}
                />
                <div
                  style={{
                    width: '40px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: verificationStep === 'otp' ? ACCENT_BORDER : '#E2E8F0',
                    transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748B',
                    marginLeft: '4px',
                  }}
                >
                  {verificationStep === 'form' ? 'Step 1 of 2' : 'Step 2 of 2'}
                </span>
              </div>
            )}

            {verificationStep === 'otp' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setVerificationStep('form');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '0 0 12px 0',
                }}
              >
                <ArrowLeft size={14} />
                <span>{verificationSource === 'signup' ? 'Back to edit details' : 'Back to sign in'}</span>
              </button>
            )}

            <h1
              style={{
                fontSize: '25px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                margin: '0 0 6px 0',
              }}
            >
              {verificationStep === 'otp'
                ? 'Verify your email'
                : mode === 'signup'
                  ? 'Create your account'
                  : 'Welcome back'}
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748B',
                margin: '0 0 20px 0',
                lineHeight: 1.5,
              }}
            >
              {verificationStep === 'otp'
                ? `We sent a confirmation link to ${email.trim()}. Open your inbox and click the link to activate your account.`
                : mode === 'signup'
                  ? 'Start your personalized career roadmap.'
                  : 'Sign in to continue your roadmap.'}
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: '#DC2626',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {!supabaseConfigured && (
              <div
                role="status"
                style={{
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: '#9A3412',
                  marginBottom: '16px',
                }}
              >
                Account services require valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in the frontend environment.
              </div>
            )}

            {resetEmailSent && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: ACCENT_LINK,
                  marginBottom: '16px',
                  fontWeight: 500,
                }}
              >
                If an account exists for {email.trim()}, a password reset link is on its way. Check your inbox and spam folder.
              </div>
            )}

            {verificationStep === 'otp' ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '11px',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    color: '#334155',
                    lineHeight: 1.5,
                  }}
                >
                  Open the email from Career Pilot and click the confirmation link (check spam if you don&apos;t see it). Once confirmed, continue below.
                </div>

                <button
                  type="button"
                  className="auth-primary-btn"
                  onClick={() => void handleCheckEmailConfirmed(false)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>I&apos;ve confirmed the link — Continue</span>
                    </>
                  )}
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#64748B',
                  }}
                >
                  <span>Didn&apos;t receive the email?</span>
                  {resendCountdown > 0 ? (
                    <span style={{ fontWeight: 600, color: '#94A3B8' }}>
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => void handleResendVerification()}
                      disabled={isLoading}
                      style={{
                        cursor: isLoading ? 'wait' : 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={12} className={isLoading ? 'spin-animation' : ''} />
                      Resend link
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                    Or enter 6-digit code if shown
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                </div>

                <div className="auth-otp-grid">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      aria-label={`Verification digit ${idx + 1} of 6`}
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        height: '52px',
                        borderRadius: '11px',
                        border: `1.5px solid ${digit ? ACCENT_BORDER : '#CBD5E1'}`,
                        background: digit ? '#F8FAFC' : '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '21px',
                        fontWeight: 800,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'border-color 0.15s',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                </div>

                {otpDigits.join('').length > 0 && (
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length < 6}
                    style={{
                      width: '100%',
                      padding: '11px 18px',
                      borderRadius: '11px',
                      border: '1px solid #CBD5E1',
                      background: otpDigits.join('').length === 6 ? '#F1F5F9' : '#F8FAFC',
                      color: otpDigits.join('').length === 6 ? '#0F172A' : '#94A3B8',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: isLoading || otpDigits.join('').length < 6 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Verify 6-digit code</span>
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mode === 'signup' && (
                  <div className="auth-name-row">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '11px',
                        padding: '10px 14px',
                      }}
                    >
                      <User size={16} color="#94A3B8" aria-hidden="true" />
                      <input
                        type="text"
                        autoComplete="given-name"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        style={{
                          border: 'none',
                          outline: 'none',
                          fontSize: '13px',
                          color: '#0F172A',
                          width: '100%',
                          background: 'transparent',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '11px',
                        padding: '10px 14px',
                      }}
                    >
                      <User size={16} color="#94A3B8" aria-hidden="true" />
                      <input
                        type="text"
                        autoComplete="family-name"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          fontSize: '13px',
                          color: '#0F172A',
                          width: '100%',
                          background: 'transparent',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '11px',
                    padding: '10px 14px',
                  }}
                >
                  <Mail size={16} color="#94A3B8" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setResetEmailSent(false);
                    }}
                    required
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      color: '#0F172A',
                      width: '100%',
                      background: 'transparent',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '11px',
                    padding: '10px 14px',
                  }}
                >
                  <Lock size={16} color="#94A3B8" aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={mode === 'signup' ? 8 : undefined}
                    required
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      color: '#0F172A',
                      width: '100%',
                      background: 'transparent',
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '11px',
                      padding: '10px 14px',
                    }}
                  >
                    <Lock size={16} color="#94A3B8" aria-hidden="true" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '13px',
                        color: '#0F172A',
                        width: '100%',
                        background: 'transparent',
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}

                {mode === 'signin' ? (
                  <div
                    className="auth-signin-options"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                      marginTop: '2px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{
                          accentColor: ACCENT_LINK,
                          width: '15px',
                          height: '15px',
                          cursor: 'pointer',
                        }}
                      />
                      Keep me signed in
                    </label>
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => void handleForgotPassword()}
                      disabled={!supabaseConfigured || isLoading}
                      style={{
                        fontWeight: 600,
                        fontSize: '12.5px',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#475569', lineHeight: 1.4 }}>
                      <input
                        id="signup-legal-consent"
                        type="checkbox"
                        aria-required="true"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        style={{
                          accentColor: ACCENT_LINK,
                          width: '15px',
                          height: '15px',
                          marginTop: '2px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ display: 'grid', gap: '3px' }}>
                        <label htmlFor="signup-legal-consent" style={{ cursor: 'pointer' }}>
                          I agree to the{' '}
                          <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT_LINK, fontWeight: 600 }}>
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT_LINK, fontWeight: 600 }}>
                            Privacy Notice
                          </a>.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={!supabaseConfigured || isLoading}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '12px 20px',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{submitLabel}</span>
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            )}

            {verificationStep !== 'otp' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0 14px 0',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                </div>

                <button
                  type="button"
                  className="auth-google-btn"
                  aria-label="Continue with Google"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={!supabaseConfigured || isLoading}
                >
                  <GoogleIcon size={18} />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            <div
              style={{
                textAlign: 'center',
                marginTop: '20px',
                fontSize: '12.5px',
                color: '#64748B',
              }}
            >
              {mode === 'signin' && verificationStep === 'form' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchMode('signup')}
                    style={{
                      fontSize: '12.5px',
                    }}
                  >
                    Create one
                  </button>
                </>
              ) : (
                <div
                  className={
                    verificationStep === 'otp' ? 'auth-mobile-signin-bottom-visible' : 'auth-mobile-signin-bottom'
                  }
                  style={{ display: verificationStep === 'otp' ? 'block' : 'none' }}
                >
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchMode('signin')}
                    style={{
                      fontSize: '12.5px',
                    }}
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
