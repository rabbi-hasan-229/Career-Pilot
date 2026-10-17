import React from 'react';
import { Bell, Sparkles, Moon, Sun, LogOut, Compass } from 'lucide-react';
import type { Profile } from '../types';
import type { ThemeMode } from '../lib/theme';

interface Props {
  profile: Profile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onOpenGoalSettings?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<Props> = ({
  profile,
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
            border: '2px solid #8EA95B',
            boxShadow: '0 2px 8px rgba(142, 169, 91, 0.25)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={onOpenProfile}
          title="Profile & Settings"
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-secondary, #64748B)' }}>
              Career Pilot
            </span>
            <span
              onClick={onOpenGoalSettings}
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                background: 'rgba(142, 169, 91, 0.15)',
                color: '#5C7433',
                padding: '1px 6px',
                borderRadius: '9999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Compass size={10} />
              {profile.target_role || 'Set Goal'}
            </span>
          </div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--md-text-primary, #1E293B)',
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
        {/* AI Quota Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            borderRadius: '9999px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--md-text-primary, #1E293B)',
          }}
          title={`${profile.ai_prompts_left} AI calls remaining this week`}
        >
          <Sparkles size={12} color="#8EA95B" />
          <span>{profile.ai_prompts_left} calls</span>
        </div>

        {/* Dark / Light Mode Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--md-text-primary, #1E293B)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#6366F1" />}
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            color: 'var(--md-text-primary, #1E293B)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          title="Roadmap Notifications & Alerts"
        >
          <Bell size={15} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#F97316',
            }}
          />
        </button>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#EF4444',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
          title="Sign Out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};
