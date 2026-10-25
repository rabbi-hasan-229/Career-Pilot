import React, { useState, useMemo, useCallback } from 'react';
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
  Target,
  Lightbulb,
  ListChecks,
  Timer,
  Check,
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

// ─── Goal Detail Guide Generator ───────────────────────────────────────────────
export interface GoalGuide {
  tagline: string;
  steps: Array<{ title: string; hint: string }>;
  deliverable: string;
  tip: string;
  sprintTime: string;
}

export function getGoalGuide(task: Task, roleName: string): GoalGuide {
  const title = (task.title || '').toLowerCase();
  const type = task.type || 'Learn';

  // 1. User Research & Empathy
  if (title.includes('interview') || title.includes('empathy') || title.includes('journey') || title.includes('research')) {
    return {
      tagline: 'Uncover genuine user motivations, emotional highs, and critical workflow friction points.',
      steps: [
        { title: 'Draft Non-Leading Protocol', hint: 'Write 5 open-ended questions targeting user workflow friction and pain points.' },
        { title: 'Run Active Listening Sessions', hint: 'Interview 3 participants; capture exact verbatim quotes and behavioral blockers.' },
        { title: 'Synthesize Journey Flow', hint: 'Cluster observations in FigJam into timeline stages: Awareness, Trial, Friction, Drop-off.' },
      ],
      deliverable: task.deliverable || 'User Journey Flow with synthesized friction points and opportunity statements',
      tip: 'Listen 80% of the time. Never pitch or justify your solution during user empathy sessions.',
      sprintTime: '20m Protocol · 45m Interviews · 15m Synthesis',
    };
  }

  // 2. Figma, Components & Design Tokens
  if (title.includes('figma') || title.includes('component') || title.includes('auto-layout') || title.includes('token') || title.includes('variant')) {
    return {
      tagline: 'Engineer a scalable, modular design system using Figma’s modern constraints and variables.',
      steps: [
        { title: 'Configure Spatial & Color Tokens', hint: 'Establish 8pt spatial padding, border radius, and semantic color variables.' },
        { title: 'Build Atomic Master Components', hint: 'Wrap layers in nested auto-layout (Shift+A); set Hug vertically and Fill horizontally.' },
        { title: 'Configure Component Props & States', hint: 'Add component properties and multi-state variants (default, hover, active, disabled).' },
      ],
      deliverable: task.deliverable || 'Production-grade component library with responsive auto-layout variants',
      tip: 'Avoid ungrouped layers. Nest auto-layout frames with 0px padding to create resilient responsive cards.',
      sprintTime: '15m Tokens · 40m Component Build · 15m Variant Testing',
    };
  }

  // 3. Wireframing, Prototyping & Visual Hierarchy
  if (title.includes('wireframe') || title.includes('prototype') || title.includes('smart animate') || title.includes('typography')) {
    return {
      tagline: 'Map visual screen hierarchy and rapid interactive user flows without color bias.',
      steps: [
        { title: 'Define Screen Hierarchy', hint: 'Prioritize key elements: Hero CTA, primary content cards, auxiliary actions.' },
        { title: 'Construct Grayscale Skeletons', hint: 'Build 8 responsive grayscale wireframes adhering strictly to an 8pt layout grid.' },
        { title: 'Connect Smart Animate Links', hint: 'Hook up clickable prototype links, modal overlays, and fluid drawer transitions.' },
      ],
      deliverable: task.deliverable || 'Interactive clickable prototype covering primary user happy-path',
      tip: 'Keep wireframes strictly grayscale (black/white/gray) so feedback focuses on UX structure rather than colors.',
      sprintTime: '15m IA Sketch · 45m Wireframing · 20m Smart Animate',
    };
  }

  // 4. Capstone Projects (E-Commerce, Food Delivery, Dashboards)
  if (title.includes('project') || title.includes('e-commerce') || title.includes('delivery') || title.includes('dashboard') || title.includes('capstone')) {
    return {
      tagline: 'Construct high-fidelity, data-dense product screens with realistic edge-case states.',
      steps: [
        { title: 'Analyze Conversion Funnels', hint: 'Map user journey from discovery to checkout/cart; eliminate redundant input fields.' },
        { title: 'Design High-Fidelity UI', hint: 'Apply typographic hierarchy, visual weight, crisp icons, and realistic dummy data.' },
        { title: 'Handle Edge Cases', hint: 'Design empty search states, loading skeletons, and validation error messages.' },
      ],
      deliverable: task.deliverable || 'Complete end-to-end multi-screen mobile/desktop product UI deck',
      tip: 'Recruiters evaluate how you handle edge cases (empty states, errors, long names) more than pretty hero screens.',
      sprintTime: '20m Flow Audit · 60m UI Polish · 20m Edge-Case Handling',
    };
  }

  // 5. Code, Database, RLS & APIs
  if (title.includes('html') || title.includes('css') || title.includes('code') || title.includes('dev') || title.includes('api') || title.includes('database')) {
    return {
      tagline: 'Ensure technical feasibility, token alignment, and clean developer handoff.',
      steps: [
        { title: 'Inspect Layout Constraints', hint: 'Review flexbox, grid alignment, and media query breakpoints.' },
        { title: 'Prepare Dev Mode Specs', hint: 'Document component token names, padding redlines, and exportable SVG assets.' },
        { title: 'Verify Edge Cases in Code', hint: 'Test responsive shrinkage, long text wrapping, and zero-state rendering.' },
      ],
      deliverable: task.deliverable || 'Production-ready Dev Mode handoff deck with token specifications',
      tip: 'Speak the language of developers. Spec components using flex-direction, gap, and padding units.',
      sprintTime: '15m Spec Audit · 40m Dev Token Setup · 15m Walkthrough',
    };
  }

  // 6. Checkpoints & Portfolio Deliverables
  if (type === 'Checkpoint' || title.includes('checkpoint') || title.includes('publish') || title.includes('portfolio') || title.includes('case')) {
    return {
      tagline: 'Audit quality criteria, package high-impact artifacts, and lock in stage progression.',
      steps: [
        { title: 'Audit Quality Standards', hint: 'Review your deliverables against WCAG 2.2 AA accessibility and stage specs.' },
        { title: 'Package Case Teardown', hint: 'Export high-res mockups, record a 60-second video walkthrough, and write 3 key takeaways.' },
        { title: 'Publish & Lock Progress', hint: 'Save artifact to your portfolio archive and submit for review or stage sign-off.' },
      ],
      deliverable: task.deliverable || 'Verified stage case study artifact package and presentation deck',
      tip: 'Treat every checkpoint as an interview case study. State the problem, your decisions, and the measurable outcome.',
      sprintTime: '20m Quality Audit · 35m Case Packaging · 15m Final Review',
    };
  }

  // Fallback based on type
  if (type === 'Build') {
    return {
      tagline: 'Translate conceptual requirements into tangible, production-grade assets.',
      steps: [
        { title: 'Setup Scaffold', hint: 'Establish layout boundaries, token variables, and base components.' },
        { title: 'Execute Core Build', hint: 'Assemble layout elements, enforce visual hierarchy, and test variants.' },
        { title: 'Self-Review & Polish', hint: 'Check responsive adaptability, spacing rhythm, and asset exports.' },
      ],
      deliverable: task.deliverable || `Completed ${roleName} production artifact`,
      tip: 'Ship a solid v1 within the timebox. Iterate on micro-details after the core structure is locked.',
      sprintTime: '15m Setup · 45m Core Build · 15m Polish',
    };
  }

  if (type === 'Practice') {
    return {
      tagline: 'Sharpen design muscle memory through timed problem-solving drills.',
      steps: [
        { title: 'Set Strict Constraint', hint: 'Set a 45-minute sprint timer to build real-world speed and urgency.' },
        { title: 'Execute Rapidly', hint: 'Draft solutions using keyboard shortcuts; avoid second-guessing.' },
        { title: 'Benchmark Against Standard', hint: 'Compare your output side-by-side with industry gold-standard references.' },
      ],
      deliverable: task.deliverable || 'Completed timed sprint solution and critique notes',
      tip: 'Speed comes from pattern recognition. Familiarize yourself with standard design patterns.',
      sprintTime: '10m Warmup · 30m Speed Drill · 10m Review',
    };
  }

  // Default Learn
  return {
    tagline: 'Master the foundational mental models, specifications, and industry best practices.',
    steps: [
      { title: 'Deconstruct Principles', hint: 'Study reference material, pattern libraries, and official specifications.' },
      { title: 'Extract Key Takeaways', hint: 'Summarize 3 core principles into your personal design notes workspace.' },
      { title: 'Apply in Micro-Exercise', hint: 'Build a quick 1-frame sketch demonstrating the concept in action.' },
    ],
    deliverable: task.deliverable || 'Synthesized concept breakdown and structured reference notes',
    tip: 'Focus on understanding the tradeoffs behind design decisions, not just memorizing rules.',
    sprintTime: '20m Deep Study · 30m Synthesis · 10m Micro-Exercise',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
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
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [checkedSubSteps, setCheckedSubSteps] = useState<Record<string, boolean>>({});
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [pacingFeedback, setPacingFeedback] = useState<string | null>(null);

  const handlePacingAction = (action: 'behind' | 'early' | 'pause') => {
    if (action === 'early') {
      setSelectedMilestoneId(null);
    }
    onApplyPlannerAction?.(action);
    const feedbackMessages: Record<string, string> = {
      behind: '+3 Days Added · Deadlines Rebalanced',
      early: 'Stage Completed Early · Next Stage Unlocked! 🚀',
      pause: '+7 Days Paused · Streak Protected ⏸️',
    };
    setPacingFeedback(feedbackMessages[action]);
    setTimeout(() => {
      setPacingFeedback(null);
    }, 4500);
  };

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

  // Toggle task goal detail expansion
  const toggleTaskExpanded = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Expand / Collapse all tasks in current view
  const areAllExpanded = useMemo(() => {
    if (currentTasks.length === 0) return false;
    return currentTasks.every((t) => expandedTasks[t.id]);
  }, [currentTasks, expandedTasks]);

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedTasks({});
    } else {
      const all: Record<string, boolean> = {};
      currentTasks.forEach((t) => {
        all[t.id] = true;
      });
      setExpandedTasks(all);
    }
  };

  // Toggle sub-step check
  const toggleSubStep = (stepKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedSubSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  // Handle task click with celebratory micro-interaction
  const handleTaskCheck = useCallback((task: Task, e: React.MouseEvent) => {
    const wasDone = task.done_at != null;
    onToggleTaskComplete(task.id);
    if (!wasDone) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 36,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ['#10B981', '#38BDF8', '#2563EB', '#F59E0B'],
      });
    }
  }, [onToggleTaskComplete]);

  const dailyMinutes = profile?.daily_minutes || 60;
  const roleName = profile?.target_role || 'Career Quest';

  // Filtered goals for focus view
  const displayedTasks = useMemo(() => {
    if (!selectedDayFilter) return currentTasks;
    return currentTasks.filter((_, idx) => {
      const dayName = DAY_NAMES[idx % DAY_NAMES.length];
      return dayName === selectedDayFilter;
    });
  }, [currentTasks, selectedDayFilter]);

  // SVG Radial Gauge Geometry
  const gaugeRadius = 24;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (currentStagePct / 100) * gaugeCircumference;

  return (
    <div className="ws-page-container">
      {/* ════════════════════════════════════════════════════════════════════════
          GRAPHICAL HEADER DASHBOARD
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="ws-header-card">
        <div className="ws-header-grid">
          {/* Left: Role Info & Sprint Context */}
          <div className="ws-header-main">
            <div className="ws-badge-row">
              <span className="ws-badge-kicker">WEEKLY EXECUTION SCHEDULE</span>
              <span className="ws-badge-timeline">
                <Clock size={11} /> {dailyMinutes}m/day · 5d/week · {totalEffortHours}h total
              </span>
            </div>
            <h1 className="ws-header-role">{roleName}</h1>
            <p className="ws-header-sub">
              Active Focus: <strong>{currentMilestone?.title || 'Foundations'}</strong>
            </p>
          </div>

          {/* Center: Graphical SVG Progress Ring */}
          <div className="ws-header-gauge-block">
            <div className="ws-gauge-wrapper" title={`Stage Progress: ${currentStagePct}%`}>
              <svg className="ws-radial-gauge" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
                <defs>
                  <linearGradient id="ws-gauge-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <circle
                  className="ws-gauge-bg"
                  cx="30"
                  cy="30"
                  r={gaugeRadius}
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  className="ws-gauge-bar"
                  cx="30"
                  cy="30"
                  r={gaugeRadius}
                  strokeWidth="5"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  fill="none"
                  stroke="url(#ws-gauge-grad)"
                />
              </svg>
              <div className="ws-gauge-center">
                <span className="ws-gauge-val">{currentStagePct}%</span>
              </div>
            </div>
            <div className="ws-gauge-meta">
              <span className="ws-gauge-label">STAGE {String(activeMilestoneIndex + 1).padStart(2, '0')}</span>
              <span className="ws-gauge-sub">{currentStageCompletedCount}/{currentTasks.length} Done</span>
            </div>
          </div>

          {/* Right: Quick Settings Controls */}
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

        {/* Minimalist Overall Progress Meter */}
        <div className="ws-progress-meter">
          <div className="ws-meter-track">
            <div className="ws-meter-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="ws-meter-label">
            <span>Overall Career Progress: <strong>{completedTasks}/{totalTasks} Goals Completed</strong></span>
            <span className="ws-meter-pct">{progressPct}% Overall</span>
          </div>
        </div>

        {/* ── Agile Planner Action Chips ── */}
        <div className="ws-rebalance-strip">
          <span className="ws-rebalance-label">Pacing Actions:</span>
          <button
            type="button"
            className="ws-action-chip behind"
            onClick={() => handlePacingAction('behind')}
            title="Shift timeline by +3 days without stress"
          >
            <Clock size={12} className="ws-chip-icon" />
            <span>I'm Behind (+3d)</span>
          </button>
          <button
            type="button"
            className="ws-action-chip early"
            onClick={() => handlePacingAction('early')}
            title="Advance early into upcoming stage goals"
          >
            <FastForward size={12} className="ws-chip-icon" />
            <span>Finished Early</span>
          </button>
          <button
            type="button"
            className="ws-action-chip pause"
            onClick={() => handlePacingAction('pause')}
            title="Pause schedule for 7 days without breaking streak"
          >
            <Pause size={12} className="ws-chip-icon" />
            <span>Pause Week (+7d)</span>
          </button>

          {pacingFeedback && (
            <span className="ws-pacing-feedback-badge" role="status" aria-live="polite">
              <Check size={11} className="ws-feedback-icon" />
              <span>{pacingFeedback}</span>
            </span>
          )}
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
          <span>Weekly Sprint</span>
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
          VIEW 1: THIS WEEK'S FOCUS (GRAPHICAL GOAL CARDS WITH EXPANDABLE GUIDES)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'focus' && currentMilestone && (
        <section className="ws-focus-section" aria-label="This week's focus">
          {/* Graphical Day Momentum Strip */}
          <div className="ws-day-track-bar">
            <div className="ws-day-track-label">
              <span className="ws-track-kicker">7-DAY MOMENTUM TRACK</span>
              <span className="ws-track-sub">Tap any day to focus · {currentStageCompletedCount} of {currentTasks.length} goals cleared</span>
            </div>

            <div className="ws-day-pills">
              {DAY_NAMES.slice(0, 5).map((day, idx) => {
                const assignedTask = currentTasks[idx];
                const isTaskDone = assignedTask?.done_at != null;
                const isDayActive = selectedDayFilter === day;
                const isCurrentToday = !isTaskDone && assignedTask != null && (idx === 0 || currentTasks[idx - 1]?.done_at != null);

                return (
                  <button
                    key={day}
                    type="button"
                    className={`ws-day-pill-btn ${isTaskDone ? 'done' : ''} ${isDayActive ? 'active' : ''} ${isCurrentToday ? 'today' : ''}`}
                    onClick={() => setSelectedDayFilter(selectedDayFilter === day ? null : day)}
                    title={`Filter by ${day}`}
                  >
                    <span className="ws-day-pill-code">{day.slice(0, 3).toUpperCase()}</span>
                    <span className="ws-day-pill-icon">
                      {isTaskDone ? (
                        <Check size={11} strokeWidth={3} />
                      ) : isCurrentToday ? (
                        <span className="ws-pulse-dot" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                  </button>
                );
              })}

              {selectedDayFilter && (
                <button
                  type="button"
                  className="ws-clear-filter-btn"
                  onClick={() => setSelectedDayFilter(null)}
                >
                  Show All 5 Days
                </button>
              )}
            </div>
          </div>

          {/* Stage Banner Summary & Expand All Control */}
          <div className="ws-stage-banner">
            <div className="ws-stage-banner-header">
              <div>
                <span className="ws-stage-pill">
                  STAGE {String(activeMilestoneIndex + 1).padStart(2, '0')} OF {milestones.length}
                </span>
                <h2 className="ws-stage-banner-title">{currentMilestone.title}</h2>
              </div>

              <div className="ws-stage-banner-right">
                <button
                  type="button"
                  className="ws-expand-all-btn"
                  onClick={toggleExpandAll}
                  title={areAllExpanded ? 'Collapse all goal guides' : 'Expand all goal guides'}
                >
                  <ChevronDown
                    size={14}
                    style={{
                      transform: areAllExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <span>{areAllExpanded ? 'Collapse Guides' : 'Expand All Guides'}</span>
                </button>
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

          {/* ── EXPANDABLE GOAL CARDS WITH SMART WRITING & GUIDES ── */}
          <div className="ws-goals-list">
            {displayedTasks.map((task, idx) => {
              const isDone = task.done_at != null;
              const originalIndex = currentTasks.findIndex((t) => t.id === task.id);
              const dayName = DAY_NAMES[(originalIndex >= 0 ? originalIndex : idx) % DAY_NAMES.length];
              const taskType = (task.type || 'Learn') as TaskActionType;
              const typeMeta = typeConfig[taskType] || typeConfig.Learn;
              const isExpanded = Boolean(expandedTasks[task.id]);
              const guide = getGoalGuide(task, roleName);

              return (
                <article
                  key={task.id}
                  className={`ws-goal-card ${isDone ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Card Header & Compact Overview */}
                  <div
                    className="ws-goal-header"
                    onClick={() => toggleTaskExpanded(task.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => e.key === 'Enter' && toggleTaskExpanded(task.id)}
                  >
                    <div className="ws-goal-header-left">
                      {/* Tactile Direct Checkbox */}
                      <button
                        type="button"
                        className={`ws-goal-checkbox ${isDone ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskCheck(task, e);
                        }}
                        title={isDone ? 'Mark as incomplete' : 'Mark goal complete'}
                        aria-label={`Mark ${task.title} complete`}
                      >
                        {isDone ? <Check size={13} strokeWidth={3} /> : null}
                      </button>

                      <div className="ws-goal-meta-block">
                        <div className="ws-goal-kicker-row">
                          <span className="ws-day-chip">{dayName.slice(0, 3).toUpperCase()}</span>
                          <span
                            className="ws-type-chip"
                            style={{ color: typeMeta.color, background: typeMeta.bg }}
                          >
                            {typeMeta.icon}
                            {typeMeta.label}
                          </span>
                          <span className="ws-time-chip">
                            <Timer size={11} /> {task.est_minutes || dailyMinutes}m sprint
                          </span>
                          {isDone && <span className="ws-done-tag">✓ Done</span>}
                        </div>

                        <h3 className={`ws-goal-title ${isDone ? 'done' : ''}`}>{task.title}</h3>
                      </div>
                    </div>

                    {/* Right: Expand / Arrow Down Button */}
                    <div className="ws-goal-header-right">
                      <button
                        type="button"
                        className={`ws-expand-arrow-btn ${isExpanded ? 'open' : ''}`}
                        onClick={(e) => toggleTaskExpanded(task.id, e)}
                        title={isExpanded ? 'Hide goal details' : 'Show goal details & step guide'}
                        aria-label={isExpanded ? 'Collapse goal details' : 'Expand goal details'}
                      >
                        <ChevronDown size={18} className="ws-expand-icon" />
                      </button>
                    </div>
                  </div>

                  {/* ── EXPANDED GOAL DETAIL DRAWER (STEP-BY-STEP GUIDE) ── */}
                  {isExpanded && (
                    <div className="ws-goal-drawer">
                      {/* Smart Executive Summary */}
                      <div className="ws-guide-banner">
                        <p className="ws-guide-summary">{guide.tagline}</p>
                      </div>

                      {/* 3 Step-by-Step Tactical Steps */}
                      <div className="ws-guide-section">
                        <div className="ws-guide-section-header">
                          <div className="ws-guide-section-title">
                            <ListChecks size={13} className="ws-guide-sec-icon" />
                            <span>Step-by-Step Action Guide</span>
                          </div>
                          <span className="ws-guide-steps-count">3 Tactical Steps</span>
                        </div>

                        <div className="ws-steps-list">
                          {guide.steps.map((step, sIdx) => {
                            const stepKey = `${task.id}-step-${sIdx}`;
                            const isStepDone = isDone || Boolean(checkedSubSteps[stepKey]);

                            return (
                              <div
                                key={stepKey}
                                className={`ws-step-row ${isStepDone ? 'step-done' : ''}`}
                                onClick={(e) => toggleSubStep(stepKey, e)}
                                role="checkbox"
                                aria-checked={isStepDone}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && toggleSubStep(stepKey, e as unknown as React.MouseEvent)}
                              >
                                <span className={`ws-step-check ${isStepDone ? 'checked' : ''}`}>
                                  {isStepDone ? <Check size={11} strokeWidth={3} /> : sIdx + 1}
                                </span>
                                <div className="ws-step-content">
                                  <span className="ws-step-title">{step.title}</span>
                                  <span className="ws-step-hint">{step.hint}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Target Deliverable Callout */}
                      <div className="ws-deliverable-card">
                        <div className="ws-deliv-badge">
                          <Target size={13} />
                        </div>
                        <div className="ws-deliv-body">
                          <span className="ws-deliv-label">KEY DELIVERABLE TO PRODUCE</span>
                          <span className="ws-deliv-text">{guide.deliverable}</span>
                        </div>
                      </div>

                      {/* Coach Pro-Tip & Sprint Time Split */}
                      <div className="ws-guide-meta-row">
                        <div className="ws-tip-pill">
                          <Lightbulb size={13} className="ws-tip-icon" />
                          <span><strong>Pro Tip:</strong> {guide.tip}</span>
                        </div>
                        <div className="ws-sprint-pill">
                          <Clock size={12} />
                          <span>{guide.sprintTime}</span>
                        </div>
                      </div>

                      {/* Action Footer: Complete Goal Button */}
                      <div className="ws-drawer-footer">
                        <button
                          type="button"
                          className={`ws-btn-complete-goal ${isDone ? 'done' : ''}`}
                          onClick={(e) => handleTaskCheck(task, e)}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 size={15} />
                              <span>Goal Completed · Click to Reopen</span>
                            </>
                          ) : (
                            <>
                              <Check size={15} strokeWidth={2.5} />
                              <span>Mark Goal as Finished</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 2: ALL STAGES (CHRONOLOGICAL ROADMAP WITH EXPANDABLE GOALS)
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
              const pct = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;

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
                        <span>{mDone}/{mTasks.length} Goals Complete ({pct}%)</span>
                        {m.week_range && (
                          <>
                            <span>·</span>
                            <span>{m.week_range}</span>
                          </>
                        )}
                      </div>

                      {/* Linear Mini Progress Bar */}
                      <div className="ws-stage-linear-bar">
                        <div className="ws-linear-fill" style={{ width: `${pct}%` }} />
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
                      <div className="ws-drawer-goals-list">
                        {mTasks.map((t) => {
                          const done = t.done_at != null;
                          const isTaskExp = Boolean(expandedTasks[t.id]);
                          const guide = getGoalGuide(t, roleName);

                          return (
                            <div key={t.id} className={`ws-drawer-goal-box ${done ? 'done' : ''}`}>
                              <div
                                className="ws-drawer-goal-header"
                                onClick={() => toggleTaskExpanded(t.id)}
                              >
                                <button
                                  type="button"
                                  className={`ws-goal-checkbox sm ${done ? 'checked' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskCheck(t, e);
                                  }}
                                  title={done ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  {done ? <Check size={11} strokeWidth={3} /> : null}
                                </button>
                                <span className={`ws-drawer-goal-title ${done ? 'done' : ''}`}>{t.title}</span>
                                <button
                                  type="button"
                                  className={`ws-expand-arrow-btn sm ${isTaskExp ? 'open' : ''}`}
                                  onClick={(e) => toggleTaskExpanded(t.id, e)}
                                  title="View goal details"
                                >
                                  <ChevronDown size={14} className="ws-expand-icon" />
                                </button>
                              </div>

                              {isTaskExp && (
                                <div className="ws-drawer-goal-details">
                                  <p className="ws-drawer-tagline">{guide.tagline}</p>
                                  <div className="ws-drawer-deliv">
                                    <Target size={12} />
                                    <span>{guide.deliverable}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

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
          VIEW 3: WEEKLY HABIT CALENDAR MATRIX
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <section className="ws-calendar-section" aria-label="Weekly matrix">
          <div className="ws-matrix-card">
            <div className="ws-matrix-header">
              <div>
                <h3 className="ws-matrix-title">Weekly Habit Rhythm</h3>
                <p className="ws-matrix-sub">
                  Recommended daily habit pacing for <strong>{roleName}</strong> ({dailyMinutes} min/day commitment).
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
                            {isDone ? '✓ Completed' : 'Scheduled Goal'}
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

/* ── HEADER DASHBOARD ── */
.ws-header-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 20px;
  padding: 22px 24px;
  margin-bottom: 18px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  transition: background 0.25s ease, border-color 0.25s ease;
}

.ws-header-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.ws-header-main {
  flex: 1 1 280px;
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
  color: #2563EB;
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
  font-weight: 850;
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

/* Graphical Gauge */
.ws-header-gauge-block {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 14px;
  padding: 8px 14px;
}

.ws-gauge-wrapper {
  position: relative;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ws-radial-gauge {
  transform: rotate(-90deg);
  width: 54px;
  height: 54px;
}

.ws-gauge-bg {
  stroke: var(--md-outline, #E2E8F0);
}

.ws-gauge-bar {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ws-gauge-val {
  font-size: 12px;
  font-weight: 850;
  color: var(--md-text-primary, #0F172A);
}

.ws-gauge-meta {
  display: flex;
  flex-direction: column;
}

.ws-gauge-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #2563EB;
}

.ws-gauge-sub {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
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
  background: linear-gradient(90deg, #38BDF8, #2563EB, #10B981);
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

.ws-pacing-feedback-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 750;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
  animation: wsBadgeFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

:root[data-theme='dark'] .ws-pacing-feedback-badge,
.dark .ws-pacing-feedback-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #34D399;
  border-color: rgba(52, 211, 153, 0.4);
}

@keyframes wsBadgeFadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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

/* ── GRAPHICAL DAY MOMENTUM BAR ── */
.ws-day-track-bar {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.ws-day-track-label {
  display: flex;
  flex-direction: column;
}

.ws-track-kicker {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #2563EB;
}

.ws-track-sub {
  font-size: 12px;
  color: var(--md-text-secondary, #64748B);
}

.ws-day-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ws-day-pill-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 44px;
  height: 48px;
  border-radius: 10px;
  border: 1px solid var(--md-outline, #E2E8F0);
  background: var(--md-surface-variant, #F8FAFC);
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-day-pill-btn:hover {
  transform: translateY(-2px);
  border-color: #2563EB;
}

.ws-day-pill-btn.active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

.ws-day-pill-btn.done {
  border-color: #10B981;
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.ws-day-pill-btn.done.active {
  background: #10B981;
  color: #FFFFFF;
}

.ws-day-pill-btn.today {
  border-color: #38BDF8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
}

.ws-day-pill-code {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.ws-day-pill-icon {
  font-size: 11px;
  font-weight: 700;
}

.ws-pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38BDF8;
  animation: wsPulse 1.8s infinite;
}

@keyframes wsPulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.4); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

.ws-clear-filter-btn {
  background: transparent;
  border: 1px dashed var(--md-outline, #CBD5E1);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #2563EB;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ws-clear-filter-btn:hover {
  border-color: #2563EB;
  background: rgba(37, 99, 235, 0.05);
}

/* ── STAGE BANNER ── */
.ws-stage-banner {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.ws-stage-banner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.ws-stage-pill {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #2563EB;
  text-transform: uppercase;
}

.ws-stage-banner-title {
  margin: 2px 0 0;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--md-text-primary, #0F172A);
}

.ws-expand-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--md-surface-variant, #F1F5F9);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}
.ws-expand-all-btn:hover {
  background: var(--md-outline, #E2E8F0);
  color: var(--md-text-primary, #0F172A);
}

.ws-skill-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.ws-skill-pill {
  font-size: 10px;
  font-weight: 600;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  padding: 2px 8px;
  border-radius: 6px;
}

/* ── EXPANDABLE GOAL CARDS ── */
.ws-goals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws-goal-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.ws-goal-card:hover {
  border-color: #93C5FD;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.06);
}

.ws-goal-card.expanded {
  border-color: #60A5FA;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.08);
}

.ws-goal-card.completed {
  border-left: 3px solid #10B981;
}

.ws-goal-header {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.ws-goal-header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.ws-goal-checkbox {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 7px;
  border: 2px solid var(--md-outline, #CBD5E1);
  background: var(--md-surface, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  cursor: pointer;
  margin-top: 2px;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-goal-checkbox:hover {
  border-color: #2563EB;
}

.ws-goal-checkbox.checked {
  background: #10B981;
  border-color: #10B981;
}

.ws-goal-meta-block {
  flex: 1;
}

.ws-goal-kicker-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.ws-day-chip {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--md-text-muted, #94A3B8);
}

.ws-type-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 1.5px 7px;
  border-radius: 5px;
}

.ws-time-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--md-text-muted, #94A3B8);
}

.ws-done-tag {
  font-size: 9.5px;
  font-weight: 800;
  color: #10B981;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.ws-goal-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--md-text-primary, #0F172A);
  letter-spacing: -0.01em;
}

.ws-goal-title.done {
  color: var(--md-text-muted, #94A3B8);
  text-decoration: line-through;
}

.ws-expand-arrow-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--md-outline, #E2E8F0);
  background: var(--md-surface-variant, #F8FAFC);
  color: var(--md-text-secondary, #64748B);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-expand-arrow-btn:hover {
  background: #EFF6FF;
  border-color: #93C5FD;
  color: #2563EB;
  transform: translateY(-1px);
}

.ws-expand-icon {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ws-expand-arrow-btn.open .ws-expand-icon {
  transform: rotate(180deg);
}

/* ── GOAL DETAIL DRAWER ── */
.ws-goal-drawer {
  padding: 0 18px 18px 18px;
  border-top: 1px solid var(--md-outline, #F1F5F9);
  animation: wsDrawerSlide 0.22s ease-out;
}

@keyframes wsDrawerSlide {
  0% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}

.ws-guide-banner {
  background: rgba(37, 99, 235, 0.04);
  border-left: 3px solid #2563EB;
  border-radius: 0 8px 8px 0;
  padding: 8px 12px;
  margin: 12px 0 14px;
}

.ws-guide-summary {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--md-text-primary, #1E293B);
}

.ws-guide-section {
  margin-bottom: 14px;
}

.ws-guide-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ws-guide-section-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: var(--md-text-secondary, #475569);
  text-transform: uppercase;
}

.ws-guide-sec-icon {
  color: #2563EB;
}

.ws-guide-steps-count {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--md-text-muted, #94A3B8);
}

.ws-steps-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ws-step-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ws-step-row:hover {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.ws-step-row.step-done {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.ws-step-check {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 5px;
  border: 1.5px solid var(--md-outline, #CBD5E1);
  background: var(--md-surface, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9.5px;
  font-weight: 800;
  color: var(--md-text-secondary, #64748B);
  margin-top: 1px;
}

.ws-step-check.checked {
  background: #10B981;
  border-color: #10B981;
  color: #FFFFFF;
}

.ws-step-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ws-step-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--md-text-primary, #0F172A);
}

.ws-step-row.step-done .ws-step-title {
  text-decoration: line-through;
  color: var(--md-text-muted, #94A3B8);
}

.ws-step-hint {
  font-size: 11px;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.35;
}

/* Deliverable Card */
.ws-deliverable-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.ws-deliv-badge {
  color: #059669;
  margin-top: 2px;
}

.ws-deliv-body {
  display: flex;
  flex-direction: column;
}

.ws-deliv-label {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #059669;
}

.ws-deliv-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-primary, #0F172A);
  margin-top: 1px;
}

/* Coach Pro-Tip & Sprint Time */
.ws-guide-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.ws-tip-pill {
  flex: 1 1 240px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11.5px;
  color: var(--md-text-secondary, #475569);
  line-height: 1.4;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 6px 10px;
}

.ws-tip-icon {
  color: #D97706;
  min-width: 13px;
  margin-top: 2px;
}

.ws-sprint-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  background: var(--md-surface-variant, #F1F5F9);
  padding: 4px 8px;
  border-radius: 6px;
}

/* Drawer Footer */
.ws-drawer-footer {
  display: flex;
  justify-content: flex-end;
}

.ws-btn-complete-goal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: #2563EB;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
  transition: all 0.15s ease;
}

.ws-btn-complete-goal:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
}

.ws-btn-complete-goal.done {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: none;
}
.ws-btn-complete-goal.done:hover {
  background: rgba(16, 185, 129, 0.2);
  transform: none;
}

/* ── VIEW 2: ALL STAGES STYLES ── */
.ws-stages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws-stage-row-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.ws-stage-row-card:hover {
  border-color: #93C5FD;
}

.ws-stage-row-card.current {
  border-color: #2563EB;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
}

.ws-stage-row-card.finished {
  border-color: rgba(16, 185, 129, 0.3);
}

.ws-stage-row-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}

.ws-stage-num-badge {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-primary, #0F172A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}

.ws-stage-row-card.current .ws-stage-num-badge {
  background: #2563EB;
  color: #FFFFFF;
}

.ws-stage-row-card.finished .ws-stage-num-badge {
  background: #10B981;
  color: #FFFFFF;
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
  font-size: 15px;
  font-weight: 700;
  color: var(--md-text-primary, #0F172A);
}

.ws-active-pill {
  font-size: 9.5px;
  font-weight: 800;
  background: #2563EB;
  color: #FFFFFF;
  padding: 1px 7px;
  border-radius: 9999px;
}

.ws-done-pill {
  font-size: 9.5px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  padding: 1px 7px;
  border-radius: 9999px;
}

.ws-stage-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--md-text-secondary, #64748B);
  margin-bottom: 6px;
}

.ws-stage-linear-bar {
  width: 100%;
  height: 4px;
  background: var(--md-surface-variant, #F1F5F9);
  border-radius: 9999px;
  overflow: hidden;
}

.ws-linear-fill {
  height: 100%;
  background: linear-gradient(90deg, #38BDF8, #10B981);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.ws-stage-tasks-drawer {
  padding: 12px 20px 18px;
  border-top: 1px solid var(--md-outline, #F1F5F9);
  background: var(--md-surface-variant, #FAFAFA);
}

.ws-drawer-goals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ws-drawer-goal-box {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 10px;
  padding: 10px 12px;
}

.ws-drawer-goal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.ws-goal-checkbox.sm {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 5px;
}

.ws-drawer-goal-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary, #0F172A);
}

.ws-drawer-goal-title.done {
  text-decoration: line-through;
  color: var(--md-text-muted, #94A3B8);
}

.ws-expand-arrow-btn.sm {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.ws-drawer-goal-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--md-outline, #E2E8F0);
}

.ws-drawer-tagline {
  margin: 0 0 6px;
  font-size: 11.5px;
  color: var(--md-text-secondary, #475569);
  line-height: 1.4;
}

.ws-drawer-deliv {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  padding: 2px 8px;
  border-radius: 5px;
}

/* ── VIEW 3: MATRIX STYLES ── */
.ws-matrix-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 18px;
  padding: 22px;
}

.ws-matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.ws-matrix-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-matrix-sub {
  margin: 4px 0 0;
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
  padding: 5px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.ws-matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
  gap: 10px;
}

.ws-matrix-col {
  background: var(--md-surface-variant, #F8FAFC);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ws-matrix-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ws-matrix-day-abbr {
  font-size: 11px;
  font-weight: 800;
  color: var(--md-text-primary, #0F172A);
}

.ws-matrix-day-mins {
  font-size: 10px;
  font-weight: 700;
  color: var(--md-text-muted, #94A3B8);
}

.ws-matrix-slot {
  border-radius: 8px;
  padding: 8px;
  font-size: 11px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ws-matrix-slot.completed {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #047857;
}

.ws-matrix-slot.active {
  background: #FFFFFF;
  border: 1px solid #93C5FD;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
}

.ws-matrix-slot.rest {
  background: transparent;
  border: 1px dashed var(--md-outline, #CBD5E1);
  color: var(--md-text-muted, #94A3B8);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.ws-slot-status {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.ws-slot-title {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--md-text-primary, #0F172A);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DARK MODE OVERRIDES
═══════════════════════════════════════════════════════════════════════════════ */
:root.dark .ws-header-card,
[data-theme='dark'] .ws-header-card,
body.dark .ws-header-card,
:root.dark .ws-view-switcher,
[data-theme='dark'] .ws-view-switcher,
body.dark .ws-view-switcher,
:root.dark .ws-day-track-bar,
[data-theme='dark'] .ws-day-track-bar,
body.dark .ws-day-track-bar,
:root.dark .ws-stage-banner,
[data-theme='dark'] .ws-stage-banner,
body.dark .ws-stage-banner,
:root.dark .ws-goal-card,
[data-theme='dark'] .ws-goal-card,
body.dark .ws-goal-card,
:root.dark .ws-stage-row-card,
[data-theme='dark'] .ws-stage-row-card,
body.dark .ws-stage-row-card,
:root.dark .ws-matrix-card,
[data-theme='dark'] .ws-matrix-card,
body.dark .ws-matrix-card {
  background: #0F172A;
  border-color: #1E293B;
  color: #F8FAFC;
}

:root.dark .ws-header-gauge-block,
[data-theme='dark'] .ws-header-gauge-block,
body.dark .ws-header-gauge-block,
:root.dark .ws-day-pill-btn,
[data-theme='dark'] .ws-day-pill-btn,
body.dark .ws-day-pill-btn,
:root.dark .ws-expand-arrow-btn,
[data-theme='dark'] .ws-expand-arrow-btn,
body.dark .ws-expand-arrow-btn,
:root.dark .ws-step-row,
[data-theme='dark'] .ws-step-row,
body.dark .ws-step-row,
:root.dark .ws-drawer-goal-box,
[data-theme='dark'] .ws-drawer-goal-box,
body.dark .ws-drawer-goal-box,
:root.dark .ws-matrix-col,
[data-theme='dark'] .ws-matrix-col,
body.dark .ws-matrix-col {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}

:root.dark .ws-tab-btn.active,
[data-theme='dark'] .ws-tab-btn.active,
body.dark .ws-tab-btn.active {
  background: #1E293B;
  color: #60A5FA;
}

:root.dark .ws-goal-checkbox,
[data-theme='dark'] .ws-goal-checkbox,
body.dark .ws-goal-checkbox,
:root.dark .ws-step-check,
[data-theme='dark'] .ws-step-check,
body.dark .ws-step-check {
  background: #0F172A;
  border-color: #475569;
}

:root.dark .ws-goal-checkbox.checked,
[data-theme='dark'] .ws-goal-checkbox.checked,
body.dark .ws-goal-checkbox.checked,
:root.dark .ws-step-check.checked,
[data-theme='dark'] .ws-step-check.checked,
body.dark .ws-step-check.checked {
  background: #10B981;
  border-color: #10B981;
}

:root.dark .ws-guide-banner,
[data-theme='dark'] .ws-guide-banner,
body.dark .ws-guide-banner {
  background: rgba(37, 99, 235, 0.12);
}

:root.dark .ws-guide-summary,
[data-theme='dark'] .ws-guide-summary,
body.dark .ws-guide-summary {
  color: #E2E8F0;
}

:root.dark .ws-stage-tasks-drawer,
[data-theme='dark'] .ws-stage-tasks-drawer,
body.dark .ws-stage-tasks-drawer {
  background: #0B1120;
  border-color: #1E293B;
}

:root.dark .ws-header-role,
[data-theme='dark'] .ws-header-role,
body.dark .ws-header-role,
:root.dark .ws-stage-banner-title,
[data-theme='dark'] .ws-stage-banner-title,
body.dark .ws-stage-banner-title,
:root.dark .ws-goal-title,
[data-theme='dark'] .ws-goal-title,
body.dark .ws-goal-title,
:root.dark .ws-step-title,
[data-theme='dark'] .ws-step-title,
body.dark .ws-step-title,
:root.dark .ws-deliv-text,
[data-theme='dark'] .ws-deliv-text,
body.dark .ws-deliv-text,
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

:root.dark .ws-matrix-slot.active,
[data-theme='dark'] .ws-matrix-slot.active,
body.dark .ws-matrix-slot.active {
  background: #1E293B;
  border-color: #3B82F6;
}

:root.dark .ws-matrix-slot.completed,
[data-theme='dark'] .ws-matrix-slot.completed,
body.dark .ws-matrix-slot.completed {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10B981;
  color: #34D399;
}
`;
