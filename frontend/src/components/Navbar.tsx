import React from 'react';
import { Bell, Sparkles, Moon, Sun } from 'lucide-react';
import type { Profile } from '../types';
import type { ThemeMode } from '../lib/theme';

interface Props {
  profile: Profile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<Props> = ({
  profile,
  theme,
  onToggleTheme,
  onOpenProfile,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}
    >
      {/* User Greeting & Avatar (Matching Image 2 Left Screen) */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={onOpenProfile}
        title="Account & Settings"
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2.5px solid #6366f1',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.25)',
          }}
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--md-text-secondary)', display: 'block' }}>
            Good Morning!
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
            {profile.full_name}
          </h3>
        </div>
      </div>

      {/* Right Actions: AI Prompts Quota, Dark Mode Toggle & Notification Bell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Low-AI Quota Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--md-primary-container)',
            border: '1px solid var(--md-outline)',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--md-on-primary-container)',
          }}
        >
          <Sparkles size={13} color="#6366f1" />
          <span>{profile.ai_prompts_left} AI calls left</span>
        </div>

        {/* Dark Mode Switcher Button */}
        <button
          onClick={onToggleTheme}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--md-text-primary)',
            transition: 'all 0.2s ease',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={17} color="#f59e0b" />
          ) : (
            <Moon size={17} color="#6366f1" />
          )}
        </button>

        {/* Bell Button */}
        <button
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--md-text-primary)',
          }}
          title="Notifications"
        >
          <Bell size={17} color="var(--md-text-primary)" />
          <span
            style={{
              position: 'absolute',
              top: '9px',
              right: '10px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
            }}
          />
        </button>
      </div>
    </header>
  );
};
