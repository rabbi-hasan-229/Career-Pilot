import React, { useState } from 'react';
import {
  X,
  User,
  Clock,
  ShieldCheck,
  Moon,
  Sun,
  Save,
  Check,
} from 'lucide-react';
import { AvatarPicker } from '../features/auth/AuthIllustration';
import type { Profile } from '../types';
import type { ThemeMode } from '../lib/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  onToast: (msg: string) => void;
}

export const ProfileSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  theme,
  onToggleTheme,
  onOpenAuth,
  onSignOut,
  onToast,
}) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '/avatars/career_navigator.jpg');
  const [dailyMinutes, setDailyMinutes] = useState(profile.daily_minutes);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>(profile.plan);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      daily_minutes: dailyMinutes,
      plan: selectedPlan,
      ai_prompts_left: selectedPlan === 'premium' ? 100 : Math.min(15, profile.ai_prompts_left),
    });
    onToast('✅ Profile & Settings successfully saved!');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
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
          maxWidth: '540px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
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
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--md-text-primary)' }}>
                Account & Preferences
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                Manage study pace, quota & theme
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

        {/* Avatar Picker */}
        <AvatarPicker selectedUrl={avatarUrl} onSelect={setAvatarUrl} />

        {/* Full Name & Target Role */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '6px' }}>
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
              color: 'var(--md-text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Daily Study Commitment (Docx Section 6) */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} color="#6366f1" /> Daily Study Commitment
            </label>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366f1' }}>
              {dailyMinutes} min / day
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                style={{
                  padding: '9px 4px',
                  borderRadius: '10px',
                  border: `1.5px solid ${dailyMinutes === mins ? '#6366f1' : 'var(--md-outline)'}`,
                  background: dailyMinutes === mins ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: dailyMinutes === mins ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Appearance & Dark Mode Toggle */}
        <div
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <strong style={{ fontSize: '13.5px', color: 'var(--md-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {theme === 'dark' ? <Moon size={16} color="#818cf8" /> : <Sun size={16} color="#f59e0b" />}
              Appearance Mode
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              Currently using {theme === 'dark' ? 'Dark Obsidian' : 'Material Light'}
            </span>
          </div>

          <button
            onClick={onToggleTheme}
            style={{
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '9999px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--md-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* Low-AI Subscription Tier Selection (Docx Section 9) */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '8px' }}>
            Subscription & Weekly AI Quota (Docx Section 9)
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Free Tier */}
            <div
              onClick={() => setSelectedPlan('free')}
              style={{
                border: `2px solid ${selectedPlan === 'free' ? '#6366f1' : 'var(--md-outline)'}`,
                background: selectedPlan === 'free' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13.5px', color: selectedPlan === 'free' ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)' }}>
                  Free Explorer
                </strong>
                {selectedPlan === 'free' && <Check size={16} color="#6366f1" />}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                15 coach calls / wk • $0 base cost
              </div>
            </div>

            {/* Premium Tier */}
            <div
              onClick={() => setSelectedPlan('premium')}
              style={{
                border: `2px solid ${selectedPlan === 'premium' ? '#7c3aed' : 'var(--md-outline)'}`,
                background: selectedPlan === 'premium' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                borderRadius: '14px',
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '13.5px', color: selectedPlan === 'premium' ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)' }}>
                  Pro Navigator
                </strong>
                {selectedPlan === 'premium' && <Check size={16} color="#7c3aed" />}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                100 coach calls / wk • Priority edge
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              style={{
                flex: 1,
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={16} /> {profile.email && !profile.is_guest ? 'Account Status' : 'Sign In / Up'}
            </button>

            <button
              onClick={handleSave}
              style={{
                flex: 1,
                background: 'var(--md-violet-gradient)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Save size={16} /> Save Changes
            </button>
          </div>

          {profile.email && !profile.is_guest && onSignOut && (
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Sign Out of {profile.email}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
