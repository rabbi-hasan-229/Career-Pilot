import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Sliders } from 'lucide-react';
import type { Milestone, Task, Profile, ActiveNavTab, TaskActionType } from '../types';

interface Props {
  milestones?: Milestone[];
  tasks?: Task[];
  profile?: Profile | null;
  onBack?: () => void;
  isDesktopEmbedded?: boolean;
  onNavigateToTab?: (tab: ActiveNavTab) => void;
  onApplyPlannerAction?: (action: 'behind' | 'early' | 'pause') => void;
  onOpenGoalSettings?: () => void;
}

type TimeHorizon = 'Sprint' | 'Monthly' | 'Full Horizon';

const ACTION_COLORS: Record<TaskActionType, { color: string; bg: string; label: string }> = {
  Build: { color: '#123C69', bg: 'rgba(18, 60, 105, 0.1)', label: 'Build' },
  Learn: { color: '#475569', bg: 'rgba(71, 85, 105, 0.1)', label: 'Learn' },
  Practice: { color: '#255A96', bg: 'rgba(37, 90, 150, 0.1)', label: 'Practice' },
  Checkpoint: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', label: 'Checkpoint' },
};

const DOMAIN_PALETTE = ['#123C69', '#255A96', '#334155', '#475569', '#64748B'];
const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}

function startOfLocalDay(value: Date): Date {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
}

export const OverviewAnalyticsView: React.FC<Props> = ({
  milestones = [],
  tasks = [],
  profile,
  onBack,
  isDesktopEmbedded = false,
  onNavigateToTab,
  onApplyPlannerAction,
  onOpenGoalSettings,
}) => {
  const [horizon, setHorizon] = useState<TimeHorizon>('Sprint');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // ── 1. Telemetry Calculations ───────────────────────────────────────────────
  const roleName = profile?.target_role || 'Career plan';
  const dailyMinutes = profile?.daily_minutes || 60;
  const streakDays = profile?.streak_days ?? 0;
  const targetTimelineMonths = profile?.target_timeline_months || 6;

  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.done_at != null), [tasks]);
  const completedCount = completedTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Execution Hours
  const totalPlannedMinutes = useMemo(() => {
    if (tasks.length > 0) {
      return tasks.reduce((sum, t) => sum + (t.est_minutes ?? 0), 0);
    }
    return milestones.reduce((sum, m) => sum + (m.effort_hours ?? 0) * 60, 0);
  }, [tasks, milestones]);

  const totalPlannedHours = Math.round(totalPlannedMinutes / 60);

  const completedMinutes = useMemo(() => {
    return completedTasks.reduce((sum, t) => sum + (t.est_minutes ?? 0), 0);
  }, [completedTasks]);

  const completedHours = Number((completedMinutes / 60).toFixed(1));

  // Weekly pacing numbers
  const weeklyTargetHours = Number(((dailyMinutes * 5) / 60).toFixed(1));
  const [now] = useState(() => new Date());
  const recentCompletedMinutes = useMemo(() => {
    const cutoff = now.getTime() - 28 * 24 * 60 * 60 * 1000;
    return completedTasks.reduce((sum, task) => {
      const completedAt = task.done_at ? Date.parse(task.done_at) : Number.NaN;
      return completedAt >= cutoff && completedAt <= now.getTime()
        ? sum + (task.est_minutes ?? 0)
        : sum;
    }, 0);
  }, [completedTasks, now]);
  const recentWeeklyHours = recentCompletedMinutes > 0
    ? Number((recentCompletedMinutes / 60 / 4).toFixed(1))
    : null;
  const velocityMultiplier = recentWeeklyHours === null || weeklyTargetHours <= 0
    ? null
    : Number((recentWeeklyHours / weeklyTargetHours).toFixed(2));

  const velocityStatus = useMemo(() => {
    if (velocityMultiplier === null) {
      return { label: 'Building baseline', color: 'var(--md-text-muted)', badge: 'Awaiting baseline' };
    }
    if (velocityMultiplier >= 1.1) {
      return { label: 'Ahead of target', color: 'var(--md-success)', badge: 'Ahead of pace' };
    }
    if (velocityMultiplier >= 0.85) {
      return { label: 'On track', color: 'var(--md-primary)', badge: 'On track' };
    }
    return { label: 'Below target', color: 'var(--md-warning)', badge: 'Behind pace' };
  }, [velocityMultiplier]);

  const targetDeadline = useMemo(() => {
    if (profile?.target_completion_date) {
      const configured = new Date(`${profile.target_completion_date}T00:00:00`);
      if (!Number.isNaN(configured.getTime())) return configured;
    }
    const start = profile?.created_at ? new Date(profile.created_at) : now;
    const fallback = new Date(start);
    fallback.setMonth(fallback.getMonth() + targetTimelineMonths);
    return fallback;
  }, [profile, now, targetTimelineMonths]);

  // Forecast is shown only after recent task completions establish a measured pace.
  const forecastedGraduation = useMemo(() => {
    if (totalTasks === 0) {
      return { dateString: 'No task plan yet', weeksRemaining: null, daysDelta: null };
    }
    const remainingHours = Math.max(0, totalPlannedHours - completedHours);
    if (remainingHours === 0) {
      const daysDelta = Math.round((targetDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        dateString: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        weeksRemaining: 0,
        daysDelta,
      };
    }
    if (recentWeeklyHours === null || recentWeeklyHours <= 0) {
      return { dateString: 'Not enough progress yet', weeksRemaining: null, daysDelta: null };
    }
    const weeksRemaining = Math.ceil(remainingHours / recentWeeklyHours);
    const forecastDate = new Date(now);
    forecastDate.setDate(forecastDate.getDate() + weeksRemaining * 7);

    return {
      dateString: forecastDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      weeksRemaining,
      daysDelta: Math.round((targetDeadline.getTime() - forecastDate.getTime()) / (24 * 60 * 60 * 1000)),
    };
  }, [totalTasks, totalPlannedHours, completedHours, recentWeeklyHours, targetDeadline, now]);

  const forecastDeltaLabel = forecastedGraduation.daysDelta === null
    ? 'Complete tasks to establish a finish-date estimate.'
    : forecastedGraduation.daysDelta >= 0
      ? `${forecastedGraduation.daysDelta} days ahead of your target date.`
      : `${Math.abs(forecastedGraduation.daysDelta)} days after target at recent pace.`;

  // ── 2. Action Type Breakdown (Build vs Learn vs Practice vs Checkpoint) ─────
  const actionTypeBreakdown = useMemo(() => {
    const counts: Record<TaskActionType, { count: number; minutes: number }> = {
      Build: { count: 0, minutes: 0 },
      Learn: { count: 0, minutes: 0 },
      Practice: { count: 0, minutes: 0 },
      Checkpoint: { count: 0, minutes: 0 },
    };

    tasks.forEach((t) => {
      const type: TaskActionType = t.type || 'Learn';
      if (counts[type]) {
        counts[type].count += 1;
        counts[type].minutes += t.est_minutes ?? 0;
      }
    });

    const totalMin = Math.max(1, Object.values(counts).reduce((s, c) => s + c.minutes, 0));

    return (Object.keys(counts) as TaskActionType[]).map((type) => {
      const item = counts[type];
      const pct = Math.round((item.minutes / totalMin) * 100);
      const hours = (item.minutes / 60).toFixed(1);
      return {
        type,
        count: item.count,
        hours,
        pct,
        ...ACTION_COLORS[type],
      };
    });
  }, [tasks]);
  const buildEffortPct = actionTypeBreakdown.find((item) => item.type === 'Build')?.pct ?? 0;

  // ── 3. Domain Competencies Breakdown (Skill Clusters) ──────────────────────
  const domainSkills = useMemo(() => {
    const map = new Map<string, { total: number; done: number; taskCount: number }>();

    tasks.forEach((t) => {
      const subject = t.subject || 'Core Architecture';
      const existing = map.get(subject) || { total: 0, done: 0, taskCount: 0 };
      const mins = t.est_minutes ?? 0;
      existing.total += mins;
      if (t.done_at != null) {
        existing.done += mins;
      }
      existing.taskCount += 1;
      map.set(subject, existing);
    });

    return Array.from(map.entries())
      .map(([name, data], idx) => {
        const totalHours = Number((data.total / 60).toFixed(1));
        const doneHours = Number((data.done / 60).toFixed(1));
        const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
        return {
          name,
          totalHours,
          doneHours,
          pct,
          taskCount: data.taskCount,
          color: DOMAIN_PALETTE[idx % DOMAIN_PALETTE.length],
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);
  }, [tasks]);

  // ── 4. Burn-Up Chart Geometry & Trajectory Simulation ───────────────────────
  const chartPoints = useMemo(() => {
    const today = startOfLocalDay(now);
    let rangeStart: Date;
    let rangeEnd: Date;
    if (horizon === 'Sprint') {
      rangeStart = new Date(today.getTime() - 6 * DAY_MS);
      rangeEnd = today;
    } else if (horizon === 'Monthly') {
      rangeStart = new Date(today.getTime() - 42 * DAY_MS);
      rangeEnd = today;
    } else {
      const planStarts = [
        ...milestones.map((milestone) => parseLocalDate(milestone.start_date)),
        ...tasks.map((task) => parseLocalDate(task.due_date)),
      ].filter((date) => !Number.isNaN(date.getTime()));
      const planEnds = [
        ...milestones.map((milestone) => parseLocalDate(milestone.end_date)),
        ...tasks.map((task) => parseLocalDate(task.due_date)),
        targetDeadline,
      ].filter((date) => !Number.isNaN(date.getTime()));
      rangeStart = planStarts.length ? startOfLocalDay(new Date(Math.min(...planStarts.map((date) => date.getTime())))) : today;
      rangeEnd = planEnds.length ? startOfLocalDay(new Date(Math.max(...planEnds.map((date) => date.getTime())))) : today;
      if (rangeEnd.getTime() <= rangeStart.getTime()) rangeEnd = new Date(rangeStart.getTime() + 6 * DAY_MS);
    }

    const todayEnd = new Date(today.getTime() + DAY_MS - 1);
    const span = Math.max(DAY_MS, rangeEnd.getTime() - rangeStart.getTime());
    return Array.from({ length: 7 }, (_, index) => {
      const pointDate = new Date(rangeStart.getTime() + (span * index) / 6);
      const boundary = new Date(pointDate);
      boundary.setHours(23, 59, 59, 999);
      const scheduledMinutes = tasks.reduce((sum, task) => {
        const dueDate = parseLocalDate(task.due_date);
        return dueDate <= boundary ? sum + (task.est_minutes ?? 0) : sum;
      }, 0);
      const completedByDate = completedTasks.reduce((sum, task) => {
        const completedAt = task.done_at ? Date.parse(task.done_at) : Number.NaN;
        return completedAt <= boundary.getTime() ? sum + (task.est_minutes ?? 0) : sum;
      }, 0);
      const actual = pointDate.getTime() <= todayEnd.getTime()
        ? Number((completedByDate / 60).toFixed(1))
        : null;
      const daysAhead = Math.max(0, (boundary.getTime() - todayEnd.getTime()) / DAY_MS);
      const projected = Number((completedHours + (recentWeeklyHours ?? 0) * (daysAhead / 7)).toFixed(1));
      const label = horizon === 'Sprint'
        ? pointDate.toLocaleDateString(undefined, { weekday: 'short' })
        : pointDate.toLocaleDateString(undefined, horizon === 'Monthly' ? { month: 'short', day: 'numeric' } : { month: 'short', year: '2-digit' });
      return {
        label,
        planned: Number((scheduledMinutes / 60).toFixed(1)),
        actual,
        projected,
      };
    });
  }, [horizon, now, milestones, tasks, completedTasks, completedHours, recentWeeklyHours, targetDeadline]);

  // SVG Chart Dimensions
  const chartW = 580;
  const chartH = 200;
  const padL = 40;
  const padR = 25;
  const padT = 22;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxChartVal = useMemo(() => {
    const vals = chartPoints.flatMap((p) => [p.planned, p.actual || 0, p.projected]);
    return Math.max(35, Math.ceil(Math.max(...vals) / 10) * 10);
  }, [chartPoints]);

  const getX = useCallback((index: number) => padL + (index / (chartPoints.length - 1)) * plotW, [chartPoints.length, plotW]);
  const getY = useCallback((val: number) => padT + plotH - (val / maxChartVal) * plotH, [maxChartVal, plotH]);

  const plannedPathD = useMemo(() => {
    return chartPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.planned).toFixed(1)}`)
      .join(' ');
  }, [chartPoints, getX, getY]);

  const actualPoints = chartPoints.filter((p) => p.actual !== null);
  const actualPathD = useMemo(() => {
    return actualPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.actual!).toFixed(1)}`)
      .join(' ');
  }, [actualPoints, getX, getY]);

  const actualAreaD = useMemo(() => {
    if (actualPoints.length === 0) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(actualPoints.length - 1).toFixed(1);
    const baselineY = (padT + plotH).toFixed(1);
    return `${actualPathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [actualPoints, actualPathD, getX, plotH, padT]);

  const projectedPathD = useMemo(() => {
    if (recentWeeklyHours === null) return '';
    const firstFuturePoint = chartPoints.findIndex((point) => point.actual === null);
    if (firstFuturePoint < 0) return '';
    const startIndex = Math.max(0, firstFuturePoint - 1);
    const subPoints = chartPoints.slice(startIndex);
    return subPoints
      .map((p, idx) => {
        const globalIdx = startIndex + idx;
        return `${idx === 0 ? 'M' : 'L'} ${getX(globalIdx).toFixed(1)} ${getY(p.projected).toFixed(1)}`;
      })
      .join(' ');
  }, [chartPoints, getX, getY, recentWeeklyHours]);

  // ── 5. 7-Day Sprint Effort ──────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const today = startOfLocalDay(now);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getTime() - (6 - index) * DAY_MS);
      const dayEnd = date.getTime() + DAY_MS;
      const minutesLogged = completedTasks.reduce((sum, task) => {
        const completedAt = task.done_at ? Date.parse(task.done_at) : Number.NaN;
        return completedAt >= date.getTime() && completedAt < dayEnd
          ? sum + (task.est_minutes ?? 0)
          : sum;
      }, 0);
      return {
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutesLogged,
        isTargetMet: minutesLogged >= dailyMinutes,
        isToday: date.getTime() === today.getTime(),
      };
    });
  }, [dailyMinutes, completedTasks, now]);

  const totalWeekMinutes = useMemo(
    () => Math.round(weekDays.reduce((sum, day) => sum + day.minutesLogged, 0)),
    [weekDays]
  );
  const maxWeekMinutes = useMemo(
    () => Math.max(dailyMinutes, ...weekDays.map((day) => day.minutesLogged), 1),
    [weekDays, dailyMinutes]
  );

  const weeklyPaceFillPct = useMemo(() => {
    if (recentWeeklyHours === null || weeklyTargetHours <= 0) return 0;
    return Math.min(100, Math.round((recentWeeklyHours / weeklyTargetHours) * 100));
  }, [recentWeeklyHours, weeklyTargetHours]);

  const targetDateFormatted = targetDeadline.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePlanAdjust = (action: 'behind' | 'early' | 'pause', label: string) => {
    if (!onApplyPlannerAction) return;
    onApplyPlannerAction(action);
    setActionNotice(label);
    window.setTimeout(() => {
      setActionNotice((prev) => (prev === label ? null : prev));
    }, 2400);
  };

  const hoveredPoint = hoveredPointIndex !== null ? chartPoints[hoveredPointIndex] : null;

  return (
    <div className="ps-root">
      {/* 1. Header Command Strip */}
      <header className="ps-header">
        <div className="ps-header-left">
          <div className="ps-eyebrow-row">
            {onBack && !isDesktopEmbedded && (
              <button
                type="button"
                onClick={onBack}
                className="ps-back-btn"
                aria-label="Back to Roadmap"
              >
                <ArrowLeft size={13} />
                <span>Roadmap</span>
              </button>
            )}
            <span className="ps-eyebrow">TELEMETRY · {roleName}</span>
            <span className="ps-status-pill">
              <span className="ps-status-dot" style={{ backgroundColor: velocityStatus.color }} />
              {velocityStatus.badge}
            </span>
          </div>
          <h1 className="ps-title">Analytics & Velocity</h1>
        </div>

        <div className="ps-header-controls">
          {actionNotice && (
            <span className="ps-action-toast" role="status">
              {actionNotice}
            </span>
          )}
          {onOpenGoalSettings && (
            <button
              type="button"
              className="ps-btn-secondary"
              onClick={onOpenGoalSettings}
              title="Configure daily pace and target completion date"
            >
              <Sliders size={13} />
              <span>{dailyMinutes}m Pace</span>
            </button>
          )}
          {onApplyPlannerAction && (
            <div className="ps-segmented-actions" role="group" aria-label="Schedule shifts">
              <button
                type="button"
                className="ps-seg-btn"
                onClick={() => handlePlanAdjust('behind', 'Shifted plan +3d')}
                title="Add 3 days of buffer to upcoming tasks"
              >
                +3d
              </button>
              <button
                type="button"
                className="ps-seg-btn"
                onClick={() => handlePlanAdjust('early', 'Advanced plan')}
                title="Bring upcoming stage closer"
              >
                Advance
              </button>
              <button
                type="button"
                className="ps-seg-btn"
                onClick={() => handlePlanAdjust('pause', 'Paused schedule +7d')}
                title="Shift upcoming tasks by 7 days while keeping your streak"
              >
                Pause
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. 4-Cell Hairline-Divided KPI Strip */}
      <section className="ps-kpi-strip" aria-label="Key telemetry metrics">
        <div className="ps-kpi-cell">
          <div className="ps-kpi-top">
            <span className="ps-kpi-label">Hours Completed</span>
            <span className="ps-kpi-pill">{progressPct}%</span>
          </div>
          <div className="ps-kpi-value-row">
            <span className="ps-kpi-num">{completedHours}h</span>
            <span className="ps-kpi-denom">/ {totalPlannedHours}h</span>
          </div>
          <div className="ps-kpi-bar">
            <div className="ps-kpi-bar-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
        </div>

        <div className="ps-kpi-cell">
          <div className="ps-kpi-top">
            <span className="ps-kpi-label">Weekly Velocity</span>
            <span className="ps-kpi-sub-badge" style={{ color: velocityStatus.color }}>
              {velocityStatus.label}
            </span>
          </div>
          <div className="ps-kpi-value-row">
            <span className="ps-kpi-num">
              {velocityMultiplier === null ? '—' : `${velocityMultiplier}x`}
            </span>
            <span className="ps-kpi-denom">
              {recentWeeklyHours === null ? `target ${weeklyTargetHours}h/wk` : `${recentWeeklyHours}h vs ${weeklyTargetHours}h`}
            </span>
          </div>
          <div className="ps-kpi-bar">
            <div className="ps-kpi-bar-fill" style={{ width: `${weeklyPaceFillPct}%` }} />
          </div>
        </div>

        <div className="ps-kpi-cell">
          <div className="ps-kpi-top">
            <span className="ps-kpi-label">Tasks Done</span>
            <span className="ps-kpi-denom">
              {totalTasks > 0 ? `${Math.max(0, totalTasks - completedCount)} left` : 'Empty'}
            </span>
          </div>
          <div className="ps-kpi-value-row">
            <span className="ps-kpi-num">{completedCount}</span>
            <span className="ps-kpi-denom">/ {totalTasks}</span>
          </div>
          <div className="ps-kpi-bar">
            <div
              className="ps-kpi-bar-fill"
              style={{ width: `${totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="ps-kpi-cell">
          <div className="ps-kpi-top">
            <span className="ps-kpi-label">Active Streak</span>
            <span className="ps-kpi-denom">{streakDays > 0 ? 'Active' : 'Idle'}</span>
          </div>
          <div className="ps-kpi-value-row">
            <span className="ps-kpi-num">{streakDays}</span>
            <span className="ps-kpi-denom">{streakDays === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="ps-kpi-bar">
            <div
              className="ps-kpi-bar-fill"
              style={{ width: `${Math.min(100, streakDays * 14)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 3. Main Telemetry Grid */}
      <div className="ps-main-grid">
        {/* Left: Burn-up Execution Trajectory */}
        <section className="ps-card ps-chart-card">
          <div className="ps-card-header">
            <div>
              <h2 className="ps-card-title">Execution Trajectory</h2>
              <p className="ps-card-sub">Cumulative completed hours vs. scheduled baseline</p>
            </div>
            <div className="ps-horizon-tabs" role="tablist" aria-label="Chart time horizon">
              {(['Sprint', 'Monthly', 'Full Horizon'] as TimeHorizon[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={horizon === tab}
                  className={`ps-horizon-btn ${horizon === tab ? 'is-active' : ''}`}
                  onClick={() => setHorizon(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="ps-chart-wrap">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="ps-burnup-svg"
              aria-label="Execution burn-up chart"
            >
              <defs>
                <linearGradient id="psActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#123C69" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#123C69" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const yVal = padT + plotH * (1 - pct);
                const hourVal = Math.round(maxChartVal * pct);
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={yVal}
                      x2={padL + plotW}
                      y2={yVal}
                      className="ps-grid-line"
                    />
                    <text x={padL - 8} y={yVal + 3.5} className="ps-y-label">
                      {hourVal}h
                    </text>
                  </g>
                );
              })}

              {hoveredPointIndex !== null && (
                <line
                  x1={getX(hoveredPointIndex)}
                  y1={padT}
                  x2={getX(hoveredPointIndex)}
                  y2={padT + plotH}
                  className="ps-crosshair"
                />
              )}

              <path d={plannedPathD} className="ps-line-planned" fill="none" />
              {actualAreaD && <path d={actualAreaD} fill="url(#psActualGrad)" />}
              {actualPathD && <path d={actualPathD} className="ps-line-actual" fill="none" />}
              {projectedPathD && <path d={projectedPathD} className="ps-line-projected" fill="none" />}

              {chartPoints.map((p, idx) => {
                const cx = getX(idx);
                const cy = p.actual !== null ? getY(p.actual) : getY(p.projected);
                const isActual = p.actual !== null;
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={cx - plotW / 14}
                      y={padT}
                      width={plotW / 7}
                      height={plotH + 22}
                      fill="transparent"
                    />
                    {(isActual || recentWeeklyHours !== null) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : 3.2}
                        className={isActual ? 'ps-dot-actual' : 'ps-dot-projected'}
                      />
                    )}
                    <text x={cx} y={chartH - 10} className="ps-x-label">
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoveredPoint && hoveredPointIndex !== null && (
              <div
                className="ps-tooltip"
                style={{
                  left: `${Math.min(78, Math.max(12, (getX(hoveredPointIndex) / chartW) * 100))}%`,
                }}
              >
                <div className="ps-tooltip-date">{hoveredPoint.label}</div>
                <div className="ps-tooltip-row">
                  <span>Scheduled</span>
                  <strong>{hoveredPoint.planned}h</strong>
                </div>
                {hoveredPoint.actual !== null && (
                  <div className="ps-tooltip-row">
                    <span>Completed</span>
                    <strong>{hoveredPoint.actual}h</strong>
                  </div>
                )}
                {hoveredPoint.actual === null && recentWeeklyHours !== null && (
                  <div className="ps-tooltip-row">
                    <span>Forecast</span>
                    <strong>{hoveredPoint.projected}h</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ps-chart-legend">
            <span className="ps-legend-item">
              <span className="ps-swatch ps-swatch-actual" />
              Completed ({completedHours}h)
            </span>
            <span className="ps-legend-item">
              <span className="ps-swatch ps-swatch-planned" />
              Scheduled Plan
            </span>
            <span className="ps-legend-item">
              <span className="ps-swatch ps-swatch-projected" />
              {recentWeeklyHours === null ? 'Forecast pending' : 'Projected'}
            </span>
          </div>
        </section>

        {/* Right: Finish Projection */}
        <section className="ps-card ps-forecast-card">
          <div className="ps-card-header">
            <div>
              <h2 className="ps-card-title">Finish Projection</h2>
              <p className="ps-card-sub">Target deadline · {targetDateFormatted}</p>
            </div>
            {forecastedGraduation.weeksRemaining !== null && (
              <span className="ps-weeks-pill">~{forecastedGraduation.weeksRemaining}w left</span>
            )}
          </div>

          <div className="ps-forecast-readout">
            <span className="ps-readout-eyebrow">ESTIMATED FINISH</span>
            <div className="ps-readout-date">{forecastedGraduation.dateString}</div>
            <p className="ps-readout-note">{forecastDeltaLabel}</p>
          </div>

          <div className="ps-pace-meter">
            <div className="ps-pace-meter-head">
              <span>Weekly Output</span>
              <strong>
                {recentWeeklyHours === null ? '0h' : `${recentWeeklyHours}h`} / {weeklyTargetHours}h target
              </strong>
            </div>
            <div className="ps-progress-track">
              <div className="ps-progress-fill" style={{ width: `${weeklyPaceFillPct}%` }} />
            </div>
            <div className="ps-pace-foot">
              <span>28-day rolling baseline</span>
              <span>{weeklyPaceFillPct}% of target</span>
            </div>
          </div>

          <div className="ps-quick-links">
            {onNavigateToTab && (
              <>
                <button
                  type="button"
                  className="ps-link-row"
                  onClick={() => onNavigateToTab('plan')}
                >
                  <span>Open Weekly Agenda</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="ps-link-row"
                  onClick={() => onNavigateToTab('home')}
                >
                  <span>Return to Career Roadmap</span>
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {/* 4. 3-Column Breakdown Row */}
      <div className="ps-breakdown-grid">
        {/* A. 7-Day Effort */}
        <section className="ps-card ps-mini-card">
          <div className="ps-card-header">
            <div>
              <h2 className="ps-card-title">7-Day Effort</h2>
              <p className="ps-card-sub">{dailyMinutes}m daily commitment</p>
            </div>
            <span className="ps-metric-badge">{totalWeekMinutes}m logged</span>
          </div>

          <div className="ps-bars-row" aria-label="Last 7 days study time">
            {weekDays.map((day, idx) => {
              const heightPct = day.minutesLogged > 0
                ? Math.max(12, Math.round((day.minutesLogged / maxWeekMinutes) * 100))
                : 6;
              return (
                <div
                  key={idx}
                  className="ps-day-col"
                  title={`${day.dateLabel}: ${day.minutesLogged}m`}
                >
                  <div className="ps-day-val">
                    {day.minutesLogged > 0 ? `${day.minutesLogged}m` : ''}
                  </div>
                  <div className="ps-day-track">
                    <div
                      className={`ps-day-fill ${day.isTargetMet ? 'is-met' : day.minutesLogged > 0 ? 'is-partial' : ''}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`ps-day-lbl ${day.isToday ? 'is-today' : ''}`}>{day.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* B. Skill Domains */}
        <section className="ps-card ps-mini-card">
          <div className="ps-card-header">
            <div>
              <h2 className="ps-card-title">Skill Domains</h2>
              <p className="ps-card-sub">Progress across top clusters</p>
            </div>
            <span className="ps-metric-badge">{domainSkills.length} active</span>
          </div>

          {domainSkills.length === 0 ? (
            <div className="ps-empty-inline">
              Generate or open a roadmap to view domain breakdown.
            </div>
          ) : (
            <div className="ps-domain-list">
              {domainSkills.map((domain) => (
                <div key={domain.name} className="ps-domain-item">
                  <div className="ps-domain-head">
                    <span className="ps-domain-name">{domain.name}</span>
                    <span className="ps-domain-stats">
                      {domain.doneHours}/{domain.totalHours}h · <strong>{domain.pct}%</strong>
                    </span>
                  </div>
                  <div className="ps-domain-track">
                    <div
                      className="ps-domain-fill"
                      style={{ width: `${domain.pct}%`, backgroundColor: domain.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* C. Task Mix */}
        <section className="ps-card ps-mini-card">
          <div className="ps-card-header">
            <div>
              <h2 className="ps-card-title">Task Mix</h2>
              <p className="ps-card-sub">Effort split by study mode</p>
            </div>
            <span className="ps-metric-badge">{totalTasks} tasks</span>
          </div>

          <div className="ps-mix-bar" aria-label="Task effort distribution">
            {actionTypeBreakdown.map((item) =>
              item.pct > 0 ? (
                <div
                  key={item.type}
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  title={`${item.label}: ${item.hours}h (${item.pct}%)`}
                />
              ) : null
            )}
          </div>

          <div className="ps-mix-grid">
            {actionTypeBreakdown.map((item) => (
              <div key={item.type} className="ps-mix-item">
                <div className="ps-mix-left">
                  <span className="ps-mix-dot" style={{ backgroundColor: item.color }} />
                  <span className="ps-mix-name">{item.label}</span>
                </div>
                <span className="ps-mix-val">
                  {item.hours}h ({item.pct}%)
                </span>
              </div>
            ))}
          </div>

          <p className="ps-mix-foot">
            <strong>{buildEffortPct}%</strong> hands-on Build ratio · <strong>Pause</strong> shifts dates while preserving your {streakDays}d streak.
          </p>
        </section>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
};

const analyticsStyles = `
.ps-root {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 6px 0 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-variant-numeric: tabular-nums;
}

/* Header */
.ps-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--md-outline-variant, #E2E8F0);
}

.ps-header-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ps-eyebrow-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ps-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  background: var(--md-surface, #FFFFFF);
  color: var(--md-text-secondary, #475569);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.ps-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-primary, #123C69);
}

.ps-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  background: var(--md-surface-subtle, #F8FAFC);
  color: var(--md-text-secondary, #475569);
  font-size: 0.69rem;
  font-weight: 600;
}

.ps-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.ps-title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--md-text-primary, #0F172A);
}

.ps-header-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ps-action-toast {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--md-primary, #123C69);
  background: var(--md-primary-container, rgba(18, 60, 105, 0.09));
  padding: 5px 10px;
  border-radius: 7px;
}

.ps-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant, #CBD5E1);
  background: var(--md-surface, #FFFFFF);
  color: var(--md-text-primary, #0F172A);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.ps-btn-secondary:hover {
  border-color: var(--md-primary, #123C69);
  background: var(--md-surface-subtle, #F8FAFC);
}

.ps-segmented-actions {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--md-outline-variant, #CBD5E1);
  border-radius: 8px;
  background: var(--md-surface, #FFFFFF);
  overflow: hidden;
}

.ps-seg-btn {
  height: 30px;
  padding: 0 10px;
  border: none;
  border-right: 1px solid var(--md-outline-variant, #E2E8F0);
  background: transparent;
  color: var(--md-text-secondary, #475569);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.ps-seg-btn:last-child {
  border-right: none;
}

.ps-seg-btn:hover {
  background: var(--md-surface-subtle, #F8FAFC);
  color: var(--md-primary, #123C69);
}

/* 4-Cell KPI Strip */
.ps-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  border-radius: 12px;
  background: var(--md-surface, #FFFFFF);
  overflow: hidden;
}

.ps-kpi-cell {
  padding: 15px 18px;
  border-right: 1px solid var(--md-outline-variant, #E2E8F0);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ps-kpi-cell:last-child {
  border-right: none;
}

.ps-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ps-kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
}

.ps-kpi-pill {
  font-size: 0.69rem;
  font-weight: 700;
  color: var(--md-primary, #123C69);
  background: var(--md-primary-container, rgba(18, 60, 105, 0.08));
  padding: 1px 7px;
  border-radius: 9999px;
}

.ps-kpi-sub-badge {
  font-size: 0.69rem;
  font-weight: 600;
}

.ps-kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
}

.ps-kpi-num {
  font-size: 1.42rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--md-text-primary, #0F172A);
  line-height: 1.1;
}

.ps-kpi-denom {
  font-size: 0.74rem;
  font-weight: 500;
  color: var(--md-text-muted, #64748B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ps-kpi-bar {
  height: 3px;
  border-radius: 9999px;
  background: var(--md-surface-muted, #F1F5F9);
  overflow: hidden;
}

.ps-kpi-bar-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--md-primary, #123C69);
  transition: width 0.25s ease;
}

@media (max-width: 860px) {
  .ps-kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ps-kpi-cell:nth-child(2n) {
    border-right: none;
  }
  .ps-kpi-cell:nth-child(1),
  .ps-kpi-cell:nth-child(2) {
    border-bottom: 1px solid var(--md-outline-variant, #E2E8F0);
  }
}

/* Main Telemetry Grid */
.ps-main-grid {
  display: grid;
  grid-template-columns: 1.45fr 0.95fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .ps-main-grid {
    grid-template-columns: 1fr;
  }
}

.ps-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ps-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ps-card-title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.01em;
}

.ps-card-sub {
  margin: 2px 0 0;
  font-size: 0.74rem;
  color: var(--md-text-secondary, #64748B);
}

.ps-horizon-tabs {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  background: var(--md-surface-subtle, #F8FAFC);
}

.ps-horizon-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
}

.ps-horizon-btn.is-active {
  background: var(--md-surface, #FFFFFF);
  color: var(--md-primary, #123C69);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

/* Burn-Up Chart */
.ps-chart-wrap {
  position: relative;
  width: 100%;
}

.ps-burnup-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.ps-grid-line {
  stroke: var(--md-outline-variant, #E2E8F0);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.ps-crosshair {
  stroke: var(--md-outline, #CBD5E1);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.ps-y-label,
.ps-x-label {
  font-size: 10px;
  font-weight: 500;
  fill: var(--md-text-muted, #64748B);
}

.ps-y-label {
  text-anchor: end;
}

.ps-x-label {
  text-anchor: middle;
}

.ps-line-planned {
  stroke: var(--md-text-muted, #94A3B8);
  stroke-width: 1.75;
  stroke-dasharray: 4 4;
}

.ps-line-actual {
  stroke: var(--md-primary, #123C69);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ps-line-projected {
  stroke: var(--md-success, #15803D);
  stroke-width: 2;
  stroke-dasharray: 4 4;
}

.ps-dot-actual {
  fill: var(--md-surface, #FFFFFF);
  stroke: var(--md-primary, #123C69);
  stroke-width: 2.2;
}

.ps-dot-projected {
  fill: var(--md-surface, #FFFFFF);
  stroke: var(--md-success, #15803D);
  stroke-width: 2;
}

.ps-tooltip {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  min-width: 132px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant, #CBD5E1);
  background: var(--md-surface, #FFFFFF);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  pointer-events: none;
  z-index: 4;
}

.ps-tooltip-date {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--md-text-primary, #0F172A);
  margin-bottom: 4px;
}

.ps-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.7rem;
  color: var(--md-text-secondary, #64748B);
}

.ps-tooltip-row strong {
  color: var(--md-text-primary, #0F172A);
}

.ps-chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 6px;
  border-top: 1px solid var(--md-outline-variant, #F1F5F9);
}

.ps-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--md-text-secondary, #64748B);
}

.ps-swatch {
  width: 14px;
  height: 2px;
  border-radius: 2px;
}

.ps-swatch-actual {
  background: var(--md-primary, #123C69);
}

.ps-swatch-planned {
  border-top: 2px dashed var(--md-text-muted, #94A3B8);
}

.ps-swatch-projected {
  border-top: 2px dashed var(--md-success, #15803D);
}

/* Finish Projection Card */
.ps-weeks-pill,
.ps-metric-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--md-text-secondary, #475569);
  background: var(--md-surface-subtle, #F8FAFC);
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  padding: 2px 8px;
  border-radius: 9999px;
}

.ps-forecast-readout {
  padding: 14px;
  border-radius: 10px;
  background: var(--md-surface-subtle, #F8FAFC);
  border: 1px solid var(--md-outline-variant, #E2E8F0);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ps-readout-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--md-text-muted, #64748B);
}

.ps-readout-date {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.01em;
}

.ps-readout-note {
  margin: 0;
  font-size: 0.74rem;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.4;
}

.ps-pace-meter {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-pace-meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.74rem;
  color: var(--md-text-secondary, #64748B);
}

.ps-pace-meter-head strong {
  color: var(--md-text-primary, #0F172A);
  font-weight: 600;
}

.ps-progress-track {
  height: 7px;
  border-radius: 9999px;
  background: var(--md-surface-muted, #F1F5F9);
  overflow: hidden;
}

.ps-progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--md-primary, #123C69);
  transition: width 0.25s ease;
}

.ps-pace-foot {
  display: flex;
  justify-content: space-between;
  font-size: 0.69rem;
  color: var(--md-text-muted, #64748B);
}

.ps-quick-links {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--md-outline-variant, #E2E8F0);
  padding-top: 8px;
}

.ps-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 4px;
  border: none;
  border-bottom: 1px solid var(--md-outline-variant, #F1F5F9);
  background: transparent;
  color: var(--md-text-primary, #0F172A);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.14s ease;
}

.ps-link-row:last-child {
  border-bottom: none;
}

.ps-link-row:hover {
  color: var(--md-primary, #123C69);
}

/* 3-Column Breakdown Row */
.ps-breakdown-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .ps-breakdown-grid {
    grid-template-columns: 1fr;
  }
}

.ps-mini-card {
  gap: 14px;
}

/* 7-Day Effort Bars */
.ps-bars-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  align-items: end;
  height: 126px;
  padding-top: 8px;
}

.ps-day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  height: 100%;
}

.ps-day-val {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--md-text-muted, #64748B);
  height: 14px;
}

.ps-day-track {
  flex: 1;
  width: 100%;
  max-width: 24px;
  border-radius: 6px;
  background: var(--md-surface-subtle, #F8FAFC);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border: 1px solid var(--md-outline-variant, #E2E8F0);
}

.ps-day-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: var(--md-outline, #CBD5E1);
  transition: height 0.25s ease;
}

.ps-day-fill.is-partial {
  background: rgba(18, 60, 105, 0.45);
}

.ps-day-fill.is-met {
  background: var(--md-primary, #123C69);
}

.ps-day-lbl {
  font-size: 0.69rem;
  font-weight: 500;
  color: var(--md-text-muted, #64748B);
}

.ps-day-lbl.is-today {
  color: var(--md-primary, #123C69);
  font-weight: 700;
}

/* Skill Domains */
.ps-domain-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ps-domain-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ps-domain-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.74rem;
}

.ps-domain-name {
  font-weight: 600;
  color: var(--md-text-primary, #0F172A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ps-domain-stats {
  color: var(--md-text-muted, #64748B);
  font-size: 0.7rem;
  flex-shrink: 0;
}

.ps-domain-stats strong {
  color: var(--md-text-primary, #0F172A);
}

.ps-domain-track {
  height: 5px;
  border-radius: 9999px;
  background: var(--md-surface-muted, #F1F5F9);
  overflow: hidden;
}

.ps-domain-fill {
  height: 100%;
  border-radius: 9999px;
}

.ps-empty-inline {
  padding: 20px 12px;
  text-align: center;
  font-size: 0.75rem;
  color: var(--md-text-muted, #64748B);
  border: 1px dashed var(--md-outline-variant, #CBD5E1);
  border-radius: 8px;
}

/* Task Mix */
.ps-mix-bar {
  display: flex;
  height: 7px;
  border-radius: 9999px;
  overflow: hidden;
  background: var(--md-surface-muted, #F1F5F9);
  gap: 1px;
}

.ps-mix-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.ps-mix-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.72rem;
}

.ps-mix-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ps-mix-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ps-mix-name {
  font-weight: 600;
  color: var(--md-text-primary, #0F172A);
}

.ps-mix-val {
  font-size: 0.69rem;
  color: var(--md-text-muted, #64748B);
}

.ps-mix-foot {
  margin: auto 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--md-outline-variant, #F1F5F9);
  font-size: 0.71rem;
  line-height: 1.45;
  color: var(--md-text-secondary, #64748B);
}

.ps-mix-foot strong {
  color: var(--md-text-primary, #0F172A);
}
`;
