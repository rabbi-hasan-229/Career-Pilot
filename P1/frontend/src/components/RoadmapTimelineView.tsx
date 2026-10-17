import React from 'react';
import { Calendar, Clock, CheckCircle2, FastForward, Pause } from 'lucide-react';
import type { Milestone, Profile } from '../types';

interface Props {
  milestones: Milestone[];
  profile: Profile;
  onApplyAction: (action: 'behind' | 'early' | 'pause') => void;
  onOpenRoleModal: () => void;
}

export const RoadmapTimelineView: React.FC<Props> = ({
  milestones,
  profile,
  onApplyAction,
  onOpenRoleModal,
}) => {
  const totalEffort = milestones.reduce((sum, m) => sum + (m.effort_hours || 25), 0);
  const completedCount = milestones.filter((m) => m.status === 'done').length;
  const progressPct = Math.round((completedCount / milestones.length) * 100);

  return (
    <div>
      {/* 1. Header Card */}
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
              Deterministic Planner Engine (Docx Section 6)
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--md-text-primary)', margin: '4px 0' }}>
              {profile.target_role}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              {totalEffort} Hours Effort · {profile.daily_minutes} mins/day commitment · Zero AI cost
            </p>
          </div>

          <button
            className="btn-m3-white"
            onClick={onOpenRoleModal}
            style={{ border: '1px solid var(--md-outline)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }}
          >
            Adjust Target Date
          </button>
        </div>

        {/* Milestone Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
          <div style={{ flex: 1, height: '8px', background: 'var(--md-surface-variant)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--md-primary)', borderRadius: '9999px' }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
            {completedCount}/{milestones.length} Stages ({progressPct}%)
          </span>
        </div>
      </div>

      {/* 2. Zero-Cost Re-planning Actions (Section 6 Docx) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => onApplyAction('behind')}
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid rgba(234, 88, 12, 0.35)',
            borderRadius: '16px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Clock size={16} color="#ea580c" />
            <strong style={{ fontSize: '12px', color: '#ea580c' }}>I'm Behind</strong>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--md-text-secondary)', margin: 0 }}>
            Shifts current milestone by +3 days.
          </p>
        </button>

        <button
          onClick={() => onApplyAction('early')}
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '16px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <FastForward size={16} color="#10b981" />
            <strong style={{ fontSize: '12px', color: '#10b981' }}>Finished Early</strong>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--md-text-secondary)', margin: 0 }}>
            Pulls next milestone forward.
          </p>
        </button>

        <button
          onClick={() => onApplyAction('pause')}
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            borderRadius: '16px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Pause size={16} color="#6366f1" />
            <strong style={{ fontSize: '12px', color: '#6366f1' }}>Pause a Week</strong>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--md-text-secondary)', margin: 0 }}>
            Shifts dates by 7 days safely.
          </p>
        </button>
      </div>

      {/* 3. Milestones Timeline Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {milestones.map((m) => {
          const isDone = m.status === 'done';
          const isDoing = m.status === 'doing';

          return (
            <div
              key={m.id}
              className="m3-surface-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderLeft: `5px solid ${isDone ? '#10b981' : isDoing ? '#6366f1' : 'var(--md-outline)'}`,
                background: isDoing ? 'var(--md-surface)' : 'var(--md-surface)',
                boxShadow: isDoing ? 'var(--md-surface-glow)' : 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isDone ? 'rgba(16, 185, 129, 0.2)' : isDoing ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                    color: isDone ? '#10b981' : isDoing ? '#6366f1' : 'var(--md-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  {isDone ? <CheckCircle2 size={20} /> : m.position}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
                      {m.title}
                    </h4>
                    {isDoing && (
                      <span
                        style={{
                          background: 'var(--md-primary-container)',
                          color: 'var(--md-on-primary-container)',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        CURRENT STAGE
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {m.start_date} → {m.end_date} · {m.effort_hours || 25}h Effort
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: isDone ? 'rgba(16, 185, 129, 0.15)' : isDoing ? 'rgba(99, 102, 241, 0.15)' : 'var(--md-surface-variant)',
                    color: isDone ? '#10b981' : isDoing ? '#6366f1' : 'var(--md-text-muted)',
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
