import React from 'react';
import { Bell, Sparkles, Moon, Sun, LogOut, Compass } from 'lucide-react';
import type { Profile } from '../types';
import type { ThemeMode } from '../lib/theme';
import type { AIQuotaSummary } from '../features/ai/aiGateway';

interface Props {
  profile: Profile;
  aiQuota?: AIQuotaSummary | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onOpenGoalSettings?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<Props> = ({
  profile,
  aiQuota = null,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenNotifications,
  onOpenGoalSettings,
  onSignOut,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '2px 0',
      }}
    >
      {/* Brand & User Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--md-primary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={onOpenProfile}
          title="Account & Settings"
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
              Career Pilot
            </span>
            <span
              onClick={onOpenGoalSettings}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                padding: '1px 7px',
                borderRadius: '9999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Compass size={10} />
              {profile.target_role || 'Set Goal'}
            </span>
          </div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--md-text-primary)',
              margin: 0,
              cursor: 'pointer',
            }}
            onClick={onOpenProfile}
          >
            {profile.full_name}
          </h3>
        </div>
      </div>

      {/* Right Action Icons & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Live coach request quota */}
        {aiQuota && !profile.is_demo && <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline)',
            borderRadius: '9999px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--md-text-secondary)',
          }}
          title={`${aiQuota.coach.remaining} of ${aiQuota.coach.limit} coach requests left`}
        >
          <Sparkles size={12} color="var(--md-primary)" />
          <span>{aiQuota.coach.remaining} left</span>
        </div>}

        {/* Dark / Light Mode Switcher */}
        <button
          type="button"
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
            color: 'var(--md-text-secondary)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} />}
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
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
            color: 'var(--md-text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '9px',
              right: '9px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--md-primary)',
            }}
          />
        </button>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
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
            color: 'var(--md-text-secondary)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
