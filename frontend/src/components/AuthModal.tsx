import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (!isOpen) return null;

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onSelectProfile({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            target_role: 'Full Stack Engineer',
            plan: 'free',
            daily_minutes: 60,
            ai_prompts_left: 15,
            streak_days: 1,
            created_at: new Date().toISOString(),
          });
          onToast(`👋 Welcome back, ${email}!`);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onSelectProfile({
            id: data.user.id,
            full_name: email.split('@')[0],
            target_role: 'Full Stack Engineer',
            plan: 'free',
            daily_minutes: 60,
            ai_prompts_left: 15,
            streak_days: 1,
            created_at: new Date().toISOString(),
          });
          onToast(`🎉 Account created! Connected to Supabase.`);
          onClose();
        }
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      onToast(`⚠️ ${err.message || 'Auth action could not be completed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickDemo = (demo: typeof demoAccounts[0]) => {
    onSelectProfile(demo.profile);
    onToast(`Switched account to ${demo.profile.full_name} (${demo.profile.plan.toUpperCase()})`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '500px',
          padding: '28px',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline)',
          color: 'var(--md-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--md-violet-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--md-text-primary)' }}>
                Career Pilot Authentication
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                Supabase Auth & Row Level Security
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Click Fast Switch Demo Profiles */}
        <div style={{ marginBottom: '22px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Instant Demo Account Switcher
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {demoAccounts.map((d) => (
              <button
                key={d.profile.id}
                type="button"
                onClick={() => handlePickDemo(d)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={d.profile.avatar_url}
                    alt={d.profile.full_name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                      {d.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                      Target: {d.profile.target_role}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--md-outline)' }} />
          <span style={{ fontSize: '11px', color: 'var(--md-text-muted)', fontWeight: 700 }}>OR SUPABASE LOGIN</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--md-outline)' }} />
        </div>

        {/* Live Email/Password Auth Form */}
        <form onSubmit={handleSupabaseAuth}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-primary)',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                }}
              />
              <Mail size={16} color="var(--md-text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-primary)',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                }}
              />
              <Lock size={16} color="var(--md-text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'var(--md-violet-gradient)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {isLoading ? 'Connecting...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            <ArrowRight size={16} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {authMode === 'signin'
                ? "Don't have an account? Sign Up"
                : 'Already registered? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
