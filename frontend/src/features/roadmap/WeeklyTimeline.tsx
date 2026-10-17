import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FastForward,
  Pause,
  ChevronRight,
} from 'lucide-react';
import type { Milestone, Profile } from '../../types';

interface Props {
  milestones: Milestone[];
  profile: Profile;
  onApplyAction: (action: 'behind' | 'early' | 'pause') => void;
  onOpenGoalSettings: () => void;
}

export const WeeklyTimeline: React.FC<Props> = ({
  milestones,
  profile,
  onApplyAction,
  onOpenGoalSettings,
}) => {
  const totalEffort = milestones.reduce((sum, m) => sum + (m.effort_hours || 25), 0);
  const completedCount = milestones.filter((m) => m.status === 'done').length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div>
      {/* 1. Header Card: Compact & High Density */}
      <div
        style={{
          background: 'var(--md-surface, #FFFFFF)',
          border: '1px solid var(--md-outline, #E2E8F0)',
          borderRadius: '18px',
          padding: '16px 18px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#8EA95B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Career Roadmap Timeline
            </span>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--md-text-primary, #1E293B)',
                margin: '2px 0 4px 0',
                letterSpacing: '-0.02em',
              }}
            >
              {profile.target_role}
            </h2>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
              {totalEffort}h Total Effort · {profile.daily_minutes}m/day · {profile.target_timeline_months || 6} Months Goal
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGoalSettings}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#1E293B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Adjust Goal
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Milestone Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <div
            style={{
              flex: 1,
              height: '6px',
              background: 'var(--md-surface-variant, #E2E8F0)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: '#8EA95B',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-primary, #1E293B)' }}>
            {completedCount}/{milestones.length} Stages ({progressPct}%)
          </span>
        </div>
      </div>

      {/* 2. Zero-Cost Re-planning Actions (Section 6 Docx) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '18px',
        }}
      >
        <button
          type="button"
          onClick={() => onApplyAction('behind')}
          style={{
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
            borderRadius: '12px',
            padding: '10px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <Clock size={14} color="#EA580C" />
            <strong style={{ fontSize: '11.5px', color: '#EA580C' }}>I'm Behind</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>
            +3d Milestone shift
          </span>
        </button>

        <button
          type="button"
          onClick={() => onApplyAction('early')}
          style={{
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '10px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <FastForward size={14} color="#10B981" />
            <strong style={{ fontSize: '11.5px', color: '#10B981' }}>Finished Early</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>
            Pull next stage
          </span>
        </button>

        <button
          type="button"
          onClick={() => onApplyAction('pause')}
          style={{
            background: 'var(--md-surface, #FFFFFF)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            borderRadius: '12px',
            padding: '10px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <Pause size={14} color="#6366F1" />
            <strong style={{ fontSize: '11.5px', color: '#6366F1' }}>Pause Week</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>
            +7d Safe pause
          </span>
        </button>
      </div>

      {/* 3. Milestone Stage Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {milestones.map((m) => {
          const isDone = m.status === 'done';
          const isDoing = m.status === 'doing';

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '14px',
                borderLeft: `4px solid ${isDone ? '#10B981' : isDoing ? '#8EA95B' : '#CBD5E1'}`,
                background: isDoing ? 'rgba(142, 169, 91, 0.05)' : 'var(--md-surface, #FFFFFF)',
                border: `1px solid ${isDoing ? 'rgba(142, 169, 91, 0.3)' : 'var(--md-outline, #E2E8F0)'}`,
                borderLeftWidth: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isDone ? 'rgba(16, 185, 129, 0.15)' : isDoing ? '#8EA95B' : '#F1F5F9',
                    color: isDone ? '#10B981' : isDoing ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? <CheckCircle2 size={18} /> : m.position}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--md-text-primary, #1E293B)', margin: 0 }}>
                      {m.title}
                    </h4>
                    {isDoing && (
                      <span
                        style={{
                          background: '#8EA95B',
                          color: '#FFFFFF',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                        }}
                      >
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={11} /> {m.week_range || `${m.start_date} → ${m.end_date}`}
                    </span>
                    <span>·</span>
                    <span>{m.effort_hours || 25}h Effort</span>
                  </div>

                  {/* Skills Chips */}
                  {m.skills_covered && m.skills_covered.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {m.skills_covered.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#F1F5F9',
                            color: '#475569',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: isDone ? 'rgba(16, 185, 129, 0.12)' : isDoing ? 'rgba(142, 169, 91, 0.12)' : '#F1F5F9',
                    color: isDone ? '#10B981' : isDoing ? '#5C7433' : '#64748B',
                  }}
                >
                  {m.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
