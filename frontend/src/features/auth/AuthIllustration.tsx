import React from 'react';
import { Compass, CheckCircle2, Flame } from 'lucide-react';
import { AVATAR_OPTIONS } from './avatarConstants';
import type { AvatarOption } from './avatarConstants';

export { AVATAR_OPTIONS };
export type { AvatarOption };

interface ShowcaseProps {
  selectedAvatarUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium 3D Career Navigator Showcase for Desktop Brand Panel
 */
export const AuthHeroShowcase: React.FC<ShowcaseProps> = ({
  selectedAvatarUrl = '/avatars/career_navigator.jpg',
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}
    >
      {/* Ambient Radial Halo */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(142, 169, 91, 0.25) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)',
          filter: 'blur(32px)',
          zIndex: 0,
        }}
      />

      {/* Main Avatar Presentation Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '280px',
          height: '280px',
          borderRadius: '32px',
          padding: '10px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        <img
          src={selectedAvatarUrl}
          alt="Career Navigator Hero"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '24px',
          }}
        />

        {/* Live Active Beacon Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: '#0F172A',
            border: '2px solid #8EA95B',
            borderRadius: '9999px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#8EA95B',
              boxShadow: '0 0 8px #8EA95B',
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
            Job-Ready Pacing
          </span>
        </div>
      </div>

      {/* Floating Card: Milestone Progress */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '-20px',
          zIndex: 2,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
          animation: 'floatSlow 4s ease-in-out infinite',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8EA95B, #6E8742)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          <CheckCircle2 size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>Winding Highway</div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>6-Stage Roadmap Active</div>
        </div>
      </div>

      {/* Floating Card: Weekly Accountability Reminders */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15px',
          right: '-25px',
          zIndex: 2,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
          animation: 'floatSlow 4s ease-in-out infinite 2s',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          <Flame size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>Multi-Week Alerts</div>
          <div style={{ fontSize: '10px', color: '#94A3B8' }}>Zero Unfinished Goals</div>
        </div>
      </div>
    </div>
  );
};

interface AvatarPickerProps {
  selectedUrl: string;
  onSelect: (url: string) => void;
}

/**
 * Interactive Avatar Selector for Sign Up & Profile Editing
 */
export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedUrl, onSelect }) => {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 700,
          color: '#475569',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Choose Your Career Avatar
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
        }}
      >
        {AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selectedUrl === avatar.url;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.url)}
              style={{
                background: isSelected ? '#F0FDF4' : '#F8FAFC',
                border: isSelected ? '2px solid #8EA95B' : '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(142, 169, 91, 0.2)' : 'none',
              }}
              title={`${avatar.name} (${avatar.role})`}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: isSelected ? '#2E5316' : '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {avatar.name}
              </span>
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#8EA95B',
                    color: '#FFFFFF',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Compact Mobile Brand Header
 */
export const MobileAuthHeader: React.FC<{ mode: 'signin' | 'signup'; avatarUrl?: string }> = ({
  mode,
  avatarUrl = '/avatars/career_navigator.jpg',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid #8EA95B',
          boxShadow: '0 4px 12px rgba(142, 169, 91, 0.25)',
          flexShrink: 0,
        }}
      >
        <img
          src={avatarUrl}
          alt="Career Voyager"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#8EA95B',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Compass size={12} strokeWidth={2.5} />
          Career Pilot
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>
          {mode === 'signup' ? 'Create Your Account' : 'Welcome Back, Pilot'}
        </h2>
      </div>
    </div>
  );
};
