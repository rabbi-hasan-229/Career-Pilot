import React, { useState, useEffect } from 'react';
import {
  Check,
  Circle,
  Sparkles,
  Trophy,
  Bell,
  Calendar,
  Flame,
  ChevronRight,
  Compass,
  Monitor,
  Users,
  Briefcase,
  Layers,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { notificationService } from '../notifications/notificationService';
import type { Task, Milestone, Profile } from '../../types';

interface Props {
  milestones: Milestone[];
  tasks: Task[];
  profile: Profile;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenGoalSettings: () => void;
  onOpenNotifications: () => void;
}

export const RoadHighwayView: React.FC<Props> = ({
  milestones,
  tasks,
  profile,
  onToggleTaskComplete,
  onOpenGoalSettings,
  onOpenNotifications,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<'all' | number>('all');
  const [reminderFreq, setReminderFreq] = useState<'2x' | '3x' | '4x'>(() =>
    notificationService.getWeeklyReminderFrequency()
  );
  const [isReminderTesting, setIsReminderTesting] = useState(false);

  // Dynamic scroll-driven moving road effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setScrollProgress(scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate overall stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done_at != null).length;
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Active milestone (first milestone that is not fully done)
  const activeMilestone =
    milestones.find((m) => {
      const mTasks = tasks.filter((t) => t.milestone_id === m.id);
      return mTasks.some((t) => t.done_at == null);
    }) || milestones[milestones.length - 1];

  const activeMilestoneTasks = tasks.filter(
    (t) => t.milestone_id === (activeMilestone?.id || '')
  );
  const unfinishedActiveTasksCount = activeMilestoneTasks.filter((t) => t.done_at == null).length;

  // Phase / Sprint Calculation (e.g. 6 weeks per phase)
  const totalWeeks = milestones.length;
  const weeksPerPhase = 6;
  const phaseCount = Math.max(1, Math.ceil(totalWeeks / weeksPerPhase));

  const displayedMilestones =
    selectedPhase === 'all'
      ? milestones
      : milestones.slice(
          (selectedPhase - 1) * weeksPerPhase,
          selectedPhase * weeksPerPhase
        );

  // Handle task click with celebratory confetti
  const handleGoalTap = (task: Task, e: React.MouseEvent<HTMLDivElement>) => {
    const isCurrentlyDone = task.done_at != null;
    onToggleTaskComplete(task.id);

    if (!isCurrentlyDone) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: ['#8EA95B', '#F97316', '#38BDF8', '#FBBF24', '#A855F7'],
        disableForReducedMotion: true,
      });
    }
  };

  // Trigger test weekly reminder
  const handleTestWeeklyReminder = async () => {
    setIsReminderTesting(true);
    await notificationService.triggerWeeklyReminder(tasks, activeMilestone, profile);
    setTimeout(() => setIsReminderTesting(false), 2000);
  };

  const handleFrequencyChange = (freq: '2x' | '3x' | '4x') => {
    setReminderFreq(freq);
    notificationService.setWeeklyReminderFrequency(freq);
  };

  // Title formatting
  const roleTitle = profile.target_role || 'UI/UX Designer';
  const roleWords = roleTitle.split(' ');
  const titlePrefix =
    roleWords.slice(0, Math.min(2, roleWords.length - 1)).join(' ') || roleWords[0];
  const titleSuffix =
    roleWords.length > 1
      ? roleWords.slice(Math.min(2, roleWords.length - 1)).join(' ')
      : 'SPECIALIST';

  const categoryIcons = [Compass, Layers, Monitor, Briefcase, Users, Trophy];

  // Dynamic SVG Serpentine Geometry
  const START_Y = 160;
  const STEP_Y = 250;
  const PIN_RIGHT_X = 620;
  const PIN_LEFT_X = 380;
  const nodeCount = displayedMilestones.length;

  const nodes = displayedMilestones.map((m, idx) => {
    const pinX = idx % 2 === 0 ? PIN_RIGHT_X : PIN_LEFT_X;
    const pinY = START_Y + idx * STEP_Y;
    const weekNum = m.position || idx + 1;
    return {
      id: m.id,
      milestone: m,
      x: pinX,
      y: pinY,
      weekNum,
      label: String(weekNum).padStart(2, '0'),
      isRightSide: idx % 2 === 0,
    };
  });

  const finishY = nodeCount > 0 ? START_Y + nodeCount * STEP_Y + 120 : 600;
  const totalSvgHeight = finishY + 180;

  // Build mathematical smooth S-curve highway path
  let roadPathD = '';
  if (nodeCount > 0) {
    const firstNode = nodes[0];
    roadPathD = `M 500,20 C 500,70 ${firstNode.x},80 ${firstNode.x},${firstNode.y}`;

    for (let i = 1; i < nodeCount; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const midY = (prev.y + curr.y) / 2;
      roadPathD += ` C ${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
    }

    const last = nodes[nodeCount - 1];
    roadPathD += ` C ${last.x},${last.y + 70} 500,${last.y + 70} 500,${finishY}`;
  }

  return (
    <div
      style={{
        maxWidth: '1060px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '80px',
        position: 'relative',
      }}
    >
      {/* ============================================================== */}
      {/* 1. HERO HEADER                                                 */}
      {/* ============================================================== */}
      <div style={{ textAlign: 'center', padding: '24px 16px 14px 16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(142, 169, 91, 0.12)',
            border: '1px solid rgba(142, 169, 91, 0.25)',
            borderRadius: '9999px',
            padding: '4px 14px',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#5C7433',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            1 WEEK PER GOAL · CAREER ROADMAP
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#EA580C',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Flame size={13} />
            {profile.streak_days}d Streak
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: '0 0 6px 0',
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #8EA95B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              marginRight: '8px',
            }}
          >
            {titlePrefix}
          </span>
          <span style={{ color: '#0F172A' }}>{titleSuffix} ROADMAP</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(13px, 2vw, 15.5px)',
            color: '#64748B',
            fontWeight: 500,
            margin: '0 0 16px 0',
            letterSpacing: '-0.01em',
          }}
        >
          {totalWeeks}-Week Practical Progression to Becoming a{' '}
          <strong style={{ color: '#0F172A', fontWeight: 800 }}>Job-Ready</strong> {roleTitle}
        </p>

        {/* Progress & Quick Goal Switcher Bar */}
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '12px 18px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              <span>
                Roadmap Progress: {completedTasks}/{totalTasks} Goals Completed
              </span>
              <span style={{ color: '#8EA95B', fontWeight: 800 }}>{overallPct}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '9999px',
                background: '#E2E8F0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${overallPct}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #8EA95B 0%, #10B981 100%)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGoalSettings}
            style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1E293B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            Change Goal
            <ChevronRight size={14} />
          </button>
        </div>

        {/* SPRINT / PHASE SELECTOR PILLS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              border: selectedPhase === 'all' ? '1.5px solid #8EA95B' : '1px solid #E2E8F0',
              background: selectedPhase === 'all' ? '#8EA95B' : '#FFFFFF',
              color: selectedPhase === 'all' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              boxShadow: selectedPhase === 'all' ? '0 2px 8px rgba(142, 169, 91, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Full Journey ({totalWeeks} Weeks)
          </button>

          {Array.from({ length: phaseCount }).map((_, pIdx) => {
            const phaseNum = pIdx + 1;
            const startW = (phaseNum - 1) * weeksPerPhase + 1;
            const endW = Math.min(totalWeeks, phaseNum * weeksPerPhase);
            const isSelected = selectedPhase === phaseNum;

            return (
              <button
                key={phaseNum}
                type="button"
                onClick={() => setSelectedPhase(phaseNum)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: isSelected ? '1.5px solid #8EA95B' : '1px solid #E2E8F0',
                  background: isSelected ? '#8EA95B' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(142, 169, 91, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sprint {phaseNum}: Weeks {startW}–{endW}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MULTIPLE WEEKLY REMINDERS BANNER                            */}
      {/* ============================================================== */}
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto 28px auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background: unfinishedActiveTasksCount > 0 ? '#FFFBEB' : '#F0FDF4',
            border: `1px solid ${unfinishedActiveTasksCount > 0 ? '#FDE68A' : '#BBF7D0'}`,
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: unfinishedActiveTasksCount > 0 ? '#F59E0B' : '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13px', color: '#1E293B' }}>
                  Weekly Cadence: {reminderFreq.toUpperCase()} Active (
                  {notificationService
                    .getWeeklyReminderDays(reminderFreq)
                    .map((d) => d.split(' ')[0])
                    .join(', ')}
                  )
                </strong>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: unfinishedActiveTasksCount > 0 ? '#FEF3C7' : '#DCFCE7',
                    color: unfinishedActiveTasksCount > 0 ? '#B45309' : '#15803D',
                  }}
                >
                  {unfinishedActiveTasksCount > 0
                    ? `${unfinishedActiveTasksCount} Unfinished`
                    : 'All Caught Up'}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                {unfinishedActiveTasksCount > 0
                  ? `You have unfinished goals for ${activeMilestone?.title || 'this week'}. Reminders trigger multiple times per week.`
                  : `Terrific progress! All weekly goals for ${activeMilestone?.title || 'this stage'} are complete.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Frequency Selector */}
            <div
              style={{
                display: 'flex',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '2px',
              }}
            >
              {(['2x', '3x', '4x'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFrequencyChange(f)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: reminderFreq === f ? '#8EA95B' : 'transparent',
                    color: reminderFreq === f ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleTestWeeklyReminder}
              disabled={isReminderTesting}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Bell size={13} color="#F97316" />
              {isReminderTesting ? 'Push Sent!' : 'Test Push'}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. THE WINDING PERSPECTIVE HIGHWAY ROAD                        */}
      {/* ============================================================== */}
      <div
        className="highway-road-container"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: `${totalSvgHeight}px`,
        }}
      >
        {/* SVG Road Layer (Desktop & Tablet) */}
        <svg
          className="desktop-highway-svg"
          viewBox={`0 0 1000 ${totalSvgHeight}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${totalSvgHeight}px`,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <defs>
            <linearGradient id="asphaltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <filter id="roadShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="24" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.18" />
            </filter>

            <radialGradient id="pinShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(15, 23, 42, 0.45)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
          </defs>

          {/* Continuous Serpentine Road Curves */}
          {/* Outer Curb 3D Edge */}
          <path
            d={roadPathD}
            fill="none"
            stroke="#090D16"
            strokeWidth="110"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#roadShadow)"
          />

          {/* Main Dark Asphalt Highway Surface */}
          <path
            d={roadPathD}
            fill="none"
            stroke="url(#asphaltGradient)"
            strokeWidth="96"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Road Borders (Highway Curbs) */}
          <path
            d={roadPathD}
            fill="none"
            stroke="#334155"
            strokeWidth="92"
            strokeDasharray="4 8"
            opacity="0.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* White Dashed Center Lane Divider: Animated Scroll Offset creates the moving road effect! */}
          <path
            d={roadPathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeDasharray="14 14"
            strokeDashoffset={-scrollProgress * 0.9}
            strokeLinecap="round"
            opacity="0.95"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />

          {/* Dotted Horizontal Branch Lines connecting Pins to Cards */}
          {nodes.map((node) => (
            <line
              key={`branch-${node.id}`}
              x1={node.x}
              y1={node.y}
              x2={node.isRightSide ? node.x + 90 : node.x - 90}
              y2={node.y}
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeDasharray="5 5"
            />
          ))}

          {/* Numbered Pins directly planted into the road */}
          {nodes.map((pin) => {
            const m = pin.milestone;
            const mTasks = tasks.filter((t) => t.milestone_id === m.id);
            const isDone = mTasks.length > 0 && mTasks.every((t) => t.done_at != null);
            const isDoing = !isDone && m.id === activeMilestone?.id;

            return (
              <g key={`pin-${pin.id}`}>
                {/* Pin Shadow on Asphalt */}
                <ellipse cx={pin.x} cy={pin.y + 26} rx="20" ry="7" fill="url(#pinShadow)" />

                {/* Vertical Stem */}
                <line
                  x1={pin.x}
                  y1={pin.y}
                  x2={pin.x}
                  y2={pin.y + 24}
                  stroke="#475569"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Outer Glow Ring if Doing */}
                {isDoing && (
                  <circle
                    cx={pin.x}
                    cy={pin.y}
                    r="28"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    opacity="0.75"
                    className="road-pin-pulse"
                  />
                )}

                {/* Main Circular Badge */}
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r="21"
                  fill={isDone ? '#8EA95B' : isDoing ? '#38BDF8' : '#1E293B'}
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
                />

                {/* Pin Text Number or Checkmark */}
                {isDone ? (
                  <text
                    x={pin.x}
                    y={pin.y + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    ✓
                  </text>
                ) : (
                  <text
                    x={pin.x}
                    y={pin.y + 5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="12.5"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    {pin.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ============================================================== */}
        {/* 4. ALTERNATING 1-WEEK GOAL CARDS                               */}
        {/* ============================================================== */}
        <div className="highway-milestone-nodes-wrap">
          {nodes.map((node, idx) => {
            const m = node.milestone;
            const mTasks = tasks.filter((t) => t.milestone_id === m.id);
            const mCompletedCount = mTasks.filter((t) => t.done_at != null).length;
            const isAllDone = mTasks.length > 0 && mCompletedCount === mTasks.length;
            const isCurrent = m.id === activeMilestone?.id;
            const IconComponent = categoryIcons[idx % categoryIcons.length] || Target;

            return (
              <div
                key={m.id}
                className={`highway-milestone-row ${
                  node.isRightSide ? 'side-right' : 'side-left'
                } ${isAllDone ? 'is-milestone-complete' : ''} ${
                  isCurrent ? 'is-milestone-active' : ''
                }`}
                style={{
                  top: `${node.y - 75}px`,
                }}
              >
                {/* Mobile Road Pin Marker */}
                <div className="mobile-road-pin-badge">
                  <span
                    className={`mobile-pin-circle ${
                      isAllDone ? 'done' : isCurrent ? 'active' : ''
                    }`}
                  >
                    {isAllDone ? <Check size={14} strokeWidth={3} /> : node.label}
                  </span>
                  <div className="mobile-pin-stem" />
                </div>

                {/* 1-Week Goal Card */}
                <div
                  className="highway-card"
                  style={{
                    background: isAllDone ? '#F0FDF4' : '#FFFFFF',
                    border: `1.5px solid ${
                      isAllDone ? '#86EFAC' : isCurrent ? '#8EA95B' : '#E2E8F0'
                    }`,
                    borderRadius: '20px',
                    padding: '16px 18px',
                    boxShadow: isCurrent
                      ? '0 12px 30px rgba(142, 169, 91, 0.15)'
                      : '0 4px 16px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header: 1 Week Goal */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: isAllDone
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(99, 102, 241, 0.12)',
                          color: isAllDone ? '#10B981' : '#6366F1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#64748B',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          WEEK {node.label} · 1-WEEK GOAL ({m.effort_hours}h Pacing)
                        </span>
                        <h3
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 900,
                            color: isAllDone ? '#166534' : '#0F172A',
                            margin: 0,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.3,
                          }}
                        >
                          {m.title}
                        </h3>
                      </div>
                    </div>

                    {/* Progress pill */}
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isAllDone
                          ? '#DCFCE7'
                          : isCurrent
                          ? 'rgba(142, 169, 91, 0.15)'
                          : '#F1F5F9',
                        color: isAllDone ? '#15803D' : isCurrent ? '#5C7433' : '#64748B',
                        flexShrink: 0,
                      }}
                    >
                      {isAllDone
                        ? '✓ Week Complete'
                        : `${mCompletedCount}/${mTasks.length} Done`}
                    </span>
                  </div>

                  {/* Tasks / Deliverables Checklist for this 1-Week Goal */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mTasks.map((t) => {
                      const isDone = t.done_at != null;
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => handleGoalTap(t, e)}
                          role="button"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '10px',
                            background: isDone ? 'rgba(240, 253, 244, 0.8)' : '#F8FAFC',
                            border: `1px solid ${isDone ? '#BBF7D0' : '#F1F5F9'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Checkbox Icon */}
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isDone ? '#10B981' : '#FFFFFF',
                              border: `1.5px solid ${isDone ? '#10B981' : '#94A3B8'}`,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: isDone
                                ? '0 2px 6px rgba(16, 185, 129, 0.35)'
                                : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isDone ? (
                              <Check size={12} strokeWidth={3} />
                            ) : (
                              <Circle size={8} fill="#CBD5E1" stroke="none" />
                            )}
                          </div>

                          {/* Task Title */}
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: isDone ? 600 : 700,
                              color: isDone ? '#64748B' : '#1E293B',
                              textDecoration: isDone ? 'line-through' : 'none',
                              lineHeight: 1.3,
                              flex: 1,
                            }}
                          >
                            {t.title}
                          </span>

                          {/* Task Action Tag */}
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: isDone ? '#10B981' : '#64748B',
                              background: isDone ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          >
                            {t.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Skills Covered in this 1-Week Goal */}
                  {m.skills_covered && m.skills_covered.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexWrap: 'wrap',
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      {m.skills_covered.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          #{skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* 5. FINISH LINE SUMMIT                                          */}
        {/* ============================================================== */}
        <div
          className="finish-line-summit"
          style={{
            position: 'absolute',
            top: `${finishY - 20}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '520px',
            textAlign: 'center',
          }}
        >
          {/* Checkered Finish Line Banner */}
          <div
            style={{
              width: '100%',
              height: '16px',
              borderRadius: '6px',
              background:
                'repeating-linear-gradient(45deg, #0F172A, #0F172A 12px, #FFFFFF 12px, #FFFFFF 24px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '14px',
            }}
          />

          <div
            style={{
              background: '#FFFFFF',
              border: '2px solid #8EA95B',
              borderRadius: '24px',
              padding: '22px 20px',
              boxShadow: '0 15px 40px rgba(142, 169, 91, 0.25)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
                boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Trophy size={26} />
            </div>

            <h3
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#0F172A',
                margin: '0 0 4px 0',
                textTransform: 'uppercase',
              }}
            >
              🏁 Job-Ready Finish Line Summit
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 14px 0' }}>
              Complete each 1-week goal on this highway to master all {totalTasks} job-ready
              deliverables and launch your career as a {roleTitle}.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  confetti({
                    particleCount: 80,
                    spread: 80,
                    origin: { y: 0.8 },
                    colors: ['#8EA95B', '#F59E0B', '#38BDF8'],
                  });
                }}
                style={{
                  background: '#8EA95B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '9px 18px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(142, 169, 91, 0.35)',
                }}
              >
                <Sparkles size={15} />
                Celebrate Progress
              </button>

              <button
                type="button"
                onClick={onOpenNotifications}
                style={{
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={14} />
                Weekly Reminders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
