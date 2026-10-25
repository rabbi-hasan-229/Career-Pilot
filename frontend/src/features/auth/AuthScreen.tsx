import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  User,
  ChevronDown,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../../components/SocialIcons';
import { authService, demoAccounts } from './authService';
import type { Profile } from '../../types';

interface Props {
  onAuthenticated: (profile: Profile) => void;
  onToast: (msg: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onAuthenticated, onToast }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Fields (6 individual digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoList, setShowDemoList] = useState(false);

  // Focus first OTP input box when stepping into OTP view
  useEffect(() => {
    if (mode === 'signup' && signupStep === 'otp') {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mode, signupStep]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Form Submit: Either Sign In or Send OTP for Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (signupStep === 'form') {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        if (!firstName.trim()) {
          setError('Please enter your first name.');
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        if (!agreeTerms) {
          setError('Please accept the Terms of Service and Privacy Policy to continue.');
          return;
        }

        setIsLoading(true);
        try {
          // Request OTP verification code dispatch
          const res = await authService.sendEmailOtp({
            email: email.trim(),
            fullName,
            targetRole: 'Full Stack Engineer',
          });

          if (!res.success) {
            setError(res.error || 'Failed to dispatch verification code. Please try again.');
            return;
          }

          setPreviewOtp(res.previewOtp || null);
          setResendStatus(res.resendStatus);
          setResendCountdown(60);
          setOtpDigits(['', '', '', '', '', '']);
          setSignupStep('otp');

          if (res.emailSent) {
            onToast(`📧 Verification code sent to ${email.trim()}!`);
          } else {
            onToast(`Code generated! Enter the 6-digit verification code.`);
          }
        } catch (err: any) {
          setError(err.message || 'Error sending verification code.');
        } finally {
          setIsLoading(false);
        }
      } else {
        // In OTP step, submit OTP verification
        await handleVerifyOtp();
      }
    } else {
      // Sign In
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter your email.');
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

        if (!res.success || !res.profile) {
          setError(res.error || 'Invalid email or password.');
          return;
        }

        onToast(`👋 Welcome back, ${res.profile.full_name}!`);
        onAuthenticated(res.profile);
      } catch (err: any) {
        setError(err.message || 'Authentication error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Verify submitted OTP code and create verified account
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otpDigits.join('').trim();
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Verify code against server
      const verifyRes = await authService.verifyEmailOtp({
        email: email.trim(),
        otp: code,
      });

      if (!verifyRes.success) {
        setError(verifyRes.error || 'Incorrect verification code. Please check your email.');
        setIsLoading(false);
        return;
      }

      // 2. Complete signup and create active account
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const signUpRes = await authService.completeSignUp({
        email: email.trim(),
        fullName: fullName || verifyRes.fullName || 'Career Pilot',
        password,
        rememberMe,
        targetRole: verifyRes.targetRole || 'Full Stack Engineer',
      });

      if (!signUpRes.success || !signUpRes.profile) {
        setError(signUpRes.error || 'Failed to initialize account profile.');
        setIsLoading(false);
        return;
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        // Non-blocking
      }

      onToast(`🎉 Email verified! Welcome to Career Pilot, ${signUpRes.profile.full_name}!`);
      onAuthenticated(signUpRes.profile);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual digit input, auto-advancing, and complete paste
  const handleOtpDigitChange = (index: number, val: string) => {
    // Handle paste of 6-digit string
    if (val.length > 1) {
      const clean = val.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = clean[i] || '';
        }
        setOtpDigits(nextDigits);
        if (clean.length === 6) {
          handleVerifyOtp(clean);
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

    // Auto-advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-trigger if final digit entered
    if (digit && index === 5) {
      const full = updated.join('');
      if (full.length === 6) {
        handleVerifyOtp(full);
      }
    }
  };

  // Handle backspace to navigate to previous box
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await authService.sendEmailOtp({
        email: email.trim(),
        fullName,
        targetRole: 'Full Stack Engineer',
      });

      if (!res.success) {
        setError(res.error || 'Failed to resend code.');
        return;
      }

      setPreviewOtp(res.previewOtp || null);
      setResendStatus(res.resendStatus);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);

      if (res.emailSent) {
        onToast(`📧 New verification code sent to ${email.trim()}!`);
      } else {
        onToast(`New code generated! Enter below.`);
      }
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Error resending code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillOtp = (code: string) => {
    const chars = code.split('').slice(0, 6);
    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = chars[i] || '';
    }
    setOtpDigits(nextDigits);
    handleVerifyOtp(code);
  };

  const handleSocialClick = async (provider: 'google' | 'facebook' | 'twitter') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.signInWithSocial(provider);
      if (res.success && res.profile) {
        onToast(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
        onAuthenticated(res.profile);
      } else {
        setError(res.error || 'Social authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickDemo = (demo: (typeof demoAccounts)[0]) => {
    authService.saveSession(demo.profile, true);
    onToast(`Logged in as demo user: ${demo.profile.full_name}`);
    onAuthenticated(demo.profile);
  };

  const handleForgotPassword = () => {
    alert(
      'To reset your password or sign in with a one-time code, enter your email and click Create account or contact support.'
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EDF2F7',
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily:
          "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Main Responsive Card Window */}
      <div
        className="auth-main-window"
        style={{
          width: '100%',
          maxWidth: mode === 'signup' ? '1020px' : '960px',
          minHeight: '620px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          transition: 'max-width 0.25s ease',
        }}
      >
        {/* ======================================================== */}
        {/* LEFT BRAND / MOUNTAIN PANEL (Desktop View >= 860px)      */}
        {/* ======================================================== */}
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
          {/* Mountain Scenic Artwork from Reference */}
          <img
            src={
              mode === 'signup'
                ? '/assets/auth-mountain-desktop.png'
                : '/assets/login-mountain-desktop.png'
            }
            alt="Scenic mountain learning path"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>

        {/* ======================================================== */}
        {/* RIGHT FORM CONTAINER (Desktop & Mobile)                  */}
        {/* ======================================================== */}
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
          {/* Top-Right Toggle Link for Sign Up Screen */}
          {mode === 'signup' && signupStep === 'form' && (
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
                onClick={() => {
                  setError(null);
                  setMode('signin');
                  setSignupStep('form');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1D68F2',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12.5px',
                }}
              >
                Sign in
              </button>
            </div>
          )}

          {/* Mobile Header Graphic (Only visible on screens < 860px) */}
          <div
            className="auth-mobile-header-graphic"
            style={{
              display: 'none',
              margin: '-40px -48px 24px -48px',
              position: 'relative',
              height: '150px',
              overflow: 'hidden',
              background: '#0B1E38',
            }}
          >
            <img
              src={
                mode === 'signup'
                  ? '/assets/auth-mountain-mobile.png'
                  : '/assets/login-mountain-mobile.png'
              }
              alt="Mountain landscape"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </div>

          <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
            {/* Step Progress Pills for Sign Up */}
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
                    width: '42px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: '#1D68F2',
                  }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: signupStep === 'otp' ? '#1D68F2' : '#E2E8F0',
                    transition: 'background 0.2s',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748B',
                    marginLeft: '4px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {signupStep === 'form' ? 'Step 1: Details' : 'Step 2: Verification'}
                </span>
              </div>
            )}

            {/* Back Button if in OTP step */}
            {mode === 'signup' && signupStep === 'otp' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSignupStep('form');
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
                <span>Back to edit details</span>
              </button>
            )}

            {/* Header Titles */}
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                margin: '0 0 6px 0',
              }}
            >
              {mode === 'signup'
                ? signupStep === 'form'
                  ? 'Create your account'
                  : 'Verify your email'
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
              {mode === 'signup'
                ? signupStep === 'form'
                  ? 'Join thousands of learners exploring tech careers with structured roadmaps.'
                  : 'Enter the 6-digit authorization code sent to ' + email
                : 'Continue your learning journey'}
            </p>

            {/* Error Message Alert */}
            {error && (
              <div
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
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* In-Development Preview Badge / Sandbox Notice */}
            {mode === 'signup' && signupStep === 'otp' && previewOtp && (
              <div
                style={{
                  background: resendStatus === 'delivered' ? '#F0FDF4' : '#EFF6FF',
                  border: `1px solid ${resendStatus === 'delivered' ? '#BBF7D0' : '#BFDBFE'}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles
                    size={16}
                    color={resendStatus === 'delivered' ? '#16A34A' : '#1D68F2'}
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ fontSize: '11.5px', color: '#1E293B', lineHeight: 1.35 }}>
                    {resendStatus === 'delivered' ? (
                      <span>
                        <strong style={{ color: '#166534' }}>Email dispatched via Resend!</strong>{' '}
                        Check your inbox.
                      </span>
                    ) : (
                      <span>
                        <strong style={{ color: '#1E40AF' }}>Dev Test Code:</strong> Instant
                        verification helper ready.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoFillOtp(previewOtp)}
                  style={{
                    background: '#1D68F2',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(29, 104, 242, 0.25)',
                  }}
                  title="Click to fill code automatically"
                >
                  Auto Fill ({previewOtp})
                </button>
              </div>
            )}

            {/* =================================================== */}
            {/* SIGN UP STEP 2: 6-DIGIT OTP VERIFICATION FORM       */}
            {/* =================================================== */}
            {mode === 'signup' && signupStep === 'otp' ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 6 Digit Inputs */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    margin: '6px 0 10px 0',
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      style={{
                        width: '50px',
                        height: '56px',
                        borderRadius: '12px',
                        border: `2px solid ${digit ? '#1D68F2' : '#CBD5E1'}`,
                        background: digit ? '#F8FAFC' : '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '24px',
                        fontWeight: 800,
                        textAlign: 'center',
                        outline: 'none',
                        boxShadow: digit
                          ? '0 0 0 3px rgba(29, 104, 242, 0.15)'
                          : '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                    />
                  ))}
                </div>

                {/* Resend Code Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#64748B',
                  }}
                >
                  <span>Didn't receive the code?</span>
                  {resendCountdown > 0 ? (
                    <span style={{ fontWeight: 600, color: '#94A3B8' }}>
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1D68F2',
                        fontWeight: 700,
                        cursor: isLoading ? 'wait' : 'pointer',
                        padding: 0,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                      Resend code
                    </button>
                  )}
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length < 6}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '13px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#1D68F2',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isLoading || otpDigits.join('').length < 6 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(29, 104, 242, 0.35)',
                    opacity: isLoading || otpDigits.join('').length < 6 ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify & Complete Sign Up</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* =================================================== */
              /* STANDARD FORM: SIGN IN OR SIGN UP STEP 1 (DETAILS)  */
              /* =================================================== */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Sign Up: First Name & Last Name (2 columns) */}
                {mode === 'signup' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <User size={16} color="#94A3B8" />
                      <input
                        type="text"
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
                        borderRadius: '12px',
                        padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <User size={16} color="#94A3B8" />
                      <input
                        type="text"
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

                {/* Email Address */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <Mail size={16} color="#94A3B8" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

                {/* Password */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <Lock size={16} color="#94A3B8" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Confirm Password (Sign Up only) */}
                {mode === 'signup' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <Lock size={16} color="#94A3B8" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                {/* Row: Checkboxes & Links */}
                {mode === 'signin' ? (
                  <div
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
                          accentColor: '#1D68F2',
                          width: '15px',
                          height: '15px',
                          cursor: 'pointer',
                        }}
                      />
                      Keep me signed in
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1D68F2',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '12.5px',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                        color: '#475569',
                        lineHeight: 1.4,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        style={{
                          accentColor: '#1D68F2',
                          width: '15px',
                          height: '15px',
                          marginTop: '2px',
                          cursor: 'pointer',
                        }}
                      />
                      <span>
                        I agree to the{' '}
                        <span style={{ color: '#1D68F2', fontWeight: 600 }}>Terms of Service</span> and{' '}
                        <span style={{ color: '#1D68F2', fontWeight: 600 }}>Privacy Policy</span>
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#1D68F2',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(29, 104, 242, 0.35)',
                    transition: 'background 0.15s ease, transform 0.1s ease',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  <span>
                    {isLoading
                      ? 'Sending Verification Code...'
                      : mode === 'signup'
                        ? 'Create account'
                        : 'Sign in'}
                  </span>
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            )}

            {/* "or continue with" Divider */}
            {!(mode === 'signup' && signupStep === 'otp') && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '22px 0 16px 0',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                </div>

                {/* Social Authentication Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSocialClick('google')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1E293B',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <GoogleIcon size={18} />
                    {mode === 'signup' && <span className="auth-social-label">Google</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialClick('twitter')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1E293B',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <GithubIcon size={18} />
                    {mode === 'signup' && <span className="auth-social-label">GitHub</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialClick('facebook')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#1E293B',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <MicrosoftIcon size={18} />
                    {mode === 'signup' && <span className="auth-social-label">Microsoft</span>}
                  </button>
                </div>
              </>
            )}

            {/* Footer Bottom Link */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '22px',
                fontSize: '12.5px',
                color: '#64748B',
              }}
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signup');
                      setSignupStep('form');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1D68F2',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '12.5px',
                    }}
                  >
                    Create one
                  </button>
                </>
              ) : (
                <div
                  className={
                    signupStep === 'otp' ? 'auth-mobile-signin-bottom-visible' : 'auth-mobile-signin-bottom'
                  }
                  style={{ display: signupStep === 'otp' ? 'block' : 'none' }}
                >
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signin');
                      setSignupStep('form');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1D68F2',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '12.5px',
                    }}
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>

            {/* Quick Demo Accounts Drawer (For easy testing) */}
            <div
              style={{
                marginTop: '24px',
                borderTop: '1px dashed #E2E8F0',
                paddingTop: '12px',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setShowDemoList((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Quick Test Logins (Demo Profiles)</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: showDemoList ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {showDemoList && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    justifyContent: 'center',
                    marginTop: '10px',
                  }}
                >
                  {demoAccounts.map((d) => (
                    <button
                      key={d.profile.id}
                      type="button"
                      onClick={() => handlePickDemo(d)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {d.profile.full_name} ({d.label})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
