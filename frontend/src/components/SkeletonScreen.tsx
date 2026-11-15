import React from 'react';
import type { ActiveNavTab } from '../types';

const SkeletonBlock: React.FC<{
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = 14, radius = 8, style }) => (
  <span
    aria-hidden="true"
    className="skeleton-block"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

export const ListSkeleton: React.FC<{ rows?: number; compact?: boolean; label?: string }> = ({
  rows = 3,
  compact = false,
  label = 'Loading list',
}) => (
  <div role="status" aria-busy="true" aria-label={label} style={{ display: 'grid', gap: compact ? 8 : 12 }}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        style={{
          padding: compact ? '10px 12px' : '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--md-outline, #e2e8f0)',
          background: 'var(--md-surface, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 6, flex: 1, minWidth: 0 }}>
          <SkeletonBlock width={index % 2 === 0 ? '62%' : '48%'} height={13} />
          <SkeletonBlock width={index % 2 === 0 ? '36%' : '42%'} height={10} />
        </div>
        <SkeletonBlock width={58} height={22} radius={999} />
      </div>
    ))}
  </div>
);

export const CardGridSkeleton: React.FC<{ count?: number; label?: string }> = ({
  count = 4,
  label = 'Loading cards',
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-label={label}
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
      gap: 14,
    }}
  >
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <SkeletonBlock width="58%" height={15} />
          <SkeletonBlock width={52} height={20} radius={999} />
        </div>
        <SkeletonBlock width="88%" height={12} />
        <SkeletonBlock width="44%" height={11} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <SkeletonBlock width={72} height={28} radius={8} />
          <SkeletonBlock width={86} height={28} radius={8} />
        </div>
      </div>
    ))}
  </div>
);

export const CVSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading resume builder"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gap: 20,
      marginBottom: 18,
    }}
  >
    <div className="skeleton-card" style={{ display: 'grid', gap: 14 }}>
      <SkeletonBlock width="40%" height={16} />
      <SkeletonBlock width="100%" height={38} radius={10} />
      <SkeletonBlock width="100%" height={38} radius={10} />
      <SkeletonBlock width="100%" height={84} radius={10} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <SkeletonBlock width="100%" height={36} radius={10} />
        <SkeletonBlock width="100%" height={36} radius={10} />
      </div>
    </div>
    <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
      <SkeletonBlock width="48%" height={22} />
      <SkeletonBlock width="66%" height={12} />
      <SkeletonBlock width="100%" height={1} />
      <SkeletonBlock width="94%" height={12} />
      <SkeletonBlock width="86%" height={12} />
      <SkeletonBlock width="72%" height={12} />
      <SkeletonBlock width="34%" height={14} style={{ marginTop: 8 }} />
      <SkeletonBlock width="90%" height={12} />
      <SkeletonBlock width="80%" height={12} />
    </div>
  </div>
);

export const InterviewSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-label="Loading interview arena" style={{ display: 'grid', gap: 16, maxWidth: 960, margin: '0 auto' }}>
    <div className="skeleton-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'grid', gap: 8, flex: 1 }}>
        <SkeletonBlock width="38%" height={20} />
        <SkeletonBlock width="58%" height={12} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonBlock width={84} height={32} radius={999} />
        <SkeletonBlock width={84} height={32} radius={999} />
      </div>
    </div>
    <div className="skeleton-card" style={{ display: 'grid', gap: 14 }}>
      <SkeletonBlock width={110} height={22} radius={999} />
      <SkeletonBlock width="82%" height={20} />
      <SkeletonBlock width="64%" height={14} />
      <SkeletonBlock width="100%" height={112} radius={10} />
      <div style={{ display: 'flex', gap: 10 }}>
        <SkeletonBlock width={132} height={38} radius={10} />
        <SkeletonBlock width={112} height={38} radius={10} />
      </div>
    </div>
  </div>
);

export const WorkspaceSkeleton: React.FC<{ variant: ActiveNavTab }> = ({ variant }) => {
  if (variant === 'interview') {
    return (
      <div style={{ padding: '20px 16px' }}>
        <InterviewSkeleton />
      </div>
    );
  }

  if (variant === 'cv') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading CV builder" style={{ padding: '20px 16px', display: 'grid', gap: 16 }}>
        <div className="skeleton-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <SkeletonBlock width="32%" height={22} />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBlock width={90} height={34} radius={9} />
            <SkeletonBlock width={110} height={34} radius={9} />
          </div>
        </div>
        <CVSkeleton />
      </div>
    );
  }

  if (variant === 'coach') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading AI coach" style={{ padding: '20px 16px', maxWidth: 880, margin: '0 auto', display: 'grid', gap: 14 }}>
        <div className="skeleton-card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBlock width={170} height={20} />
            <SkeletonBlock width={86} height={24} radius={999} />
          </div>
          <SkeletonBlock width="72%" height={56} radius={14} />
          <SkeletonBlock width="58%" height={44} radius={14} style={{ justifySelf: 'end' }} />
          <SkeletonBlock width="78%" height={68} radius={14} />
          <SkeletonBlock width="100%" height={44} radius={12} />
        </div>
      </div>
    );
  }

  if (variant === 'skills') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading skill gap analysis" style={{ padding: '20px 16px', display: 'grid', gap: 16 }}>
        <div className="skeleton-card" style={{ display: 'grid', gap: 10 }}>
          <SkeletonBlock width="34%" height={20} />
          <SkeletonBlock width="56%" height={13} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
            <SkeletonBlock width="44%" height={16} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SkeletonBlock width={88} height={28} radius={999} />
              <SkeletonBlock width={104} height={28} radius={999} />
              <SkeletonBlock width={76} height={28} radius={999} />
              <SkeletonBlock width={96} height={28} radius={999} />
            </div>
          </div>
          <CardGridSkeleton count={2} label="Loading skill gap cards" />
        </div>
      </div>
    );
  }

  if (variant === 'overview') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading overview analytics" style={{ padding: '20px 16px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-card" style={{ display: 'grid', gap: 8 }}>
              <SkeletonBlock width="50%" height={11} />
              <SkeletonBlock width="38%" height={24} />
              <SkeletonBlock width="64%" height={11} />
            </div>
          ))}
        </div>
        <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
          <SkeletonBlock width="28%" height={16} />
          <SkeletonBlock width="100%" height={170} radius={10} />
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading account profile" style={{ padding: '20px 16px', maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div className="skeleton-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SkeletonBlock width={64} height={64} radius="50%" />
          <div style={{ display: 'grid', gap: 8, flex: 1 }}>
            <SkeletonBlock width="34%" height={20} />
            <SkeletonBlock width="48%" height={12} />
          </div>
        </div>
        <ListSkeleton rows={3} label="Loading profile settings" />
      </div>
    );
  }

  if (variant === 'plan') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading weekly schedule" style={{ padding: '20px 16px', display: 'grid', gap: 16 }}>
        <div className="skeleton-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <SkeletonBlock width="36%" height={20} />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBlock width={90} height={32} radius={999} />
            <SkeletonBlock width={90} height={32} radius={999} />
          </div>
        </div>
        <ListSkeleton rows={5} label="Loading planned tasks" />
      </div>
    );
  }

  // Default ('home' roadmap view)
  return (
    <div role="status" aria-busy="true" aria-label="Loading roadmap" style={{ padding: '20px 16px', display: 'grid', gap: 16 }}>
      <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6, flex: 1 }}>
            <SkeletonBlock width="38%" height={22} />
            <SkeletonBlock width="54%" height={12} />
          </div>
          <SkeletonBlock width={116} height={34} radius={10} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <SkeletonBlock width="100%" height={48} radius={10} />
          <SkeletonBlock width="100%" height={48} radius={10} />
          <SkeletonBlock width="100%" height={48} radius={10} />
        </div>
      </div>
      <CardGridSkeleton count={4} label="Loading roadmap stages" />
    </div>
  );
};

export const AppScreenSkeleton: React.FC<{ variant: 'auth' | 'onboarding' | 'workspace'; label?: string }> = ({
  variant,
  label = 'Loading…',
}) => {
  if (variant === 'auth') {
    return (
      <div className="auth-page-shell skeleton-shell" role="status" aria-busy="true" aria-label={label}>
        <div
          className="auth-main-window"
          style={{
            maxWidth: '940px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '26px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            minHeight: '560px',
          }}
        >
          <div className="auth-left-brand-panel" style={{ width: '40%', padding: 28, background: '#f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <SkeletonBlock width={160} height={36} radius={10} />
              <SkeletonBlock width={190} height={18} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <SkeletonBlock width="80%" height={16} />
              <SkeletonBlock width="60%" height={12} />
            </div>
          </div>
          <div style={{ flex: 1, padding: '36px 40px', display: 'grid', gap: 16, alignContent: 'center' }}>
            <SkeletonBlock width={150} height={24} />
            <SkeletonBlock width="70%" height={13} />
            <SkeletonBlock width="100%" height={44} radius={11} />
            <SkeletonBlock width="100%" height={44} radius={11} />
            <SkeletonBlock width="100%" height={44} radius={11} />
            <SkeletonBlock width="100%" height={44} radius={11} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'onboarding') {
    return (
      <div className="onboarding-page" role="status" aria-busy="true" aria-label={label}>
        <header className="onboarding-topbar">
          <div className="onboarding-topbar-inner">
            <SkeletonBlock width={132} height={26} radius={8} />
            <SkeletonBlock width={68} height={14} />
          </div>
        </header>
        <div className="onboarding-main">
          <div className="onboarding-header-row">
            <div style={{ display: 'grid', gap: 8 }}>
              <SkeletonBlock width={230} height={26} />
              <SkeletonBlock width={310} height={14} />
            </div>
            <SkeletonBlock width={280} height={38} radius={10} />
          </div>
          <div className="onboarding-layout">
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonBlock key={index} width={96} height={30} radius={8} />
                ))}
              </div>
              <div className="onboarding-role-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonBlock key={index} width="100%" height={58} radius={10} />
                ))}
              </div>
              <div className="onboarding-exp-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} width="100%" height={58} radius={10} />
                ))}
              </div>
            </div>
            <div className="onboarding-summary-card" style={{ display: 'grid', gap: 14 }}>
              <SkeletonBlock width={90} height={12} />
              <SkeletonBlock width="82%" height={20} />
              <SkeletonBlock width="58%" height={13} />
              <SkeletonBlock width="100%" height={1} />
              <SkeletonBlock width="100%" height={16} />
              <SkeletonBlock width="100%" height={16} />
              <SkeletonBlock width="100%" height={70} radius={10} />
              <SkeletonBlock width="100%" height={44} radius={10} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-shell" role="status" aria-busy="true" aria-label={label}>
      <div className="skeleton-desktop-frame">
        <aside className="skeleton-sidebar">
          <SkeletonBlock width={148} height={32} radius={10} style={{ marginBottom: 12 }} />
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBlock key={index} width="100%" height={36} radius={10} />
          ))}
        </aside>
        <div style={{ display: 'grid', gridTemplateRows: '64px 1fr' }}>
          <div
            style={{
              background: 'var(--md-surface, #ffffff)',
              borderBottom: '1px solid var(--md-outline, #e2e8f0)',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SkeletonBlock width={180} height={18} />
            <div style={{ display: 'flex', gap: 10 }}>
              <SkeletonBlock width={34} height={34} radius="50%" />
              <SkeletonBlock width={34} height={34} radius="50%" />
            </div>
          </div>
          <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
            <WorkspaceSkeleton variant="home" />
          </div>
        </div>
      </div>
    </div>
  );
};
