import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  KeyRound,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '../lib/authService';
import type { Profile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: Profile) => void;
  onToast: (msg: string) => void;
}

const demoAccounts: { profile: Profile; label: string; badge: string }[] = [
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Abdullah Al Mamun',
      email: 'abdullah@careerpilot.io',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      target_role: 'Full Stack Engineer',
      plan: 'free',
      daily_minutes: 90,
      ai_prompts_left: 16,
      streak_days: 7,
      created_at: '2026-10-01T00:00:00Z',
    },
    label: 'Abdullah Al Mamun (Primary Demo)',
    badge: 'Free Tier · 16 calls',
  },
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Sarah Rahman',
      email: 'sarah.rahman@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      target_role: 'Data Engineer',
      plan: 'premium',
      daily_minutes: 60,
      ai_prompts_left: 92,
      streak_days: 14,
      created_at: '2026-09-15T00:00:00Z',
    },
    label: 'Sarah Rahman (Pro Navigator)',
    badge: 'Premium Tier · 92 calls',
  },
  {
    profile: {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Rafiqul Islam',
      email: 'rafiqul@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      target_role: 'Junior Web Developer',
      plan: 'free',
      daily_minutes: 45,
      ai_prompts_left: 15,
      streak_days: 3,
      created_at: '2026-10-10T00:00:00Z',
    },
    label: 'Rafiqul Islam (Junior Path)',
    badge: 'Free Tier · 15 calls',
  },
];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectProfile,
  onToast,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');

  // Input fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Engineer');

  // OTP inputs (6 individual digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // States & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email via Resend
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (authMode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.sendEmailOtp({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        targetRole,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }

      setPreviewOtp(result.previewOtp || null);
      setResendStatus(result.resendStatus);
      setResendCountdown(60);
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);

      if (result.emailSent) {
        onToast(`📧 Verification code sent to ${email.trim()}!`);
      } else {
        onToast(`Code generated! Enter the 6-digit code below.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle individual digit input with auto-advance and paste support
  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || '';
        }
        setOtpDigits(newDigits);
        const nextFocus = Math.min(cleaned.length, 5);
        otpInputRefs.current[nextFocus]?.focus();

        // If all 6 digits pasted, trigger verification automatically
        if (cleaned.length === 6) {
          verifyCode(cleaned);
        }
        return;
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If last digit filled, auto submit
    const codeSoFar = newDigits.join('');
    if (codeSoFar.length === 6) {
      verifyCode(codeSoFar);
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify the 6-digit code
  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.verifyEmailOtp({
        email: email.trim(),
        otp: code,
      });

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || 'Invalid code. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success! Fire celebration confetti
      setStep('success');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#10b981', '#3b82f6'],
        });
      } catch {
        // Fallback if canvas is not ready
      }

      onSelectProfile(result.profile);
      onToast(`🎉 Welcome to Career Pilot, ${result.profile.full_name}!`);

      setTimeout(() => {
        onClose();
        // Reset modal state
        setStep('input');
        setOtpDigits(['', '', '', '', '', '']);
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch demo account instantly
  const handlePickDemo = (demo: typeof demoAccounts[0]) => {
    authService.saveSession(demo.profile);
    onSelectProfile(demo.profile);
    onToast(`Switched account to ${demo.profile.full_name}`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(11, 15, 25, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="m3-surface-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline)',
          color: 'var(--md-text-primary)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--md-text-primary)' }}>
                {step === 'otp'
                  ? 'Verify Your Email'
                  : step === 'success'
                  ? 'Authorized!'
                  : authMode === 'signup'
                  ? 'Join Career Pilot'
                  : 'Welcome Back'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#10b981" />
                Resend OTP & Supabase Database
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-surface-variant)',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Enter Email & Info */}
        {step === 'input' && (
          <div>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--md-surface-variant)',
                borderRadius: '12px',
                padding: '4px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '9px',
                  border: 'none',
                  background: authMode === 'signup' ? 'var(--md-surface)' : 'transparent',
                  color: authMode === 'signup' ? 'var(--md-text-primary)' : 'var(--md-text-secondary)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signup' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign Up (New User)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '9px',
                  border: 'none',
                  background: authMode === 'signin' ? 'var(--md-surface)' : 'transparent',
                  color: authMode === 'signin' ? 'var(--md-text-primary)' : 'var(--md-text-secondary)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signin' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp}>
              {/* Full Name (Sign Up only) */}
              {authMode === 'signup' && (
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--md-text-secondary)',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Your Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 38px',
                        borderRadius: '12px',
                        border: '1px solid var(--md-outline)',
                        background: 'var(--md-surface-variant)',
                        color: 'var(--md-text-primary)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <User
                      size={16}
                      color="var(--md-text-muted)"
                      style={{ position: 'absolute', left: '12px', top: '14px' }}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--md-text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '12px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                      color: 'var(--md-text-primary)',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <Mail
                    size={16}
                    color="var(--md-text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)', display: 'block', marginTop: '4px' }}>
                  We will send a 6-digit verification code to this email via Resend.
                </span>
              </div>

              {/* Target Role Quest (Sign Up only) */}
              {authMode === 'signup' && (
                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--md-text-secondary)',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Target Career Quest
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--md-outline)',
                      background: 'var(--md-surface-variant)',
                      color: 'var(--md-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="Junior Frontend Developer">Junior Frontend Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Data Engineer">Data Engineer</option>
                    <option value="Backend Specialist">Backend Specialist</option>
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--md-violet-gradient)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-glow)',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Dispatching Code...
                  </>
                ) : (
                  <>
                    Send 6-Digit Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter 6-digit OTP Code */}
        {step === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--md-primary-container)',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--md-on-primary-container)',
                  marginBottom: '10px',
                }}
              >
                <Mail size={14} />
                Sent to: <strong>{email}</strong>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    textDecoration: 'underline',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                >
                  Edit
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', margin: '4px 0 0 0' }}>
                Enter the 6-digit verification code to complete authorization:
              </p>
            </div>

            {/* In-Development Preview Badge (if sandbox/no-smtp or immediate demo) */}
            {previewOtp && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '12px',
                  color: 'var(--md-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#818cf8" />
                  <span>
                    {resendStatus === 'delivered'
                      ? 'Email sent via Resend API!'
                      : 'Instant Verification Code:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = previewOtp.split('');
                    setOtpDigits(digits);
                    verifyCode(previewOtp);
                  }}
                  style={{
                    background: 'var(--md-violet-gradient)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Click to auto-fill"
                >
                  Auto Fill ({previewOtp})
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 6-box OTP Input Fields */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '22px',
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
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '54px',
                    borderRadius: '12px',
                    border: `2px solid ${digit ? '#6366f1' : 'var(--md-outline)'}`,
                    background: 'var(--md-surface-variant)',
                    color: 'var(--md-text-primary)',
                    fontSize: '22px',
                    fontWeight: 800,
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: digit ? '0 0 10px rgba(99, 102, 241, 0.2)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={isLoading || otpDigits.join('').length !== 6}
              onClick={() => verifyCode()}
              style={{
                width: '100%',
                background: 'var(--md-violet-gradient)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)',
                opacity: isLoading || otpDigits.join('').length !== 6 ? 0.6 : 1,
                marginBottom: '14px',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Verifying Code...
                </>
              ) : (
                <>
                  Verify & Authorize
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>

            {/* Resend Code Section */}
            <div style={{ textAlign: 'center' }}>
              {resendCountdown > 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                  Resend code in <strong>{resendCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={13} /> Resend Verification Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--md-text-primary)', margin: '0 0 6px 0' }}>
              Successfully Authorized!
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--md-text-secondary)', margin: 0 }}>
              Connecting to your personalized roadmap workspace...
            </p>
          </div>
        )}

        {/* Collapsible Instant Demo Account Switcher (For quick evaluator testing) */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--md-outline)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              color: 'var(--md-text-muted)',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <span>Or Quick-Switch Demo Account</span>
            {showDemoAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDemoAccounts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {demoAccounts.map((d) => (
                <button
                  key={d.profile.id}
                  type="button"
                  onClick={() => handlePickDemo(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-outline)',
                    background: 'var(--md-surface-variant)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={d.profile.avatar_url}
                      alt={d.profile.full_name}
                      style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                        {d.profile.full_name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--md-text-secondary)' }}>
                        {d.profile.target_role}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      background: d.profile.plan === 'premium' ? '#f5f3ff' : '#ede9fe',
                      color: d.profile.plan === 'premium' ? '#7c3aed' : '#4338ca',
                    }}
                  >
                    {d.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
