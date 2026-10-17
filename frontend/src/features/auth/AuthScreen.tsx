import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  ChevronDown,
} from 'lucide-react';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../../components/SocialIcons';
import { authService, demoAccounts } from './authService';
import type { Profile } from '../../types';

interface Props {
  onAuthenticated: (profile: Profile) => void;
  onToast: (msg: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onAuthenticated, onToast }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

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

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoList, setShowDemoList] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        if (!firstName.trim()) {
          setError('Please enter your first name.');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        if (!agreeTerms) {
          setError('Please accept the Terms of Service to continue.');
          setIsLoading(false);
          return;
        }

        const res = await authService.signUp({
          fullName,
          email: email.trim(),
          password,
          rememberMe,
        });

        if (!res.success || !res.profile) {
          setError(res.error || 'Failed to create account.');
          setIsLoading(false);
          return;
        }

        onToast(`🎉 Account created! Welcome, ${res.profile.full_name}`);
        onAuthenticated(res.profile);
      } else {
        // Sign In
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter your email.');
          setIsLoading(false);
          return;
        }
        if (!password) {
          setError('Please enter your password.');
          setIsLoading(false);
          return;
        }

        const res = await authService.signIn({
          email: email.trim(),
          password,
          rememberMe,
        });

        if (!res.success || !res.profile) {
          setError(res.error || 'Invalid email or password.');
          setIsLoading(false);
          return;
        }

        onToast(`👋 Welcome back, ${res.profile.full_name}!`);
        onAuthenticated(res.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
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

  const handlePickDemo = (demo: typeof demoAccounts[0]) => {
    authService.saveSession(demo.profile, true);
    onToast(`Logged in as ${demo.profile.full_name}`);
    onAuthenticated(demo.profile);
  };

  const handleForgotPassword = () => {
    onToast('📧 Password reset instructions sent to your email.');
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
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          {mode === 'signup' && (
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
            {/* Step Progress Pill for Sign Up */}
            {mode === 'signup' && (
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '4px',
                    borderRadius: '9999px',
                    background: '#1D68F2',
                  }}
                />
              </div>
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
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748B',
                margin: '0 0 24px 0',
                lineHeight: 1.5,
              }}
            >
              {mode === 'signup'
                ? 'Join thousands of learners exploring tech careers with structured roadmaps.'
                : 'Continue your learning journey'}
            </p>

            {/* Error Message */}
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
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
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
                  placeholder="Password"
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#1D68F2', width: '15px', height: '15px', cursor: 'pointer' }}
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
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#475569', lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      style={{ accentColor: '#1D68F2', width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer' }}
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
                <span>{isLoading ? 'Processing...' : mode === 'signup' ? 'Create account' : 'Sign in'}</span>
                {!isLoading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* "or continue with" Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '22px 0 16px 0',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            </div>

            {/* Social Authentication Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mode === 'signup' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
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

            {/* Footer Bottom Link */}
            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '12.5px', color: '#64748B' }}>
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signup');
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
                <div className="auth-mobile-signin-bottom" style={{ display: 'none' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signin');
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
            <div style={{ marginTop: '24px', borderTop: '1px dashed #E2E8F0', paddingTop: '12px', textAlign: 'center' }}>
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
                <ChevronDown size={12} style={{ transform: showDemoList ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {showDemoList && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
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
