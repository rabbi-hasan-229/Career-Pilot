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
  <div role="status" aria-busy="true" aria-label="Loading interview arena" style={{ display: 'grid', gap: 14, maxWidth: 960, margin: '0 auto', minWidth: 0 }}>
    <div className="skeleton-card skeleton-header-row">
      <div style={{ display: 'grid', gap: 8, flex: '1 1 180px', minWidth: 0 }}>
        <SkeletonBlock width="min(200px, 68%)" height={20} />
        <SkeletonBlock width="min(280px, 88%)" height={12} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SkeletonBlock width={76} height={32} radius={999} />
        <SkeletonBlock width={76} height={32} radius={999} />
      </div>
    </div>
    <div className="skeleton-card" style={{ display: 'grid', gap: 14 }}>
      <SkeletonBlock width={104} height={22} radius={999} />
      <SkeletonBlock width="86%" height={20} />
      <SkeletonBlock width="64%" height={14} />
      <SkeletonBlock width="100%" height={112} radius={10} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SkeletonBlock width={124} height={38} radius={10} />
        <SkeletonBlock width={108} height={38} radius={10} />
      </div>
    </div>
  </div>
);

export const WorkspaceSkeleton: React.FC<{ variant: ActiveNavTab }> = ({ variant }) => {
  if (variant === 'interview') {
    return (
      <div className="skeleton-workspace-pad">
        <InterviewSkeleton />
      </div>
    );
  }

  if (variant === 'cv') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading CV builder" className="skeleton-workspace-pad">
        <div className="skeleton-card skeleton-header-row">
          <SkeletonBlock width="min(180px, 58%)" height={22} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SkeletonBlock width={84} height={34} radius={9} />
            <SkeletonBlock width={104} height={34} radius={9} />
          </div>
        </div>
        <CVSkeleton />
      </div>
    );
  }

  if (variant === 'coach') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading AI coach" className="skeleton-workspace-pad" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div className="skeleton-card" style={{ display: 'grid', gap: 14 }}>
          <div className="skeleton-header-row">
            <SkeletonBlock width="min(165px, 55%)" height={20} />
            <SkeletonBlock width={78} height={24} radius={999} />
          </div>
          <SkeletonBlock width="78%" height={54} radius={14} />
          <SkeletonBlock width="62%" height={42} radius={14} style={{ justifySelf: 'end' }} />
          <SkeletonBlock width="84%" height={64} radius={14} />
          <SkeletonBlock width="100%" height={44} radius={12} />
        </div>
      </div>
    );
  }

  if (variant === 'skills') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading skill gap analysis" className="skeleton-workspace-pad">
        <div className="skeleton-card" style={{ display: 'grid', gap: 10 }}>
          <SkeletonBlock width="min(210px, 60%)" height={20} />
          <SkeletonBlock width="min(320px, 85%)" height={13} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 14 }}>
          <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
            <SkeletonBlock width="48%" height={16} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SkeletonBlock width={82} height={28} radius={999} />
              <SkeletonBlock width={96} height={28} radius={999} />
              <SkeletonBlock width={72} height={28} radius={999} />
              <SkeletonBlock width={88} height={28} radius={999} />
            </div>
          </div>
          <CardGridSkeleton count={2} label="Loading skill gap cards" />
        </div>
      </div>
    );
  }

  if (variant === 'overview') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading overview analytics" className="skeleton-workspace-pad">
        <div className="skeleton-kpi-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-card" style={{ display: 'grid', gap: 8 }}>
              <SkeletonBlock width="58%" height={11} />
              <SkeletonBlock width="42%" height={22} />
              <SkeletonBlock width="72%" height={11} />
            </div>
          ))}
        </div>
        <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
          <SkeletonBlock width="min(180px, 48%)" height={16} />
          <SkeletonBlock width="100%" height={164} radius={10} />
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading account profile" className="skeleton-workspace-pad" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="skeleton-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SkeletonBlock width={56} height={56} radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ display: 'grid', gap: 8, flex: 1, minWidth: 0 }}>
            <SkeletonBlock width="min(180px, 58%)" height={20} />
            <SkeletonBlock width="min(240px, 76%)" height={12} />
          </div>
        </div>
        <ListSkeleton rows={3} label="Loading profile settings" />
      </div>
    );
  }

  if (variant === 'plan') {
    return (
      <div role="status" aria-busy="true" aria-label="Loading weekly schedule" className="skeleton-workspace-pad">
        <div className="skeleton-card skeleton-header-row">
          <SkeletonBlock width="min(200px, 56%)" height={20} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SkeletonBlock width={82} height={32} radius={999} />
            <SkeletonBlock width={82} height={32} radius={999} />
          </div>
        </div>
        <ListSkeleton rows={5} label="Loading planned tasks" />
      </div>
    );
  }

  // Default ('home' roadmap view)
  return (
    <div role="status" aria-busy="true" aria-label="Loading roadmap" className="skeleton-workspace-pad">
      <div className="skeleton-card" style={{ display: 'grid', gap: 12 }}>
        <div className="skeleton-header-row">
          <div style={{ display: 'grid', gap: 6, flex: '1 1 160px', minWidth: 0 }}>
            <SkeletonBlock width="min(190px, 68%)" height={20} />
            <SkeletonBlock width="min(250px, 88%)" height={12} />
          </div>
          <SkeletonBlock width={104} height={32} radius={10} />
        </div>
        <div className="skeleton-stat-row">
          <SkeletonBlock width="100%" height={44} radius={10} />
          <SkeletonBlock width="100%" height={44} radius={10} />
          <SkeletonBlock width="100%" height={44} radius={10} />
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
        <div className="skeleton-auth-window">
          <div className="skeleton-auth-mobile-hero">
            <SkeletonBlock width={128} height={24} radius={8} />
            <SkeletonBlock width="68%" height={14} />
          </div>
          <div className="skeleton-auth-brand">
            <div style={{ display: 'grid', gap: 12 }}>
              <SkeletonBlock width={160} height={36} radius={10} />
              <SkeletonBlock width={190} height={18} />
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <SkeletonBlock width="80%" height={16} />
              <SkeletonBlock width="60%" height={12} />
            </div>
          </div>
          <div className="skeleton-auth-form">
            <SkeletonBlock width="min(160px, 52%)" height={24} />
            <SkeletonBlock width="76%" height={13} />
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
            <SkeletonBlock width={128} height={24} radius={8} />
            <SkeletonBlock width={64} height={14} />
          </div>
        </header>
        <div className="onboarding-main">
          <div className="onboarding-header-row">
            <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
              <SkeletonBlock width="min(230px, 72%)" height={24} />
              <SkeletonBlock width="min(310px, 94%)" height={14} />
            </div>
            <div className="onboarding-search-box" style={{ padding: 0, border: 'none', background: 'transparent' }}>
              <SkeletonBlock width="100%" height={38} radius={10} />
            </div>
          </div>
          <div className="onboarding-layout">
            <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
              <div className="onboarding-category-bar">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock key={index} width={88} height={30} radius={8} style={{ flexShrink: 0 }} />
                ))}
              </div>
              <div className="onboarding-role-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonBlock key={index} width="100%" height={54} radius={10} />
                ))}
              </div>
              <div className="onboarding-exp-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} width="100%" height={54} radius={10} />
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
              <SkeletonBlock width="100%" height={68} radius={10} />
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
        <div className="skeleton-workspace-frame">
          <div className="skeleton-topbar">
            <SkeletonBlock width="min(170px, 48%)" height={18} />
            <div style={{ display: 'flex', gap: 8 }}>
              <SkeletonBlock width={32} height={32} radius="50%" />
              <SkeletonBlock width={32} height={32} radius="50%" />
            </div>
          </div>
          <div className="skeleton-workspace-main">
            <WorkspaceSkeleton variant="home" />
          </div>
        </div>
      </div>
      <div className="skeleton-mobile-bottomnav" aria-hidden="true">
        <SkeletonBlock width={40} height={28} radius={8} />
        <SkeletonBlock width={40} height={28} radius={8} />
        <SkeletonBlock width={44} height={44} radius="50%" style={{ marginTop: -14 }} />
        <SkeletonBlock width={40} height={28} radius={8} />
        <SkeletonBlock width={40} height={28} radius={8} />
      </div>
    </div>
  );
};
