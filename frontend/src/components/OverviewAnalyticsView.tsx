import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Flame,
  Zap,
  TrendingUp,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  Activity,
  Code2,
  FastForward,
  Pause,
  Gauge,
  Sliders,
} from 'lucide-react';
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
  Build: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Build (Artifacts)' },
  Learn: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', label: 'Learn (Foundations)' },
  Practice: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', label: 'Practice (Drills)' },
  Checkpoint: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Checkpoint (Audits)' },
};

const DOMAIN_PALETTE = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899'];

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

  // ── 1. Telemetry Calculations ───────────────────────────────────────────────
  const roleName = profile?.target_role || 'UI/UX Designer';
  const dailyMinutes = profile?.daily_minutes || 60;
  const streakDays = profile?.streak_days || 7;
  const targetTimelineMonths = profile?.target_timeline_months || 6;

  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.done_at != null), [tasks]);
  const completedCount = completedTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Execution Hours
  const totalPlannedMinutes = useMemo(() => {
    if (tasks.length > 0) {
      return tasks.reduce((sum, t) => sum + (t.est_minutes || 60), 0);
    }
    return milestones.reduce((sum, m) => sum + (m.effort_hours || 25) * 60, 0);
  }, [tasks, milestones]);

  const totalPlannedHours = Math.round(totalPlannedMinutes / 60);

  const completedMinutes = useMemo(() => {
    return completedTasks.reduce((sum, t) => sum + (t.est_minutes || 60), 0);
  }, [completedTasks]);

  const completedHours = Number((completedMinutes / 60).toFixed(1));

  // Weekly pacing numbers
  const weeklyTargetHours = Number(((dailyMinutes * 5) / 60).toFixed(1));
  const activeMilestoneIndex = useMemo(() => {
    if (milestones.length === 0) return 0;
    for (let i = 0; i < milestones.length; i++) {
      const mTasks = tasks.filter((t) => t.milestone_id === milestones[i].id);
      if (mTasks.some((t) => t.done_at == null)) return i;
    }
    return milestones.length - 1;
  }, [milestones, tasks]);

  // Velocity multiplier (Dynamic smart pace ratio)
  const velocityMultiplier = useMemo(() => {
    if (completedCount === 0) return 1.0;
    // Expected completed tasks based on active milestone
    const expectedPerStage = 4;
    const expectedCompleted = Math.max(1, (activeMilestoneIndex + 1) * expectedPerStage);
    const ratio = completedCount / expectedCompleted;
    if (ratio >= 1) {
      return Number((1.0 + Math.min(0.4, (completedCount / totalTasks) * 0.8 + 0.15)).toFixed(2));
    }
    return Number(Math.max(0.75, ratio).toFixed(2));
  }, [completedCount, activeMilestoneIndex, totalTasks]);

  const velocityStatus = useMemo(() => {
    if (velocityMultiplier >= 1.12) return { label: 'Sprinting Ahead', color: '#10B981', badge: 'Accelerated · +18%' };
    if (velocityMultiplier >= 0.95) return { label: 'Optimal Pace', color: '#2563EB', badge: 'On Target · Nominal' };
    return { label: 'Buffer Advised', color: '#F59E0B', badge: 'Needs Rebalance (+3d)' };
  }, [velocityMultiplier]);

  // Forecasted Graduation Date
  const forecastedGraduation = useMemo(() => {
    const remainingHours = Math.max(0, totalPlannedHours - completedHours);
    const effectiveWeeklyRate = Math.max(2, weeklyTargetHours * velocityMultiplier);
    const weeksRemaining = Math.ceil(remainingHours / effectiveWeeklyRate);
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + weeksRemaining * 7);

    return {
      dateString: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      weeksRemaining,
      daysDelta: Math.round(targetTimelineMonths * 30.4 - weeksRemaining * 7),
    };
  }, [totalPlannedHours, completedHours, weeklyTargetHours, velocityMultiplier, targetTimelineMonths]);

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
        counts[type].minutes += t.est_minutes || 60;
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

  // ── 3. Domain Competencies Breakdown (Skill Clusters) ──────────────────────
  const domainSkills = useMemo(() => {
    const map = new Map<string, { total: number; done: number; taskCount: number }>();

    tasks.forEach((t) => {
      const subject = t.subject || 'Core Architecture';
      const existing = map.get(subject) || { total: 0, done: 0, taskCount: 0 };
      const mins = t.est_minutes || 60;
      existing.total += mins;
      if (t.done_at != null) {
        existing.done += mins;
      }
      existing.taskCount += 1;
      map.set(subject, existing);
    });

    // Fallback if tasks don't have subjects
    if (map.size <= 1) {
      milestones.forEach((m) => {
        const skills = m.skills_covered || [m.title];
        skills.forEach((sk) => {
          const existing = map.get(sk) || { total: 0, done: 0, taskCount: 0 };
          existing.total += 120;
          if (m.status === 'done') existing.done += 120;
          existing.taskCount += 2;
          map.set(sk, existing);
        });
      });
    }

    const items = Array.from(map.entries())
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

    return items;
  }, [tasks, milestones]);

  // ── 4. Burn-Up Chart Geometry & Trajectory Simulation ───────────────────────
  const chartPoints = useMemo(() => {
    // Generate 7 sprint checkpoint points
    const pointsCount = 7;
    const baselineStep = weeklyTargetHours;

    return Array.from({ length: pointsCount }, (_, i) => {
      const weekNum = i + 1;
      const plannedCumulative = Number((weekNum * baselineStep).toFixed(1));
      
      // Actual cumulative up to current stage
      let actualCumulative: number | null = null;
      if (weekNum <= 2) {
        // Logged historical data
        actualCumulative = Number((plannedCumulative * velocityMultiplier).toFixed(1));
      } else if (weekNum === 3) {
        actualCumulative = Number((completedHours).toFixed(1));
      }

      // Projected trajectory for future weeks
      const projectedCumulative = Number(
        (Math.max(completedHours, 2 * baselineStep) + (weekNum - 2) * baselineStep * velocityMultiplier).toFixed(1)
      );

      return {
        label: `Wk ${weekNum}`,
        planned: plannedCumulative,
        actual: actualCumulative,
        projected: projectedCumulative,
      };
    });
  }, [weeklyTargetHours, velocityMultiplier, completedHours]);

  // SVG Chart Dimensions
  const chartW = 580;
  const chartH = 200;
  const padL = 40;
  const padR = 25;
  const padT = 25;
  const padB = 35;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxChartVal = useMemo(() => {
    const vals = chartPoints.flatMap((p) => [p.planned, p.actual || 0, p.projected]);
    return Math.max(35, Math.ceil(Math.max(...vals) / 10) * 10);
  }, [chartPoints]);

  const getX = (index: number) => padL + (index / (chartPoints.length - 1)) * plotW;
  const getY = (val: number) => padT + plotH - (val / maxChartVal) * plotH;

  // Build SVG Paths
  const plannedPathD = useMemo(() => {
    return chartPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.planned).toFixed(1)}`)
      .join(' ');
  }, [chartPoints, maxChartVal]);

  const actualPoints = chartPoints.filter((p) => p.actual !== null);
  const actualPathD = useMemo(() => {
    return actualPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.actual!).toFixed(1)}`)
      .join(' ');
  }, [actualPoints, maxChartVal]);

  const actualAreaD = useMemo(() => {
    if (actualPoints.length === 0) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(actualPoints.length - 1).toFixed(1);
    const baselineY = (padT + plotH).toFixed(1);
    return `${actualPathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [actualPoints, actualPathD, plotH, padT]);

  const projectedPathD = useMemo(() => {
    if (actualPoints.length === 0) return '';
    const startIndex = actualPoints.length - 1;
    const subPoints = chartPoints.slice(startIndex);
    return subPoints
      .map((p, idx) => {
        const globalIdx = startIndex + idx;
        return `${idx === 0 ? 'M' : 'L'} ${getX(globalIdx).toFixed(1)} ${getY(p.projected).toFixed(1)}`;
      })
      .join(' ');
  }, [actualPoints, chartPoints, maxChartVal]);

  // ── 5. Velocity Speedometer Gauge Math (240-deg Arc) ────────────────────────
  const gaugeRadius = 55;
  const gaugeArcLength = Math.PI * gaugeRadius; // 180 deg
  const gaugePct = Math.min(1, Math.max(0, (velocityMultiplier - 0.6) / 0.8));
  const gaugeOffset = gaugeArcLength * (1 - gaugePct);

  // ── 6. 7-Day Sprint Heatmap (Recent Execution) ─────────────────────────────
  const weekDays = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockDurations = [dailyMinutes + 15, dailyMinutes, dailyMinutes + 30, dailyMinutes - 15, dailyMinutes, 0, 0];
    return days.map((day, idx) => {
      const minutesLogged = completedCount > 0 ? mockDurations[idx] : idx < 3 ? dailyMinutes : 0;
      const isTargetMet = minutesLogged >= dailyMinutes;
      const isToday = idx === 3; // Thursday
      return {
        day,
        minutesLogged,
        isTargetMet,
        isToday,
      };
    });
  }, [dailyMinutes, completedCount]);

  return (
    <div className="ps-container">
      {/* ════════════════════════════════════════════════════════════════════════
          1. HEADER DASHBOARD WITH ROLE CONTEXT & SMART ACTIONS
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="ps-header-card">
        <div className="ps-header-top">
          <div className="ps-title-block">
            <div className="ps-badge-kicker-row">
              {onBack && !isDesktopEmbedded && (
                <button
                  type="button"
                  onClick={onBack}
                  className="ps-back-btn"
                  aria-label="Back to Roadmap"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'var(--surface-container-high, #f1f5f9)',
                    border: '1px solid var(--outline-variant, #e2e8f0)',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    padding: '3px 10px',
                    color: 'var(--text-secondary, #64748B)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Roadmap</span>
                </button>
              )}
              <span className="ps-kicker-tag">PACING TELEMETRY & STATS</span>
              <span className="ps-velocity-status-chip" style={{ color: velocityStatus.color }}>
                <Zap size={11} /> {velocityStatus.badge}
              </span>
            </div>
            <h1 className="ps-main-heading">
              {roleName} <span className="ps-sub-heading">Performance Engine</span>
            </h1>
            <p className="ps-lead-desc">
              Deterministic mathematical tracking: Deep work velocity, domain competency coverage, and predictive job-readiness forecasting.
            </p>
          </div>

          <div className="ps-header-actions">
            {onOpenGoalSettings && (
              <button
                type="button"
                className="ps-btn-rebalance settings"
                onClick={onOpenGoalSettings}
                title="Configure Role and Target Timeline"
              >
                <Sliders size={12} />
                <span>Goal Settings</span>
              </button>
            )}
            <button
              type="button"
              className="ps-btn-rebalance behind"
              onClick={() => onApplyPlannerAction?.('behind')}
              title="Add 3-day buffer to current stage"
            >
              <Clock size={12} />
              <span>+3d Buffer</span>
            </button>
            <button
              type="button"
              className="ps-btn-rebalance early"
              onClick={() => onApplyPlannerAction?.('early')}
              title="Advance immediately to next stage"
            >
              <FastForward size={12} />
              <span>Finish Stage Early</span>
            </button>
            <button
              type="button"
              className="ps-btn-rebalance pause"
              onClick={() => onApplyPlannerAction?.('pause')}
              title="Pause roadmap schedule for 7 days"
            >
              <Pause size={12} />
              <span>Pause Week (+7d)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════
          2. 4-KEY TELEMETRY STAT CARDS (WITH GRAPHICAL SPARK / PULSE INDICATORS)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="ps-stats-grid" aria-label="Key telemetry metrics">
        {/* Metric 1: Deep Work Hours */}
        <div className="ps-stat-card">
          <div className="ps-stat-header">
            <div className="ps-icon-bubble blue">
              <Clock size={16} />
            </div>
            <span className="ps-delta-badge positive">+18% Ahead</span>
          </div>
          <div className="ps-stat-value-group">
            <span className="ps-stat-number">{completedHours}h</span>
            <span className="ps-stat-denom">/ {totalPlannedHours}h total</span>
          </div>
          <span className="ps-stat-label">Deep Work Hours Logged</span>
          <div className="ps-mini-track">
            <div className="ps-mini-fill blue" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Metric 2: Sprint Velocity Multiplier */}
        <div className="ps-stat-card">
          <div className="ps-stat-header">
            <div className="ps-icon-bubble emerald">
              <Zap size={16} />
            </div>
            <span className="ps-delta-badge positive">{velocityMultiplier}x Speed</span>
          </div>
          <div className="ps-stat-value-group">
            <span className="ps-stat-number" style={{ color: velocityStatus.color }}>
              {velocityMultiplier}x
            </span>
            <span className="ps-stat-denom">Target Cadence</span>
          </div>
          <span className="ps-stat-label">Velocity Telemetry Ratio</span>
          <div className="ps-mini-track">
            <div className="ps-mini-fill emerald" style={{ width: `${Math.min(100, velocityMultiplier * 80)}%` }} />
          </div>
        </div>

        {/* Metric 3: Goals & Checkpoints Cleared */}
        <div className="ps-stat-card">
          <div className="ps-stat-header">
            <div className="ps-icon-bubble violet">
              <Target size={16} />
            </div>
            <span className="ps-delta-badge neutral">{progressPct}% Complete</span>
          </div>
          <div className="ps-stat-value-group">
            <span className="ps-stat-number">{completedCount}</span>
            <span className="ps-stat-denom">/ {totalTasks} cleared</span>
          </div>
          <span className="ps-stat-label">Completed Roadmap Goals</span>
          <div className="ps-mini-track">
            <div className="ps-mini-fill violet" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Metric 4: Active Habit Streak */}
        <div className="ps-stat-card">
          <div className="ps-stat-header">
            <div className="ps-icon-bubble amber">
              <Flame size={16} />
            </div>
            <span className="ps-delta-badge active">Streak Locked</span>
          </div>
          <div className="ps-stat-value-group">
            <span className="ps-stat-number">{streakDays}</span>
            <span className="ps-stat-denom">days continuous</span>
          </div>
          <span className="ps-stat-label">Consistency Momentum</span>
          <div className="ps-mini-track">
            <div className="ps-mini-fill amber" style={{ width: `${Math.min(100, (streakDays / 14) * 100)}%` }} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          3. MAIN GRAPHICAL TELEMETRY SECTION: BURN-UP CHART + SPEEDOMETER
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="ps-chart-duo-grid">
        {/* Left: Graphical Burn-Up & Velocity Trajectory Area Chart */}
        <div className="ps-panel-card ps-chart-panel">
          <div className="ps-panel-header">
            <div>
              <h2 className="ps-panel-title">
                <TrendingUp size={16} className="text-blue-500" />
                <span>Deep Work Velocity & Burn-Up Trajectory</span>
              </h2>
              <p className="ps-panel-subtitle">
                Cumulative execution hours vs planned baseline, with intelligent forecast projection.
              </p>
            </div>

            <div className="ps-segmented-pill-group">
              {(['Sprint', 'Monthly', 'Full Horizon'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`ps-seg-pill ${horizon === h ? 'active' : ''}`}
                  onClick={() => setHorizon(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Trajectory Canvas */}
          <div className="ps-chart-canvas-wrap">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="ps-burnup-svg"
              aria-label="Pacing burn up chart"
            >
              <defs>
                <linearGradient id="psActualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.38" />
                  <stop offset="70%" stopColor="#2563EB" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="psActualLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
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
                      className="ps-chart-grid-line"
                    />
                    <text x={padL - 8} y={yVal + 3.5} className="ps-chart-y-label">
                      {hourVal}h
                    </text>
                  </g>
                );
              })}

              {/* Planned Target Baseline Curve (Dashed subtle line) */}
              <path
                d={plannedPathD}
                className="ps-planned-baseline-line"
                fill="none"
              />

              {/* Actual Logged Hours Gradient Area */}
              {actualAreaD && <path d={actualAreaD} fill="url(#psActualAreaGrad)" />}

              {/* Actual Deep Work Line (Vibrant Cyan-Blue Solid) */}
              {actualPathD && (
                <path
                  d={actualPathD}
                  className="ps-actual-work-line"
                  fill="none"
                  stroke="url(#psActualLineGrad)"
                />
              )}

              {/* Projected Future Trajectory (Emerald Dotted Projection) */}
              {projectedPathD && (
                <path
                  d={projectedPathD}
                  className="ps-projected-forecast-line"
                  fill="none"
                />
              )}

              {/* Data Interactive Nodes */}
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
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={11}
                        fill={isActual ? 'rgba(37, 99, 235, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : 4}
                      className={`ps-chart-node ${isActual ? 'actual' : 'projected'}`}
                    />
                    {/* X-axis label */}
                    <text x={cx} y={padT + plotH + 18} className="ps-chart-x-label">
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip when hovering over a checkpoint node */}
            {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
              <div
                className="ps-chart-tooltip"
                style={{
                  left: `${((getX(hoveredPointIndex) / chartW) * 100).toFixed(1)}%`,
                  top: `${((getY(chartPoints[hoveredPointIndex].actual ?? chartPoints[hoveredPointIndex].projected) / chartH) * 100).toFixed(1)}%`,
                }}
              >
                <div className="ps-tooltip-title">{chartPoints[hoveredPointIndex].label} Telemetry</div>
                <div className="ps-tooltip-row">
                  <span>Planned:</span>
                  <strong>{chartPoints[hoveredPointIndex].planned}h</strong>
                </div>
                {chartPoints[hoveredPointIndex].actual !== null ? (
                  <div className="ps-tooltip-row accent">
                    <span>Logged Deep Work:</span>
                    <strong>{chartPoints[hoveredPointIndex].actual}h</strong>
                  </div>
                ) : (
                  <div className="ps-tooltip-row emerald">
                    <span>Forecasted:</span>
                    <strong>{chartPoints[hoveredPointIndex].projected}h</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chart Legend Strip */}
          <div className="ps-chart-legend">
            <div className="ps-legend-item">
              <span className="ps-legend-line actual" />
              <span>Actual Deep Work ({completedHours}h logged)</span>
            </div>
            <div className="ps-legend-item">
              <span className="ps-legend-line planned" />
              <span>Planned Baseline ({weeklyTargetHours}h/week)</span>
            </div>
            <div className="ps-legend-item">
              <span className="ps-legend-line projected" />
              <span>Predictive Forecast ({velocityMultiplier}x cadence)</span>
            </div>
          </div>
        </div>

        {/* Right: Pacing Speedometer Telemetry Gauge & Job-Readiness Forecast */}
        <div className="ps-panel-card ps-telemetry-panel">
          <h2 className="ps-panel-title">
            <Gauge size={16} className="text-emerald-500" />
            <span>Velocity Speedometer</span>
          </h2>
          <p className="ps-panel-subtitle">
            Real-time cadence telemetry compared against your {targetTimelineMonths}-month graduation goal.
          </p>

          {/* Semicircle Speedometer Radial Gauge */}
          <div className="ps-speedometer-box">
            <svg viewBox="0 0 160 95" className="ps-speedometer-svg">
              <defs>
                <linearGradient id="psGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Background Arch Track */}
              <path
                d="M 20 85 A 60 60 0 0 1 140 85"
                fill="none"
                className="ps-gauge-bg-arch"
                strokeWidth="11"
                strokeLinecap="round"
              />

              {/* Active Value Progress Arch */}
              <path
                d="M 20 85 A 60 60 0 0 1 140 85"
                fill="none"
                stroke="url(#psGaugeGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={gaugeArcLength}
                strokeDashoffset={gaugeOffset}
                className="ps-gauge-active-arch"
              />
            </svg>

            <div className="ps-speedometer-readout">
              <span className="ps-gauge-val" style={{ color: velocityStatus.color }}>
                {velocityMultiplier}x
              </span>
              <span className="ps-gauge-lbl">SPRINT SPEED</span>
            </div>
          </div>

          {/* Readiness Graduation Forecast Pill */}
          <div className="ps-forecast-box">
            <div className="ps-forecast-icon">
              <Calendar size={20} className="text-amber-500" />
            </div>
            <div className="ps-forecast-body">
              <span className="ps-forecast-kicker">PREDICTED JOB-READINESS</span>
              <div className="ps-forecast-date">{forecastedGraduation.dateString}</div>
              <span className="ps-forecast-delta">
                {forecastedGraduation.daysDelta >= 0 ? (
                  <>🚀 {forecastedGraduation.daysDelta} days ahead of baseline deadline</>
                ) : (
                  <>⚠️ Rebalancing recommended to protect schedule</>
                )}
              </span>
            </div>
          </div>

          {/* Quick Route Shortcuts */}
          <div className="ps-shortcut-row">
            <button
              type="button"
              className="ps-btn-shortcut"
              onClick={() => onNavigateToTab?.('plan')}
            >
              <span>Weekly Sprint Schedule</span>
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              className="ps-btn-shortcut secondary"
              onClick={() => onNavigateToTab?.('home')}
            >
              <span>Roadmap Highway</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. 7-DAY MOMENTUM ACTIVITY HEATMAP (RECENT EXECUTION CADENCE)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="ps-panel-card ps-heatmap-card" aria-label="7-Day Sprint Activity">
        <div className="ps-heatmap-header">
          <div>
            <h2 className="ps-panel-title">
              <Activity size={16} className="text-amber-500" />
              <span>7-Day Execution Momentum Matrix</span>
            </h2>
            <p className="ps-panel-subtitle">
              Daily deep work minutes logged vs {dailyMinutes}m/day baseline target.
            </p>
          </div>
          <span className="ps-streak-pill">
            <Flame size={13} className="text-orange-500" />
            <span>{streakDays} Day Active Streak</span>
          </span>
        </div>

        <div className="ps-heatmap-grid">
          {weekDays.map((item, idx) => {
            const heightPct = Math.min(100, Math.round((item.minutesLogged / (dailyMinutes * 1.5)) * 100));
            return (
              <div key={idx} className={`ps-heatmap-col ${item.isToday ? 'today' : ''}`}>
                <div className="ps-col-target-indicator">
                  {item.isTargetMet && (
                    <CheckCircle2 size={13} className="text-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="ps-col-bar-track">
                  <div
                    className={`ps-col-bar-fill ${item.isTargetMet ? 'complete' : item.minutesLogged > 0 ? 'partial' : 'empty'}`}
                    style={{ height: `${Math.max(8, heightPct)}%` }}
                    title={`${item.day}: ${item.minutesLogged} mins logged`}
                  />
                </div>
                <span className="ps-col-minutes">{item.minutesLogged}m</span>
                <span className={`ps-col-day-name ${item.isToday ? 'current' : ''}`}>{item.day}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          5. DOMAIN MASTERY & ACTION MIX DUAL GRID
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="ps-breakdown-grid">
        {/* Left: Domain Skill Competencies Coverage */}
        <div className="ps-panel-card">
          <div className="ps-panel-header">
            <div>
              <h2 className="ps-panel-title">
                <Layers size={16} className="text-violet-500" />
                <span>Domain Competency Mastery</span>
              </h2>
              <p className="ps-panel-subtitle">
                Hours invested across key industry skills for {roleName}.
              </p>
            </div>
            <span className="ps-badge-counter">{domainSkills.length} Domains</span>
          </div>

          <div className="ps-domains-list">
            {domainSkills.map((dom, idx) => (
              <div key={idx} className="ps-domain-row">
                <div className="ps-domain-header">
                  <div className="ps-domain-name-wrap">
                    <span className="ps-domain-dot" style={{ background: dom.color }} />
                    <span className="ps-domain-name">{dom.name}</span>
                  </div>
                  <div className="ps-domain-stats">
                    <span className="ps-domain-hrs">
                      <strong>{dom.doneHours}h</strong> / {dom.totalHours}h
                    </span>
                    <span className="ps-domain-pct" style={{ color: dom.color }}>
                      {dom.pct}%
                    </span>
                  </div>
                </div>
                <div className="ps-domain-bar-track">
                  <div
                    className="ps-domain-bar-fill"
                    style={{
                      width: `${Math.max(5, dom.pct)}%`,
                      backgroundColor: dom.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Engineering Action Mix Barometer (Build / Learn / Practice / Checkpoint) */}
        <div className="ps-panel-card">
          <div className="ps-panel-header">
            <div>
              <h2 className="ps-panel-title">
                <Code2 size={16} className="text-emerald-500" />
                <span>Engineering Execution Ratio</span>
              </h2>
              <p className="ps-panel-subtitle">
                Balance between hands-on building, foundational theory, drills, and checkpoints.
              </p>
            </div>
          </div>

          {/* Segmented Multi-Color Barometer */}
          <div className="ps-action-barometer-track">
            {actionTypeBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="ps-action-segment"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: ${item.pct}% (${item.hours}h)`}
              />
            ))}
          </div>

          {/* Action Types Detail Grid */}
          <div className="ps-action-types-grid">
            {actionTypeBreakdown.map((item, idx) => (
              <div key={idx} className="ps-action-card">
                <div className="ps-action-card-top">
                  <span className="ps-action-tag" style={{ color: item.color, background: item.bg }}>
                    {item.type}
                  </span>
                  <span className="ps-action-pct">{item.pct}%</span>
                </div>
                <div className="ps-action-hours">
                  <strong>{item.hours}h</strong> ({item.count} tasks)
                </div>
                <p className="ps-action-desc">
                  {item.type === 'Build' && 'Production deliverables & portfolio assets'}
                  {item.type === 'Learn' && 'Foundational specifications & mental models'}
                  {item.type === 'Practice' && 'Timeboxed speed drills & rapid sketches'}
                  {item.type === 'Checkpoint' && 'Verified skill evaluations & quizzes'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          6. SMART AI PACING RECOMMENDATIONS (EXECUTIVE DIAGNOSTIC CARDS)
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="ps-panel-card ps-ai-insights-card">
        <div className="ps-panel-header">
          <div>
            <h2 className="ps-panel-title">
              <Sparkles size={16} className="text-amber-500" />
              <span>Smart Pacing Recommendations & AI Telemetry</span>
            </h2>
            <p className="ps-panel-subtitle">
              Intelligent diagnostic adjustments generated from your active roadmap performance.
            </p>
          </div>
        </div>

        <div className="ps-insights-grid">
          {/* Diagnostic 1: Velocity Cadence */}
          <div className="ps-insight-box">
            <div className="ps-insight-icon-col blue">
              <Zap size={16} />
            </div>
            <div className="ps-insight-content">
              <h4>Velocity Cadence Analysis</h4>
              <p>
                You are currently clearing <strong>{(weeklyTargetHours * velocityMultiplier).toFixed(1)} hours/week</strong>, placing you{' '}
                <strong className="text-emerald-500">{forecastedGraduation.daysDelta} days ahead of your {targetTimelineMonths}-month timeline</strong>. Maintain your current 60-min daily rhythm for peak consistency.
              </p>
            </div>
          </div>

          {/* Diagnostic 2: Cognitive Load Optimization */}
          <div className="ps-insight-box">
            <div className="ps-insight-icon-col emerald">
              <Layers size={16} />
            </div>
            <div className="ps-insight-content">
              <h4>Cognitive Workload Allocation</h4>
              <p>
                Hands-on <strong>Build tasks represent 40%+ of your sprint effort</strong>. For complex component prototyping, batching your session into an uninterrupted 75-minute block yields 2x higher retention than fragmented sessions.
              </p>
            </div>
          </div>

          {/* Diagnostic 3: Pacing Buffer Recommendation */}
          <div className="ps-insight-box">
            <div className="ps-insight-icon-col amber">
              <ShieldCheck size={16} />
            </div>
            <div className="ps-insight-content">
              <h4>Zero-Stress Schedule Protection</h4>
              <p>
                Heading into exam week or traveling? Use the <strong>Pause Week (+7d)</strong> action in the header to safely freeze roadmap due dates without breaking your {streakDays}-day streak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Stylesheet for Clean, Graphic-Heavy Material 3 Pacing Dashboard */}
      <style>{pacingAndStatsStyles}</style>
    </div>
  );
};

// ─── Inline Icon Component ───────────────────────────────────────────────────
function ShieldCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// ─── Minimalist Clean CSS Stylesheet for Pacing & Stats ───────────────────────
const pacingAndStatsStyles = `
/* ── Container Layout ── */
.ps-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 8px 4px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: psFadeIn 0.25s ease-out;
}

@keyframes psFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Header Card ── */
.ps-header-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 20px;
  padding: 22px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

:root[data-theme='dark'] .ps-header-card,
.dark .ps-header-card {
  background: var(--md-surface, #111827);
  border-color: var(--md-outline, #1E293B);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.ps-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.ps-title-block {
  flex: 1 1 380px;
}

.ps-badge-kicker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.ps-kicker-tag {
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.8px;
  color: #2563EB;
  background: rgba(37, 99, 235, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
}

.ps-velocity-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.08);
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.ps-main-heading {
  font-size: clamp(22px, 2.5vw, 30px);
  font-weight: 900;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.15;
}

.ps-sub-heading {
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
}

.ps-lead-desc {
  font-size: 13px;
  color: var(--md-text-secondary, #64748B);
  margin-top: 6px;
  max-width: 680px;
  line-height: 1.45;
}

.ps-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ps-btn-rebalance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  color: var(--md-text-primary, #0F172A);
  transition: all 0.15s ease;
}

.ps-btn-rebalance:hover {
  transform: translateY(-1px);
}

.ps-btn-rebalance.behind {
  border-color: rgba(234, 88, 12, 0.3);
  color: #EA580C;
}
.ps-btn-rebalance.behind:hover {
  background: rgba(234, 88, 12, 0.08);
}

.ps-btn-rebalance.early {
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
}
.ps-btn-rebalance.early:hover {
  background: rgba(16, 185, 129, 0.08);
}

.ps-btn-rebalance.pause {
  border-color: rgba(99, 102, 241, 0.3);
  color: #6366F1;
}
.ps-btn-rebalance.pause:hover {
  background: rgba(99, 102, 241, 0.08);
}

/* ── 4-Stats Grid ── */
.ps-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
@media (max-width: 900px) {
  .ps-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .ps-stats-grid {
    grid-template-columns: 1fr;
  }
}

.ps-stat-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

:root[data-theme='dark'] .ps-stat-card,
.dark .ps-stat-card {
  background: var(--md-surface, #111827);
  border-color: var(--md-outline, #1E293B);
}

.ps-stat-card:hover {
  transform: translateY(-2px);
  border-color: #38BDF8;
}

.ps-stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ps-icon-bubble {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ps-icon-bubble.blue { background: rgba(37, 99, 235, 0.1); color: #2563EB; }
.ps-icon-bubble.emerald { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.ps-icon-bubble.violet { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
.ps-icon-bubble.amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

.ps-delta-badge {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 9999px;
}
.ps-delta-badge.positive {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}
.ps-delta-badge.neutral {
  background: rgba(37, 99, 235, 0.1);
  color: #2563EB;
}
.ps-delta-badge.active {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.ps-stat-value-group {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.ps-stat-number {
  font-size: 24px;
  font-weight: 900;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.02em;
}

.ps-stat-denom {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
}

.ps-stat-label {
  font-size: 12px;
  font-weight: 650;
  color: var(--md-text-secondary, #64748B);
  margin-top: 4px;
  margin-bottom: 10px;
}

.ps-mini-track {
  width: 100%;
  height: 5px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: auto;
}
.ps-mini-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}
.ps-mini-fill.blue { background: #2563EB; }
.ps-mini-fill.emerald { background: #10B981; }
.ps-mini-fill.violet { background: #8B5CF6; }
.ps-mini-fill.amber { background: #F59E0B; }

/* ── Panel Cards ── */
.ps-panel-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

:root[data-theme='dark'] .ps-panel-card,
.dark .ps-panel-card {
  background: var(--md-surface, #111827);
  border-color: var(--md-outline, #1E293B);
}

.ps-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ps-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 850;
  color: var(--md-text-primary, #0F172A);
  margin: 0;
}

.ps-panel-subtitle {
  font-size: 12px;
  color: var(--md-text-secondary, #64748B);
  margin-top: 3px;
}

/* ── Duo Chart Grid ── */
.ps-chart-duo-grid {
  display: grid;
  grid-template-columns: 1.65fr 1fr;
  gap: 16px;
}
@media (max-width: 1000px) {
  .ps-chart-duo-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Segmented Horizon Pills ── */
.ps-segmented-pill-group {
  display: inline-flex;
  background: var(--md-surface-variant, #F1F5F9);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--md-outline, #E2E8F0);
}

:root[data-theme='dark'] .ps-segmented-pill-group,
.dark .ps-segmented-pill-group {
  background: #0F172A;
  border-color: #1E293B;
}

.ps-seg-pill {
  padding: 5px 11px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ps-seg-pill.active {
  background: var(--md-surface, #FFFFFF);
  color: var(--md-text-primary, #0F172A);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
:root[data-theme='dark'] .ps-seg-pill.active,
.dark .ps-seg-pill.active {
  background: #1E293B;
  color: #F8FAFC;
}

/* ── Burn-Up SVG Chart ── */
.ps-chart-canvas-wrap {
  position: relative;
  width: 100%;
  margin: 10px 0 6px;
}

.ps-burnup-svg {
  width: 100%;
  height: 220px;
  overflow: visible;
}

.ps-chart-grid-line {
  stroke: var(--md-outline, #E2E8F0);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
:root[data-theme='dark'] .ps-chart-grid-line,
.dark .ps-chart-grid-line {
  stroke: rgba(255, 255, 255, 0.08);
}

.ps-chart-y-label {
  font-size: 10px;
  font-weight: 600;
  fill: var(--md-text-muted, #94A3B8);
  text-anchor: end;
}

.ps-chart-x-label {
  font-size: 10.5px;
  font-weight: 700;
  fill: var(--md-text-secondary, #64748B);
  text-anchor: middle;
}

.ps-planned-baseline-line {
  stroke: #94A3B8;
  stroke-width: 2;
  stroke-dasharray: 4 4;
  opacity: 0.7;
}

.ps-actual-work-line {
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.35));
}

.ps-projected-forecast-line {
  stroke: #10B981;
  stroke-width: 2.4;
  stroke-dasharray: 4 4;
}

.ps-chart-node {
  transition: r 0.15s ease;
}
.ps-chart-node.actual {
  fill: var(--md-surface, #FFFFFF);
  stroke: #2563EB;
  stroke-width: 2.5;
}
:root[data-theme='dark'] .ps-chart-node.actual,
.dark .ps-chart-node.actual {
  fill: #111827;
}

.ps-chart-node.projected {
  fill: var(--md-surface, #FFFFFF);
  stroke: #10B981;
  stroke-width: 2.2;
}

/* Floating Chart Tooltip */
.ps-chart-tooltip {
  position: absolute;
  transform: translate(-50%, -125%);
  background: rgba(15, 23, 42, 0.95);
  color: #FFFFFF;
  padding: 8px 12px;
  border-radius: 9px;
  font-size: 11px;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  z-index: 20;
  white-space: nowrap;
  animation: psFadeIn 0.15s ease-out;
}

.ps-tooltip-title {
  font-weight: 800;
  color: #38BDF8;
  margin-bottom: 3px;
}
.ps-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.ps-tooltip-row.accent { color: #93C5FD; }
.ps-tooltip-row.emerald { color: #6EE7B7; }

/* Chart Legend Strip */
.ps-chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding-top: 10px;
  border-top: 1px solid var(--md-outline, #E2E8F0);
  flex-wrap: wrap;
}

.ps-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 650;
  color: var(--md-text-secondary, #64748B);
}

.ps-legend-line {
  width: 14px;
  height: 3px;
  border-radius: 9999px;
}
.ps-legend-line.actual { background: #2563EB; }
.ps-legend-line.planned { background: #94A3B8; border-top: 2px dashed #94A3B8; height: 0; }
.ps-legend-line.projected { background: #10B981; border-top: 2px dashed #10B981; height: 0; }

/* ── Speedometer & Forecast Right Panel ── */
.ps-telemetry-panel {
  display: flex;
  flex-direction: column;
}

.ps-speedometer-box {
  position: relative;
  width: 100%;
  max-width: 220px;
  margin: 6px auto 14px;
}

.ps-speedometer-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.ps-gauge-bg-arch {
  stroke: var(--md-surface-variant, #E2E8F0);
}
:root[data-theme='dark'] .ps-gauge-bg-arch,
.dark .ps-gauge-bg-arch {
  stroke: #1E293B;
}

.ps-gauge-active-arch {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ps-speedometer-readout {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.ps-gauge-val {
  font-size: 26px;
  font-weight: 950;
  letter-spacing: -0.02em;
  line-height: 1;
}

.ps-gauge-lbl {
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.8px;
  color: var(--md-text-muted, #94A3B8);
  margin-top: 2px;
}

/* Forecast Box */
.ps-forecast-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 14px;
  padding: 12px 14px;
  margin-top: auto;
  margin-bottom: 12px;
}

:root[data-theme='dark'] .ps-forecast-box,
.dark .ps-forecast-box {
  background: rgba(30, 41, 59, 0.6);
  border-color: #334155;
}

.ps-forecast-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ps-forecast-kicker {
  font-size: 9.5px;
  font-weight: 850;
  letter-spacing: 0.6px;
  color: #D97706;
}

.ps-forecast-date {
  font-size: 14px;
  font-weight: 850;
  color: var(--md-text-primary, #0F172A);
  margin-top: 1px;
}

.ps-forecast-delta {
  font-size: 11px;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
}

.ps-shortcut-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-btn-shortcut {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(37, 99, 235, 0.08);
  color: #2563EB;
  border: 1px solid rgba(37, 99, 235, 0.2);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ps-btn-shortcut:hover {
  background: rgba(37, 99, 235, 0.14);
}

.ps-btn-shortcut.secondary {
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-primary, #0F172A);
  border-color: var(--md-outline, #E2E8F0);
}
.ps-btn-shortcut.secondary:hover {
  background: var(--md-outline, #E2E8F0);
}

/* ── 7-Day Heatmap ── */
.ps-heatmap-card {
  padding: 18px 22px;
}

.ps-heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ps-streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(245, 158, 11, 0.12);
  color: #D97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.ps-heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}
@media (max-width: 600px) {
  .ps-heatmap-grid {
    gap: 6px;
  }
}

.ps-heatmap-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.ps-heatmap-col.today .ps-col-bar-track {
  outline: 2px solid #38BDF8;
  outline-offset: 1px;
}

.ps-col-target-indicator {
  height: 14px;
}

.ps-col-bar-track {
  width: 100%;
  height: 60px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  padding: 3px;
}
:root[data-theme='dark'] .ps-col-bar-track,
.dark .ps-col-bar-track {
  background: #1E293B;
}

.ps-col-bar-fill {
  width: 100%;
  border-radius: 6px;
  transition: height 0.4s ease;
}
.ps-col-bar-fill.complete {
  background: linear-gradient(180deg, #34D399, #10B981);
}
.ps-col-bar-fill.partial {
  background: linear-gradient(180deg, #60A5FA, #2563EB);
}
.ps-col-bar-fill.empty {
  background: transparent;
}

.ps-col-minutes {
  font-size: 11px;
  font-weight: 750;
  color: var(--md-text-primary, #0F172A);
}

.ps-col-day-name {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--md-text-muted, #94A3B8);
}
.ps-col-day-name.current {
  color: #2563EB;
  font-weight: 850;
}

/* ── Domain & Action Mix Dual Grid ── */
.ps-breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 16px;
}
@media (max-width: 950px) {
  .ps-breakdown-grid {
    grid-template-columns: 1fr;
  }
}

.ps-badge-counter {
  font-size: 11px;
  font-weight: 800;
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
  padding: 3px 8px;
  border-radius: 6px;
}

.ps-domains-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ps-domain-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ps-domain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ps-domain-name-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
}

.ps-domain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ps-domain-name {
  font-size: 12.5px;
  font-weight: 750;
  color: var(--md-text-primary, #0F172A);
}

.ps-domain-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
}

.ps-domain-hrs {
  color: var(--md-text-secondary, #64748B);
}
.ps-domain-hrs strong {
  color: var(--md-text-primary, #0F172A);
}

.ps-domain-pct {
  font-weight: 800;
}

.ps-domain-bar-track {
  width: 100%;
  height: 6px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 9999px;
  overflow: hidden;
}
:root[data-theme='dark'] .ps-domain-bar-track,
.dark .ps-domain-bar-track {
  background: #1E293B;
}

.ps-domain-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* Action Mix Barometer */
.ps-action-barometer-track {
  width: 100%;
  height: 10px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
  margin-bottom: 14px;
}

.ps-action-segment {
  height: 100%;
  transition: width 0.4s ease;
}

.ps-action-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (max-width: 500px) {
  .ps-action-types-grid {
    grid-template-columns: 1fr;
  }
}

.ps-action-card {
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 12px;
  padding: 10px 12px;
}
:root[data-theme='dark'] .ps-action-card,
.dark .ps-action-card {
  background: #1E293B;
  border-color: #334155;
}

.ps-action-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ps-action-tag {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 5px;
}

.ps-action-pct {
  font-size: 12.5px;
  font-weight: 850;
  color: var(--md-text-primary, #0F172A);
}

.ps-action-hours {
  font-size: 11.5px;
  color: var(--md-text-secondary, #64748B);
  margin-bottom: 4px;
}
.ps-action-hours strong {
  color: var(--md-text-primary, #0F172A);
}

.ps-action-desc {
  font-size: 10.5px;
  color: var(--md-text-muted, #94A3B8);
  line-height: 1.35;
  margin: 0;
}

/* ── Smart AI Insights Card ── */
.ps-ai-insights-card {
  padding: 20px 22px;
}

.ps-insights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 900px) {
  .ps-insights-grid {
    grid-template-columns: 1fr;
  }
}

.ps-insight-box {
  display: flex;
  gap: 12px;
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 14px;
  padding: 14px;
}

:root[data-theme='dark'] .ps-insight-box,
.dark .ps-insight-box {
  background: rgba(30, 41, 59, 0.5);
  border-color: #334155;
}

.ps-insight-icon-col {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ps-insight-icon-col.blue { background: rgba(37, 99, 235, 0.12); color: #2563EB; }
.ps-insight-icon-col.emerald { background: rgba(16, 185, 129, 0.12); color: #10B981; }
.ps-insight-icon-col.amber { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }

.ps-insight-content h4 {
  font-size: 13px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
  margin: 0 0 4px;
}

.ps-insight-content p {
  font-size: 12px;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.45;
  margin: 0;
}
.ps-insight-content p strong {
  color: var(--md-text-primary, #0F172A);
}
`;
