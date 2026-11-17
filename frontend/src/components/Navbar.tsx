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
    <header className="app-navbar">
      {/* Brand & User Greeting */}
      <div className="app-navbar-brand">
        <div
          className="app-navbar-avatar"
          onClick={onOpenProfile}
          title="Account & Settings"
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span className="app-navbar-title-tag" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-secondary)', flexShrink: 0 }}>
              Career Pilot
            </span>
            <span
              className="app-navbar-role"
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
                minWidth: 0,
              }}
            >
              <Compass size={10} style={{ flexShrink: 0 }} />
              <span className="app-navbar-role-text">{profile.target_role || 'Set Goal'}</span>
            </span>
          </div>
          <h3
            className="app-navbar-name"
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
      <div className="app-navbar-actions">
        {/* Live coach request quota */}
        {aiQuota && !profile.is_demo && <div
          className="app-navbar-quota"
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
          <span>{aiQuota.coach.remaining}<span className="app-navbar-quota-suffix"> left</span></span>
        </div>}

        {/* Dark / Light Mode Switcher */}
        <button
          type="button"
          className="app-navbar-icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} />}
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          className="app-navbar-icon-btn"
          onClick={onOpenNotifications}
          style={{ position: 'relative', color: 'var(--md-text-primary)' }}
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
          className="app-navbar-icon-btn"
          onClick={onSignOut}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
