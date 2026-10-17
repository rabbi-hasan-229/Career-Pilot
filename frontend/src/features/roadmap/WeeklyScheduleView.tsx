import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FastForward,
  Pause,
  ChevronDown,
  Sparkles,
  Flame,
  BookOpen,
  Code2,
  Layers,
  ShieldCheck,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Milestone, Task, Profile, TaskActionType } from '../../types';

interface Props {
  milestones: Milestone[];
  tasks: Task[];
  profile: Profile | null;
  onToggleTaskComplete: (taskId: string) => void;
  onApplyPlannerAction?: (action: 'behind' | 'early' | 'pause') => void;
  onOpenGoalSettings: () => void;
  onOpenCoach?: () => void;
}

type ScheduleTab = 'focus' | 'all-stages' | 'calendar';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const typeConfig: Record<TaskActionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Learn: {
    label: 'LEARN',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.08)',
    icon: <BookOpen size={12} />,
  },
  Build: {
    label: 'BUILD',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    icon: <Code2 size={12} />,
  },
  Practice: {
    label: 'PRACTICE',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.08)',
    icon: <Layers size={12} />,
  },
  Checkpoint: {
    label: 'CHECKPOINT',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    icon: <ShieldCheck size={12} />,
  },
};

export const WeeklyScheduleView: React.FC<Props> = ({
  milestones,
  tasks,
  profile,
  onToggleTaskComplete,
  onApplyPlannerAction,
  onOpenGoalSettings,
  onOpenCoach,
}) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('focus');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // 1. Identify active stage (first milestone with incomplete tasks)
  const activeMilestoneIndex = useMemo(() => {
    if (milestones.length === 0) return 0;
    for (let i = 0; i < milestones.length; i++) {
      const mTasks = tasks.filter((t) => t.milestone_id === milestones[i].id);
      if (mTasks.some((t) => t.done_at == null)) {
        return i;
      }
    }
    return 0;
  }, [milestones, tasks]);

  const currentMilestone = useMemo(() => {
    if (selectedMilestoneId) {
      return milestones.find((m) => m.id === selectedMilestoneId) || milestones[activeMilestoneIndex] || milestones[0];
    }
    return milestones[activeMilestoneIndex] || milestones[0];
  }, [milestones, selectedMilestoneId, activeMilestoneIndex]);

  const currentTasks = useMemo(() => {
    if (!currentMilestone) return [];
    return tasks.filter((t) => t.milestone_id === currentMilestone.id);
  }, [currentMilestone, tasks]);

  // Overall Stats
  const totalEffortHours = milestones.reduce((sum, m) => sum + (m.effort_hours || 25), 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done_at != null).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Current stage stats
  const currentStageCompletedCount = currentTasks.filter((t) => t.done_at != null).length;
  const currentStagePct = currentTasks.length > 0 ? Math.round((currentStageCompletedCount / currentTasks.length) * 100) : 0;

  // Toggle stage expansion
  const toggleMilestoneExpanded = (id: string) => {
    setExpandedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle task click with celebratory micro-interaction
  const handleTaskCheck = (task: Task, e: React.MouseEvent) => {
    const wasDone = task.done_at != null;
    onToggleTaskComplete(task.id);
    if (!wasDone) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 32,
        spread: 55,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ['#8EA95B', '#2563EB', '#10B981', '#38BDF8'],
      });
    }
  };

  const dailyMinutes = profile?.daily_minutes || 60;
  const roleName = profile?.target_role || 'Career Quest';

  return (
    <div className="ws-page-container">
      {/* ── Top Header Bar ── */}
      <header className="ws-header-card">
        <div className="ws-header-top">
          <div className="ws-header-title-block">
            <div className="ws-badge-row">
              <span className="ws-badge-kicker">WEEKLY EXECUTION SCHEDULE</span>
              <span className="ws-badge-timeline">
                <Clock size={11} /> {dailyMinutes}m/day · 5d/week · {totalEffortHours}h curriculum
              </span>
            </div>
            <h1 className="ws-header-role">{roleName}</h1>
            <p className="ws-header-sub">
              Target stage: <strong>{currentMilestone?.title || 'Foundations'}</strong> ({currentStagePct}% complete)
            </p>
          </div>

          <div className="ws-header-actions">
            <button
              type="button"
              className="ws-btn-adjust"
              onClick={onOpenGoalSettings}
              title="Adjust Pace & Career Goal"
            >
              <SlidersHorizontal size={13} />
              <span>Adjust Goal</span>
            </button>
            {onOpenCoach && (
              <button
                type="button"
                className="ws-btn-coach"
                onClick={onOpenCoach}
                title="Ask AI Career Coach"
              >
                <Sparkles size={13} />
                <span>Coach Advice</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Progress Meter */}
        <div className="ws-progress-meter">
          <div className="ws-meter-track">
            <div className="ws-meter-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="ws-meter-label">
            <span>Overall Roadmap Progress: <strong>{completedTasks}/{totalTasks} Goals</strong></span>
            <span className="ws-meter-pct">{progressPct}% Complete</span>
          </div>
        </div>

        {/* ── Agile Planner Action Chips (Section 6 Docx Zero-Cost Rebalancing) ── */}
        <div className="ws-rebalance-strip">
          <span className="ws-rebalance-label">Pacing Actions:</span>
          <button
            type="button"
            className="ws-action-chip behind"
            onClick={() => onApplyPlannerAction?.('behind')}
            title="Shift dates by +3 days without stress"
          >
            <Clock size={12} className="ws-chip-icon" />
            <span>I'm Behind (+3d)</span>
          </button>
          <button
            type="button"
            className="ws-action-chip early"
            onClick={() => onApplyPlannerAction?.('early')}
            title="Pull forward next week's tasks early"
          >
            <FastForward size={12} className="ws-chip-icon" />
            <span>Finished Early</span>
          </button>
          <button
            type="button"
            className="ws-action-chip pause"
            onClick={() => onApplyPlannerAction?.('pause')}
            title="Pause roadmap for 7 days without breaking streak"
          >
            <Pause size={12} className="ws-chip-icon" />
            <span>Pause Week (+7d)</span>
          </button>
        </div>
      </header>

      {/* ── Segmented Navigation View Switcher ── */}
      <div className="ws-view-switcher" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'focus'}
          className={`ws-tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setActiveTab('focus')}
        >
          <Calendar size={14} />
          <span>This Week's Focus</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all-stages'}
          className={`ws-tab-btn ${activeTab === 'all-stages' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-stages')}
        >
          <Layers size={14} />
          <span>All Stages ({milestones.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'calendar'}
          className={`ws-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <CalendarDays size={14} />
          <span>Weekly Matrix</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: THIS WEEK'S FOCUS (Minimalist Day-by-Day Sessions)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'focus' && currentMilestone && (
        <section className="ws-focus-section" aria-label="This week's focus">
          {/* Active Stage Card Banner */}
          <div className="ws-stage-banner">
            <div className="ws-stage-banner-header">
              <div>
                <span className="ws-stage-pill">
                  STAGE {String(activeMilestoneIndex + 1).padStart(2, '0')} OF {milestones.length}
                </span>
                <h2 className="ws-stage-banner-title">{currentMilestone.title}</h2>
              </div>
              <div className="ws-stage-metric">
                <span className="ws-metric-val">{currentStageCompletedCount}/{currentTasks.length}</span>
                <span className="ws-metric-sub">Tasks Done</span>
              </div>
            </div>

            {/* Skills chips */}
            {currentMilestone.skills_covered && currentMilestone.skills_covered.length > 0 && (
              <div className="ws-skill-pills">
                {currentMilestone.skills_covered.map((s) => (
                  <span key={s} className="ws-skill-pill">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Daily Schedule Blocks */}
          <div className="ws-daily-grid">
            {currentTasks.map((task, idx) => {
              const isDone = task.done_at != null;
              const dayName = DAY_NAMES[idx % DAY_NAMES.length];
              const taskType = (task.type || 'Learn') as TaskActionType;
              const typeMeta = typeConfig[taskType] || typeConfig.Learn;

              return (
                <div
                  key={task.id}
                  className={`ws-day-card ${isDone ? 'completed' : ''}`}
                  onClick={(e) => handleTaskCheck(task, e)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isDone}
                  onKeyDown={(e) => e.key === 'Enter' && handleTaskCheck(task, e as unknown as React.MouseEvent)}
                >
                  <div className="ws-day-header">
                    <div className="ws-day-kicker">
                      <span className="ws-day-name">{dayName}</span>
                      <span className="ws-day-time">{task.est_minutes || dailyMinutes} min session</span>
                    </div>

                    <span
                      className="ws-type-tag"
                      style={{ color: typeMeta.color, background: typeMeta.bg }}
                    >
                      {typeMeta.icon}
                      {typeMeta.label}
                    </span>
                  </div>

                  <div className="ws-task-row">
                    <div className={`ws-custom-check ${isDone ? 'checked' : ''}`} aria-hidden="true">
                      {isDone ? '✓' : ''}
                    </div>
                    <div className="ws-task-body">
                      <p className={`ws-task-text ${isDone ? 'done' : ''}`}>{task.title}</p>
                      {isDone && (
                        <span className="ws-task-completed-label">✓ Completed & Recorded</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: ALL STAGES (Minimalist Chronological List)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'all-stages' && (
        <section className="ws-stages-section" aria-label="All roadmap stages">
          <div className="ws-stages-list">
            {milestones.map((m, idx) => {
              const mTasks = tasks.filter((t) => t.milestone_id === m.id);
              const mDone = mTasks.filter((t) => t.done_at != null).length;
              const isFinished = mTasks.length > 0 && mDone === mTasks.length;
              const isCurrent = idx === activeMilestoneIndex;
              const isExpanded = expandedMilestones[m.id] ?? isCurrent;

              return (
                <div
                  key={m.id}
                  className={`ws-stage-row-card ${isFinished ? 'finished' : isCurrent ? 'current' : ''}`}
                >
                  <div
                    className="ws-stage-row-summary"
                    onClick={() => {
                      toggleMilestoneExpanded(m.id);
                      setSelectedMilestoneId(m.id);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="ws-stage-num-badge">
                      {isFinished ? (
                        <CheckCircle2 size={16} className="ws-check-icon" />
                      ) : (
                        <span>{String(idx + 1).padStart(2, '0')}</span>
                      )}
                    </div>

                    <div className="ws-stage-info">
                      <div className="ws-stage-headline">
                        <h3>{m.title}</h3>
                        {isCurrent && <span className="ws-active-pill">CURRENT ACTIVE</span>}
                        {isFinished && <span className="ws-done-pill">COMPLETED</span>}
                      </div>

                      <div className="ws-stage-meta-row">
                        <span>{m.effort_hours || 25}h Effort</span>
                        <span>·</span>
                        <span>{mDone}/{mTasks.length} Tasks Complete</span>
                        {m.week_range && (
                          <>
                            <span>·</span>
                            <span>{m.week_range}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ws-stage-chevron">
                      <ChevronDown
                        size={18}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Expanded Task Checklist */}
                  {isExpanded && (
                    <div className="ws-stage-tasks-drawer">
                      <ul className="ws-drawer-task-list">
                        {mTasks.map((t) => {
                          const done = t.done_at != null;
                          return (
                            <li
                              key={t.id}
                              className={`ws-drawer-item ${done ? 'done' : ''}`}
                              onClick={(e) => handleTaskCheck(t, e)}
                            >
                              <span className={`ws-custom-check sm ${done ? 'checked' : ''}`}>
                                {done ? '✓' : ''}
                              </span>
                              <span className="ws-drawer-item-title">{t.title}</span>
                            </li>
                          );
                        })}
                      </ul>

                      {m.skills_covered && m.skills_covered.length > 0 && (
                        <div className="ws-skill-pills mt-2">
                          {m.skills_covered.map((s) => (
                            <span key={s} className="ws-skill-pill sm">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 3: WEEKLY CALENDAR MATRIX
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <section className="ws-calendar-section" aria-label="Weekly matrix">
          <div className="ws-matrix-card">
            <div className="ws-matrix-header">
              <div>
                <h3 className="ws-matrix-title">Weekly Habit Pacing</h3>
                <p className="ws-matrix-sub">
                  Recommended daily rhythm for <strong>{roleName}</strong> based on your {dailyMinutes} min/day commitment.
                </p>
              </div>
              <div className="ws-streak-pill">
                <Flame size={14} color="#F97316" />
                <span>{profile?.streak_days || 1} Day Streak</span>
              </div>
            </div>

            <div className="ws-matrix-grid">
              {DAY_NAMES.map((day, i) => {
                const isWeekend = i >= 5;
                const assignedTask = currentTasks[i % currentTasks.length];
                const isDone = assignedTask?.done_at != null;

                return (
                  <div key={day} className={`ws-matrix-col ${isWeekend ? 'weekend' : ''}`}>
                    <div className="ws-matrix-day-header">
                      <span className="ws-matrix-day-abbr">{day.slice(0, 3)}</span>
                      <span className="ws-matrix-day-mins">{isWeekend ? 'Flex' : `${dailyMinutes}m`}</span>
                    </div>

                    <div className={`ws-matrix-slot ${isDone ? 'completed' : assignedTask ? 'active' : 'rest'}`}>
                      {assignedTask ? (
                        <>
                          <div className="ws-slot-status">
                            {isDone ? '✓ Completed' : 'Scheduled'}
                          </div>
                          <div className="ws-slot-title">{assignedTask.title}</div>
                        </>
                      ) : (
                        <div className="ws-slot-rest">Rest & Catch-up</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style>{weeklyScheduleStyles}</style>
    </div>
  );
};

// ─── Minimalist Design System Styles ──────────────────────────────────────────
const weeklyScheduleStyles = String.raw`
.ws-page-container {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 4px 48px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--md-text-primary, #0F172A);
}
@media (max-width: 680px) {
  .ws-page-container {
    padding-bottom: 96px;
  }
}

/* ── HEADER CARD ── */
.ws-header-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 20px;
  padding: 22px 24px;
  margin-bottom: 18px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  transition: background 0.25s ease, border-color 0.25s ease;
}

.ws-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.ws-header-title-block {
  flex: 1 1 320px;
}

.ws-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.ws-badge-kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--cp-olive, #8EA95B);
  text-transform: uppercase;
}

.ws-badge-timeline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  padding: 2px 8px;
  border-radius: 9999px;
}

.ws-header-role {
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.02em;
}

.ws-header-sub {
  margin: 0;
  font-size: 13px;
  color: var(--md-text-secondary, #64748B);
}

.ws-header-sub strong {
  color: var(--md-text-primary, #0F172A);
}

.ws-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ws-btn-adjust,
.ws-btn-coach {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ws-btn-adjust {
  background: var(--md-surface-variant, #F1F5F9);
  border: 1px solid var(--md-outline, #E2E8F0);
  color: var(--md-text-primary, #0F172A);
}

.ws-btn-adjust:hover {
  background: var(--md-outline, #E2E8F0);
}

.ws-btn-coach {
  background: #2563EB;
  border: none;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.ws-btn-coach:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
}

/* Progress Meter */
.ws-progress-meter {
  margin-bottom: 16px;
}

.ws-meter-track {
  width: 100%;
  height: 6px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.ws-meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #8EA95B, #10B981);
  border-radius: 9999px;
  transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-meter-label {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--md-text-secondary, #64748B);
}

.ws-meter-pct {
  font-weight: 800;
  color: #10B981;
}

/* Pacing Actions Strip */
.ws-rebalance-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid var(--md-outline, #E2E8F0);
}

.ws-rebalance-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--md-text-muted, #94A3B8);
}

.ws-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  background: var(--md-surface, #FFFFFF);
  transition: all 0.15s ease;
}

.ws-action-chip.behind {
  border: 1px solid rgba(234, 88, 12, 0.3);
  color: #EA580C;
}
.ws-action-chip.behind:hover {
  background: rgba(234, 88, 12, 0.08);
}

.ws-action-chip.early {
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10B981;
}
.ws-action-chip.early:hover {
  background: rgba(16, 185, 129, 0.08);
}

.ws-action-chip.pause {
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366F1;
}
.ws-action-chip.pause:hover {
  background: rgba(99, 102, 241, 0.08);
}

/* ── VIEW SWITCHER ── */
.ws-view-switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 12px;
  padding: 4px;
}

.ws-tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.18s ease;
}

.ws-tab-btn.active {
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-primary, #0F172A);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* ── STAGE BANNER ── */
.ws-stage-banner {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.ws-stage-banner-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.ws-stage-pill {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--cp-olive, #8EA95B);
  display: block;
  margin-bottom: 2px;
}

.ws-stage-banner-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.01em;
}

.ws-stage-metric {
  text-align: right;
  flex-shrink: 0;
}

.ws-metric-val {
  font-size: 18px;
  font-weight: 900;
  color: #10B981;
  display: block;
}

.ws-metric-sub {
  font-size: 10.5px;
  color: var(--md-text-secondary, #64748B);
}

.ws-skill-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ws-skill-pill {
  font-size: 10.5px;
  font-weight: 600;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  padding: 3px 8px;
  border-radius: 6px;
}

.ws-skill-pill.sm {
  font-size: 9.5px;
  padding: 2px 6px;
}

/* ── DAILY CARDS GRID ── */
.ws-daily-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ws-day-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: all 0.15s ease;
}

.ws-day-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
}

.ws-day-card.completed {
  background: rgba(16, 185, 129, 0.03);
  border-color: rgba(16, 185, 129, 0.25);
}

.ws-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ws-day-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ws-day-name {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-day-time {
  font-size: 11px;
  color: var(--md-text-muted, #94A3B8);
}

.ws-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.4px;
}

.ws-task-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ws-custom-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid var(--md-outline-variant, #CBD5E1);
  background: var(--md-surface, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  color: #FFFFFF;
  margin-top: 2px;
  transition: all 0.15s ease;
}

.ws-custom-check.sm {
  width: 15px;
  height: 15px;
  font-size: 9.5px;
}

.ws-custom-check.checked {
  background: #10B981;
  border-color: #10B981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.35);
}

.ws-task-body {
  flex: 1;
}

.ws-task-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--md-text-primary, #0F172A);
  font-weight: 500;
  transition: all 0.15s ease;
}

.ws-task-text.done {
  color: var(--md-text-muted, #94A3B8);
  text-decoration: line-through;
}

.ws-task-completed-label {
  display: inline-block;
  margin-top: 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: #10B981;
}

/* ── STAGES LIST (VIEW 2) ── */
.ws-stages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ws-stage-row-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: all 0.15s ease;
}

.ws-stage-row-card.current {
  border-left: 4px solid var(--cp-olive, #8EA95B);
  background: rgba(142, 169, 91, 0.03);
}

.ws-stage-row-card.finished {
  border-left: 4px solid #10B981;
}

.ws-stage-row-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
}

.ws-stage-num-badge {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-primary, #0F172A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 800;
}

.ws-stage-row-card.current .ws-stage-num-badge {
  background: var(--cp-olive, #8EA95B);
  color: #FFFFFF;
}

.ws-stage-row-card.finished .ws-stage-num-badge {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.ws-stage-info {
  flex: 1;
}

.ws-stage-headline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.ws-stage-headline h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-active-pill {
  font-size: 9px;
  font-weight: 800;
  background: var(--cp-olive, #8EA95B);
  color: #FFFFFF;
  padding: 1px 6px;
  border-radius: 9999px;
}

.ws-done-pill {
  font-size: 9px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  padding: 1px 6px;
  border-radius: 9999px;
}

.ws-stage-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--md-text-secondary, #64748B);
}

.ws-stage-chevron {
  color: var(--md-text-muted, #94A3B8);
}

.ws-stage-tasks-drawer {
  padding: 0 16px 14px 60px;
  border-top: 1px solid var(--md-outline, #E2E8F0);
  background: var(--md-surface, #FFFFFF);
}

.ws-drawer-task-list {
  list-style: none;
  margin: 8px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ws-drawer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 3px 0;
}

.ws-drawer-item-title {
  font-size: 12.5px;
  color: var(--md-text-primary, #0F172A);
}

.ws-drawer-item.done .ws-drawer-item-title {
  color: var(--md-text-muted, #94A3B8);
  text-decoration: line-through;
}

/* ── MATRIX VIEW (VIEW 3) ── */
.ws-matrix-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.ws-matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.ws-matrix-title {
  margin: 0 0 3px 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-matrix-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--md-text-secondary, #64748B);
}

.ws-streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(249, 115, 22, 0.1);
  color: #EA580C;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.ws-matrix-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
@media (max-width: 768px) {
  .ws-matrix-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.ws-matrix-col {
  background: var(--md-surface-variant, #F1F5F9);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 12px;
  padding: 10px 8px;
}

.ws-matrix-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ws-matrix-day-abbr {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-matrix-day-mins {
  font-size: 10px;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
}

.ws-matrix-slot {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 8px;
  padding: 8px;
  min-height: 85px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ws-matrix-slot.completed {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.05);
}

.ws-slot-status {
  font-size: 9.5px;
  font-weight: 800;
  color: #10B981;
}

.ws-slot-title {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--md-text-primary, #0F172A);
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.ws-slot-rest {
  font-size: 11px;
  color: var(--md-text-muted, #94A3B8);
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* ── DARK MODE TOKENS OVERRIDE ── */
:root.dark .ws-page-container,
[data-theme='dark'] .ws-page-container,
body.dark .ws-page-container {
  color: #F8FAFC;
}

:root.dark .ws-header-card,
[data-theme='dark'] .ws-header-card,
body.dark .ws-header-card,
:root.dark .ws-view-switcher,
[data-theme='dark'] .ws-view-switcher,
body.dark .ws-view-switcher,
:root.dark .ws-stage-banner,
[data-theme='dark'] .ws-stage-banner,
body.dark .ws-stage-banner,
:root.dark .ws-day-card,
[data-theme='dark'] .ws-day-card,
body.dark .ws-day-card,
:root.dark .ws-stage-row-card,
[data-theme='dark'] .ws-stage-row-card,
body.dark .ws-stage-row-card,
:root.dark .ws-matrix-card,
[data-theme='dark'] .ws-matrix-card,
body.dark .ws-matrix-card,
:root.dark .ws-matrix-slot,
[data-theme='dark'] .ws-matrix-slot,
body.dark .ws-matrix-slot {
  background: #111827;
  border-color: #2B3545;
}

:root.dark .ws-btn-adjust,
[data-theme='dark'] .ws-btn-adjust,
body.dark .ws-btn-adjust,
:root.dark .ws-tab-btn.active,
[data-theme='dark'] .ws-tab-btn.active,
body.dark .ws-tab-btn.active,
:root.dark .ws-skill-pill,
[data-theme='dark'] .ws-skill-pill,
body.dark .ws-skill-pill,
:root.dark .ws-matrix-col,
[data-theme='dark'] .ws-matrix-col,
body.dark .ws-matrix-col,
:root.dark .ws-stage-num-badge,
[data-theme='dark'] .ws-stage-num-badge,
body.dark .ws-stage-num-badge {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}

:root.dark .ws-stage-tasks-drawer,
[data-theme='dark'] .ws-stage-tasks-drawer,
body.dark .ws-stage-tasks-drawer {
  background: #0F172A;
  border-color: #1E293B;
}

:root.dark .ws-custom-check,
[data-theme='dark'] .ws-custom-check,
body.dark .ws-custom-check {
  background: #0F172A;
  border-color: #475569;
}

:root.dark .ws-custom-check.checked,
[data-theme='dark'] .ws-custom-check.checked,
body.dark .ws-custom-check.checked {
  background: #10B981;
  border-color: #10B981;
}

:root.dark .ws-header-role,
[data-theme='dark'] .ws-header-role,
body.dark .ws-header-role,
:root.dark .ws-stage-banner-title,
[data-theme='dark'] .ws-stage-banner-title,
body.dark .ws-stage-banner-title,
:root.dark .ws-day-name,
[data-theme='dark'] .ws-day-name,
body.dark .ws-day-name,
:root.dark .ws-task-text,
[data-theme='dark'] .ws-task-text,
body.dark .ws-task-text,
:root.dark .ws-stage-headline h3,
[data-theme='dark'] .ws-stage-headline h3,
body.dark .ws-stage-headline h3,
:root.dark .ws-matrix-title,
[data-theme='dark'] .ws-matrix-title,
body.dark .ws-matrix-title,
:root.dark .ws-slot-title,
[data-theme='dark'] .ws-slot-title,
body.dark .ws-slot-title {
  color: #F8FAFC;
}
`;
