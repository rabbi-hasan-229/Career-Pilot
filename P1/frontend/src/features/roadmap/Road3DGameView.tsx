import React, { useState, useCallback, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { Bell } from 'lucide-react';
import type { Milestone, Task, Profile } from '../../types';
import { notificationService } from '../notifications/notificationService';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  milestones: Milestone[];
  tasks: Task[];
  profile: Profile | null;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenGoalSettings: () => void;
  onOpenNotifications: () => void;
}

// ─── Icon Types ────────────────────────────────────────────────────────────────
type IconName = 'user' | 'monitor' | 'star' | 'bag' | 'team' | 'target' | 'spark' | 'layers' | 'flag' | 'trophy';

const MILESTONE_ICONS: IconName[] = ['user', 'monitor', 'star', 'bag', 'team', 'target', 'layers', 'spark', 'flag', 'trophy'];

// ─── Sizing Constants ──────────────────────────────────────────────────────────
// Desktop Coordinate System (generous, wide, readable)
const DESKTOP_REF_WIDTH = 960;
const DESKTOP_START_Y = 195;
const DESKTOP_STEP_Y = 220;
const DESKTOP_LEFT_PIN_X = 365;
const DESKTOP_RIGHT_PIN_X = 595;
const DESKTOP_CARD_WIDTH = 325;
const DESKTOP_LEFT_CARD_X = 22;
const DESKTOP_RIGHT_CARD_X = 615;

// Mobile Coordinate System (edge-to-edge, compact, readable, clean gap between pin and card)
const MOBILE_REF_WIDTH = 420;
const MOBILE_START_Y = 165;
const MOBILE_STEP_Y = 240;
const MOBILE_LEFT_PIN_X = 176;
const MOBILE_RIGHT_PIN_X = 244;
const MOBILE_CARD_WIDTH = 150;
const MOBILE_LEFT_CARD_X = 6;
const MOBILE_RIGHT_CARD_X = 264;

// ─── Dual-Tone Car Horn Sound Synthesizer ───────────────────────────────────────
function playCarHorn() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(420, ctx.currentTime); // F4
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(530, ctx.currentTime); // C5 (warm major chord)

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.38);
    osc2.stop(ctx.currentTime + 0.38);
  } catch {
    // Ignore audio restrictions
  }
}

// ─── S-Curve Road Path Generator ───────────────────────────────────────────────
function generateRoadPath(count: number, isMobile: boolean): { path: string; totalHeight: number } {
  const refWidth = isMobile ? MOBILE_REF_WIDTH : DESKTOP_REF_WIDTH;
  const startY = isMobile ? MOBILE_START_Y : DESKTOP_START_Y;
  const stepY = isMobile ? MOBILE_STEP_Y : DESKTOP_STEP_Y;
  const leftX = isMobile ? MOBILE_LEFT_PIN_X : DESKTOP_LEFT_PIN_X;
  const rightX = isMobile ? MOBILE_RIGHT_PIN_X : DESKTOP_RIGHT_PIN_X;
  const centerX = refWidth / 2;

  // Road start at top center (underneath header banner)
  const topRoadY = startY - (isMobile ? 70 : 85);
  let d = `M ${centerX} ${topRoadY}`;

  if (count === 0) {
    d += ` L ${centerX} ${topRoadY + 200}`;
    return { path: d, totalHeight: topRoadY + 240 };
  }

  // Curve to first milestone pin (index 0 is on the right side)
  const firstPinX = rightX;
  const firstPinY = startY;
  const initDy = firstPinY - topRoadY;
  d += ` C ${centerX + (isMobile ? 18 : 45)} ${topRoadY + initDy * 0.42}, ${firstPinX + (isMobile ? 8 : 28)} ${firstPinY - initDy * 0.42}, ${firstPinX} ${firstPinY}`;

  // Winding S-curve through all milestones
  for (let i = 0; i < count - 1; i += 1) {
    const fromX = i % 2 === 0 ? rightX : leftX;
    const fromY = startY + i * stepY;
    const toX = (i + 1) % 2 === 0 ? rightX : leftX;
    const toY = startY + (i + 1) * stepY;
    const dy = toY - fromY;

    // Control points curve outward around each milestone apex
    const cp1X = fromX + (fromX > centerX ? (isMobile ? 14 : 38) : (isMobile ? -14 : -38));
    const cp1Y = fromY + dy * 0.46;
    const cp2X = toX + (toX > centerX ? (isMobile ? 14 : 38) : (isMobile ? -14 : -38));
    const cp2Y = toY - dy * 0.46;

    d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`;
  }

  // Smooth tail off the bottom of the board
  const lastIndex = count - 1;
  const lastPinX = lastIndex % 2 === 0 ? rightX : leftX;
  const lastPinY = startY + lastIndex * stepY;
  const exitY = lastPinY + (isMobile ? 90 : 120);

  d += ` C ${lastPinX + (lastPinX > centerX ? (isMobile ? 8 : 20) : (isMobile ? -8 : -20))} ${lastPinY + 45}, ${centerX} ${exitY - 30}, ${centerX} ${exitY}`;

  return { path: d, totalHeight: exitY + 30 };
}

// ─── Pilot Roadster (High-Tech Highway Car) ────────────────────────────────────
function PilotRoadster({ isFinished }: { isFinished?: boolean }) {
  return (
    <div className="rp-car-wrapper">
      {/* Headlights beam casting forward onto the dark asphalt road */}
      <div className="rp-car-headlights" aria-hidden="true" />

      {/* Sleek Aerodynamic Sports Roadster Vector */}
      <svg
        viewBox="0 0 54 96"
        className="rp-car-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rp-car-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <linearGradient id="rp-car-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#1E293B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Shadow underneath car */}
        <ellipse cx="27" cy="50" rx="23" ry="42" fill="rgba(0,0,0,0.6)" />

        {/* 4 Tires with Alloy Rims */}
        <rect x="2" y="16" width="6" height="15" rx="3" fill="#0A0F1D" />
        <rect x="3" y="19" width="4" height="9" rx="1.5" fill="#94A3B8" />
        <rect x="46" y="16" width="6" height="15" rx="3" fill="#0A0F1D" />
        <rect x="47" y="19" width="4" height="9" rx="1.5" fill="#94A3B8" />
        <rect x="2" y="65" width="6" height="17" rx="3" fill="#0A0F1D" />
        <rect x="3" y="68" width="4" height="11" rx="1.5" fill="#94A3B8" />
        <rect x="46" y="65" width="6" height="17" rx="3" fill="#0A0F1D" />
        <rect x="47" y="68" width="4" height="11" rx="1.5" fill="#94A3B8" />

        {/* Aerodynamic Chassis */}
        <path
          d="M14 8C19 4 35 4 40 8L44 24C46 34 46 62 43 78L40 88C35 91 19 91 14 88L11 78C8 62 8 34 10 24L14 8Z"
          fill="url(#rp-car-body)"
          stroke="#60A5FA"
          strokeWidth="1.2"
        />

        {/* Carbon Front Splitter */}
        <path d="M16 6C22 4 32 4 38 6L40 10H14L16 6Z" fill="#0F172A" />

        {/* Hood Intake lines */}
        <path d="M21 12L23 26H31L33 12" stroke="#60A5FA" strokeWidth="1" strokeOpacity="0.7" fill="none" />
        <ellipse cx="27" cy="18" rx="2.5" ry="1.5" fill="#0F172A" />

        {/* Cockpit Canopy */}
        <path
          d="M17 28C22 25 32 25 37 28L40 46C41 57 41 60 38 66C32 68 22 68 16 66C13 60 13 57 14 46L17 28Z"
          fill="url(#rp-car-glass)"
          stroke="#93C5FD"
          strokeWidth="0.8"
        />

        {/* Roof Panel */}
        <path d="M19 36C23 34 31 34 35 36L36 54C32 55 22 55 18 54L19 36Z" fill="#1E3A8A" />

        {/* Roof Compass Badge */}
        <circle cx="27" cy="45" r="3.5" fill="#38BDF8" />
        <path d="M27 42V48M24 45H30" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />

        {/* LED Headlights (Bright Yellow-White) */}
        <polygon points="13,8 19,9 18,12 12,11" fill="#FEF08A" />
        <polygon points="41,8 35,9 36,12 42,11" fill="#FEF08A" />

        {/* Neon Cyber Taillight Bar */}
        <rect x="16" y="86" width="22" height="2.5" rx="1.2" fill="#EF4444" />

        {/* Rear Racing Spoiler */}
        <rect x="10" y="89" width="34" height="3" rx="1" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
        <rect x="15" y="86" width="2" height="4" fill="#0F172A" />
        <rect x="37" y="86" width="2" height="4" fill="#0F172A" />

        {/* Gold Trophy Star if All Stages Complete */}
        {isFinished && (
          <circle cx="27" cy="27" r="5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1" />
        )}
      </svg>
    </div>
  );
}

// ─── Step Icon ─────────────────────────────────────────────────────────────────
function StepIcon({ name }: { name: IconName }) {
  const iconShapes: Record<IconName, ReactNode> = {
    user: <><circle cx="12" cy="7.5" r="3.1" /><path d="M5.2 20c.5-3.6 2.9-5.7 6.8-5.7s6.3 2.1 6.8 5.7" /><path d="M4.4 20h15.2" /></>,
    monitor: <><rect x="3.5" y="4.5" width="17" height="12.5" rx="1.3" /><path d="M8 21h8M12 17v4M7 8h10" /></>,
    star: <><path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17l-5.6 3 .1-6.3-4.6-4.4 6.3-.9L12 2.7Z" /></>,
    bag: <><path d="M5 8h14l1 12H4L5 8Z" /><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2M4.5 11h15" /></>,
    team: <><circle cx="12" cy="7" r="2.6" /><circle cx="5" cy="10" r="2" /><circle cx="19" cy="10" r="2" /><path d="M6.8 20c0-3.8 1.8-6 5.2-6s5.2 2.2 5.2 6M1.8 19c0-2.6 1-4.2 3.2-4.2 1 0 1.7.4 2.2 1M22.2 19c0-2.6-1-4.2-3.2-4.2-1 0-1.7.4-2.2 1" /></>,
    target: <><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.7" /><circle cx="12" cy="12" r="1.3" /><path d="m13 11 6.2-6.2M16.2 4.8h3v3" /></>,
    spark: <><path d="m12 2.5 1.8 6 6.2 1.8-6.2 1.8-1.8 6-1.8-6L4 10.3 10.2 8.5l1.8-6Z" /></>,
    layers: <><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></>,
  };

  return (
    <span className="rp-goal-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {iconShapes[name]}
      </svg>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const Road3DGameView: React.FC<Props> = ({
  milestones,
  tasks,
  profile,
  onToggleTaskComplete,
  onOpenGoalSettings,
  onOpenNotifications,
}) => {
  const [announcement, setAnnouncement] = useState('');

  const showAnnouncement = useCallback((msg: string) => {
    setAnnouncement(msg);
    window.setTimeout(() => setAnnouncement(''), 3500);
  }, []);

  const getTasksForMilestone = useCallback((milestoneId: string): Task[] => {
    return tasks.filter((t) => t.milestone_id === milestoneId);
  }, [tasks]);

  const totalTaskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done_at != null).length;
  const overallPct = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  const roleName = profile?.target_role || 'Career';

  const roleHeader = useMemo(() => {
    const t = roleName.trim();
    const lower = t.toLowerCase();
    if (lower.includes('ui') || lower.includes('ux')) {
      return { line1: 'UI/UX', line2: 'DESIGNER ROADMAP', slash: true };
    }
    const words = t.split(/\s+/);
    if (words.length === 1) return { line1: words[0].toUpperCase(), line2: 'CAREER ROADMAP', slash: false };
    return {
      line1: words.slice(0, -1).join(' ').toUpperCase(),
      line2: words[words.length - 1].toUpperCase() + ' ROADMAP',
      slash: false,
    };
  }, [roleName]);

  const handleTaskClick = useCallback((task: Task, e: React.MouseEvent) => {
    const wasDone = task.done_at != null;
    onToggleTaskComplete(task.id);
    if (!wasDone) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 38,
        spread: 62,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ['#4e78eb', '#8a69d2', '#10B981', '#38BDF8', '#F59E0B'],
      });
      showAnnouncement('✅ Task marked complete! Keep going!');
    }
  }, [onToggleTaskComplete, showAnnouncement]);

  // ── Notification reminder frequency state ─────────────────────────────────
  const [reminderFreq, setReminderFreq] = useState<'2x' | '3x' | '4x'>(
    () => notificationService.getWeeklyReminderFrequency()
  );
  const [isReminderTesting, setIsReminderTesting] = useState(false);
  const handleTestPush = async () => {
    setIsReminderTesting(true);
    await notificationService.triggerWeeklyReminder(tasks, milestones[0], profile);
    setTimeout(() => setIsReminderTesting(false), 2000);
  };

  // ── Responsive Layout Detection ───────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 680;
    return false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute Road Geometry
  const refWidth = isMobile ? MOBILE_REF_WIDTH : DESKTOP_REF_WIDTH;
  const startY = isMobile ? MOBILE_START_Y : DESKTOP_START_Y;
  const stepY = isMobile ? MOBILE_STEP_Y : DESKTOP_STEP_Y;
  const leftPinX = isMobile ? MOBILE_LEFT_PIN_X : DESKTOP_LEFT_PIN_X;
  const rightPinX = isMobile ? MOBILE_RIGHT_PIN_X : DESKTOP_RIGHT_PIN_X;
  const cardWidth = isMobile ? MOBILE_CARD_WIDTH : DESKTOP_CARD_WIDTH;
  const leftCardX = isMobile ? MOBILE_LEFT_CARD_X : DESKTOP_LEFT_CARD_X;
  const rightCardX = isMobile ? MOBILE_RIGHT_CARD_X : DESKTOP_RIGHT_CARD_X;

  const { path: roadPath, totalHeight: posterHeight } = useMemo(() => {
    return generateRoadPath(milestones.length, isMobile);
  }, [milestones.length, isMobile]);

  // ── Stoppage Progression (Car moves when all tasks in milestone are completed) ──
  const activeStoppageIndex = useMemo(() => {
    if (milestones.length === 0) return 0;
    for (let i = 0; i < milestones.length; i++) {
      const mTasks = tasks.filter((t) => t.milestone_id === milestones[i].id);
      if (mTasks.length === 0) continue;
      const isAllDone = mTasks.every((t) => t.done_at != null);
      if (!isAllDone) {
        return i;
      }
    }
    return milestones.length - 1;
  }, [milestones, tasks]);

  const prevStoppageRef = useRef(activeStoppageIndex);

  // Trigger celebration and car advance sound when user completes all tasks in a stage
  useEffect(() => {
    if (activeStoppageIndex > prevStoppageRef.current) {
      playCarHorn();
      confetti({
        particleCount: 50,
        spread: 75,
        origin: { x: 0.5, y: 0.35 },
        colors: ['#38BDF8', '#2563EB', '#10B981', '#F59E0B', '#A855F7'],
      });
      showAnnouncement(`🏎️ Stage ${prevStoppageRef.current + 1} Cleared! Pilot Roadster drove to Stage ${activeStoppageIndex + 1}!`);
      prevStoppageRef.current = activeStoppageIndex;
    } else if (activeStoppageIndex < prevStoppageRef.current) {
      prevStoppageRef.current = activeStoppageIndex;
    }
  }, [activeStoppageIndex, showAnnouncement]);

  // Car Road Position & Tangent Heading Angle
  const carPosition = useMemo(() => {
    if (milestones.length === 0) {
      return { x: refWidth / 2, y: startY, angle: 0, index: 0, isFinished: false };
    }

    const idx = Math.min(activeStoppageIndex, milestones.length - 1);
    const isAllComplete = milestones.every((m) => {
      const mTasks = tasks.filter((t) => t.milestone_id === m.id);
      return mTasks.length > 0 && mTasks.every((t) => t.done_at != null);
    });

    const pinX = idx % 2 === 0 ? rightPinX : leftPinX;
    const pinY = startY + idx * stepY;

    // Road tangent calculation to steer the car forward along curves
    let nextX: number;
    let nextY: number;

    if (idx < milestones.length - 1) {
      nextX = (idx + 1) % 2 === 0 ? rightPinX : leftPinX;
      nextY = startY + (idx + 1) * stepY;
    } else {
      nextX = pinX;
      nextY = pinY + 120;
    }

    const dx = nextX - pinX;
    const dy = nextY - pinY;
    // Standard car SVG points UP. Road goes downward.
    const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI - 90);

    // Offset car to center lane of asphalt
    const offsetTowardsCenter = isMobile
      ? idx % 2 === 0 ? -16 : 16
      : idx % 2 === 0 ? -26 : 26;

    return {
      x: pinX + offsetTowardsCenter,
      y: pinY,
      angle,
      index: idx,
      isFinished: isAllComplete,
    };
  }, [activeStoppageIndex, milestones, tasks, refWidth, startY, stepY, rightPinX, leftPinX, isMobile]);

  // Percentage Helpers
  const toPctX = (px: number) => `${(px / refWidth) * 100}%`;
  const toPctY = (py: number) => `${(py / posterHeight) * 100}%`;
  const toPctW = (pw: number) => `${(pw / refWidth) * 100}%`;

  return (
    <div className="rp-page">
      {/* ════════════════════════════════════════════════════════════════════════
          HEADER BAR — title + controls
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="rp-header-bar">
        <div className="rp-header-info">
          <div className="rp-header-title">
            {roleHeader.slash ? (
              <>
                {roleHeader.line1.split('/')[0]}/
                <span className="rp-header-accent">{roleHeader.line1.split('/')[1]}</span>
              </>
            ) : roleHeader.line1}
          </div>
          <div className="rp-header-subtitle">
            {roleHeader.line2}
          </div>
          <div className="rp-header-progress">
            {milestones.length} milestones ·{' '}
            <span className="rp-header-progress-pct">{overallPct}% Complete ({completedCount}/{totalTaskCount} tasks)</span>
          </div>
        </div>

        <div className="rp-header-controls">
          <div className="rp-header-btn-row">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="rp-btn-alerts"
              title="Notification Center"
            >
              <Bell size={13} className="rp-btn-bell-icon" /> Alerts
            </button>
            <button
              type="button"
              onClick={onOpenGoalSettings}
              className="rp-btn-career"
            >
              Change Career
            </button>
          </div>

          {/* Reminder frequency */}
          <div className="rp-remind-bar">
            <span className="rp-remind-label">Remind:</span>
            {(['2x', '3x', '4x'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setReminderFreq(f);
                  notificationService.setWeeklyReminderFrequency(f);
                }}
                className={`rp-remind-chip ${reminderFreq === f ? 'active' : ''}`}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              onClick={handleTestPush}
              disabled={isReminderTesting}
              className="rp-remind-test-btn"
            >
              {isReminderTesting ? 'Sent!' : 'Test'}
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          POSTER SHELL — S-curve road + goal cards + car
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="rp-poster-shell">
        <section
          className="rp-roadmap-board"
          style={{ aspectRatio: `${refWidth} / ${posterHeight}` }}
          aria-label={`${roleName} career roadmap with ${milestones.length} milestones`}
        >
          {/* ── Poster Heading Banner ── */}
          <header className="rp-roadmap-heading">
            <div className="rp-wordmark">
              {roleHeader.slash ? (
                <><span>{roleHeader.line1.split('/')[0]}</span><i>/</i><b>{roleHeader.line1.split('/')[1]}</b></>
              ) : (
                <><span>{roleHeader.line1}</span></>
              )}
            </div>
            <h1>{roleHeader.line2}</h1>
            <div className="rp-title-rule" />
            <p>Step-by-Step Guide to Becoming a <strong>Job-Ready {roleName}</strong></p>
          </header>

          {/* ── SVG Road Art (3D Asphalt Highway) ── */}
          <svg
            className="rp-road-art"
            viewBox={`0 0 ${refWidth} ${posterHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="rp-asphalt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2c3748" />
                <stop offset="22%" stopColor="#182130" />
                <stop offset="52%" stopColor="#222c3b" />
                <stop offset="78%" stopColor="#141d2b" />
                <stop offset="100%" stopColor="#090f19" />
              </linearGradient>
              <linearGradient id="rp-roadRim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b7c1d1" />
                <stop offset="25%" stopColor="#e8edf5" />
                <stop offset="54%" stopColor="#9da9bb" />
                <stop offset="78%" stopColor="#f1f4fa" />
                <stop offset="100%" stopColor="#c5cedc" />
              </linearGradient>
              <linearGradient id="rp-roadSheen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#647187" stopOpacity=".35" />
                <stop offset="44%" stopColor="#647187" stopOpacity=".08" />
                <stop offset="100%" stopColor="#020711" stopOpacity=".45" />
              </linearGradient>
              <filter id="rp-roadShadow" x="-20%" y="-15%" width="150%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation={isMobile ? "3" : "4.5"} result="blur" />
                <feOffset in="blur" dx="2" dy={isMobile ? "4" : "7"} result="offsetBlur" />
                <feColorMatrix
                  in="offsetBlur"
                  type="matrix"
                  values="0 0 0 0 0.04  0 0 0 0 0.07  0 0 0 0 0.13  0 0 0 .38 0"
                  result="shadow"
                />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Road layers for rich 3D highway bevel & asphalt depth */}
            <path d={roadPath} className="rp-road-shadow" filter="url(#rp-roadShadow)" strokeWidth={isMobile ? 38 : 58} />
            <path d={roadPath} className="rp-road-extrusion" transform="translate(1 6)" strokeWidth={isMobile ? 35 : 54} />
            <path d={roadPath} className="rp-road-rim" strokeWidth={isMobile ? 33 : 51} />
            <path d={roadPath} className="rp-road-bevel" transform="translate(0 -1.4)" strokeWidth={isMobile ? 31 : 47} />
            <path d={roadPath} className="rp-road-edge-shadow" transform="translate(0 1.8)" strokeWidth={isMobile ? 29 : 44} />
            <path d={roadPath} className="rp-road-face" transform="translate(0 -1.5)" strokeWidth={isMobile ? 26 : 40} />
            <path d={roadPath} className="rp-road-sheen" transform="translate(0 -3)" strokeWidth={isMobile ? 22 : 35} />
            <path
              d={roadPath}
              className="rp-road-dashes"
              transform="translate(0 -2)"
              strokeWidth={isMobile ? 1.6 : 2.2}
              strokeDasharray={isMobile ? "6 5" : "9 7"}
            />

            {/* Connector lines from road/pins to goal cards */}
            {milestones.map((_, index) => {
              const rightSide = index % 2 === 0;
              const pinX = rightSide ? rightPinX : leftPinX;
              const pinY = startY + index * stepY;
              const cardX = rightSide ? rightCardX : leftCardX + cardWidth;
              const path = `M ${pinX} ${pinY} L ${cardX} ${pinY}`;
              return <path key={`connector-${index}`} className="rp-connector" d={path} />;
            })}
          </svg>

          {/* ── Pilot Roadster (Animated Car on the Highway) ── */}
          <div
            className="rp-car-vehicle"
            style={{
              left: toPctX(carPosition.x),
              top: toPctY(carPosition.y),
              transform: `translate(-50%, -50%) rotate(${carPosition.angle}deg)`,
            }}
            onClick={() => {
              playCarHorn();
              showAnnouncement(`🏎️ Pilot Roadster stationed at Stage ${carPosition.index + 1}!`);
            }}
            title={`Pilot Roadster (Stage ${carPosition.index + 1}) - Click to Honk!`}
          >
            <PilotRoadster isFinished={carPosition.isFinished} />
          </div>

          {/* ── Goal layers (Milestone Pins & Cards) ── */}
          {milestones.map((milestone, index) => {
            const rightSide = index % 2 === 0;
            const pinX = rightSide ? rightPinX : leftPinX;
            const pinY = startY + index * stepY;
            const cardX = rightSide ? rightCardX : leftCardX;
            const cardTopY = pinY - (isMobile ? 65 : 85);
            const iconName = MILESTONE_ICONS[index % MILESTONE_ICONS.length];
            const milestoneTasks = getTasksForMilestone(milestone.id);
            const doneCount = milestoneTasks.filter((t) => t.done_at != null).length;
            const isCurrentStoppage = index === carPosition.index;

            const cardStyle: CSSProperties = {
              left: toPctX(cardX),
              top: toPctY(cardTopY),
              width: toPctW(cardWidth),
            };

            return (
              <div className="rp-goal-layer" key={`${index}-${milestone.id}`}>
                {/* Milestone Pin on the road apex */}
                <div
                  className={`rp-milestone ${index % 2 === 0 ? 'blue' : 'purple'} ${isCurrentStoppage ? 'current-stoppage' : ''}`}
                  style={{
                    left: toPctX(pinX),
                    top: toPctY(pinY),
                  }}
                  aria-label={`Step ${String(index + 1).padStart(2, '0')}`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {isCurrentStoppage && (
                    <span className="rp-stoppage-pill">CURRENT STOP</span>
                  )}
                  <i className="rp-milestone-stem" />
                </div>

                {/* Goal Info Card */}
                <article className={`rp-goal-copy ${rightSide ? 'right' : 'left'}`} style={cardStyle}>
                  <div className="rp-card-header">
                    <div className="rp-card-title-group">
                      <span className="rp-card-step-kicker">STAGE {String(index + 1).padStart(2, '0')}</span>
                      <h2>{milestone.title.toUpperCase()}</h2>
                    </div>
                    <div className="rp-card-icon-badge">
                      <StepIcon name={iconName} />
                    </div>
                  </div>

                  {/* Progress hint */}
                  {milestoneTasks.length > 0 && (
                    <div className="rp-progress-hint">
                      {doneCount === milestoneTasks.length ? (
                        <span className="rp-progress-done-badge">✓ Completed</span>
                      ) : (
                        <span>{doneCount}/{milestoneTasks.length} tasks completed</span>
                      )}
                    </div>
                  )}

                  {/* Interactive Checklist tasks */}
                  {milestoneTasks.length > 0 && (
                    <ul className="rp-task-list">
                      {milestoneTasks.slice(0, 4).map((task) => {
                        const done = task.done_at != null;
                        return (
                          <li
                            key={task.id}
                            className={`rp-task-item${done ? ' done' : ''}`}
                            onClick={(e) => handleTaskClick(task, e)}
                            role="checkbox"
                            aria-checked={done}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleTaskClick(task, e as unknown as React.MouseEvent)}
                          >
                            <span className={`rp-checkbox${done ? ' checked' : ''}`} aria-hidden="true">
                              {done ? '✓' : ''}
                            </span>
                            <span className="rp-task-title">{task.title}</span>
                          </li>
                        );
                      })}
                      {milestoneTasks.length > 4 && (
                        <li className="rp-task-more">+{milestoneTasks.length - 4} more tasks</li>
                      )}
                    </ul>
                  )}

                  {/* Skills tags */}
                  {milestone.skills_covered && milestone.skills_covered.length > 0 && (
                    <div className="rp-skills">
                      {milestone.skills_covered.slice(0, 3).map((s) => (
                        <span key={s} className="rp-skill-tag">{s}</span>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            );
          })}
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          GOAL EDITOR / FOOTER SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="rp-goal-editor" aria-label="Roadmap summary">
        <div className="rp-editor-intro">
          <span className="rp-editor-kicker">YOUR CAREER JOURNEY</span>
          <p>Click any task on the roadmap to mark it complete. Your progress updates in real time.</p>
        </div>

        <div className="rp-stats-row">
          <div className="rp-stat-card">
            <div className="rp-stat-value">{String(milestones.length).padStart(2, '0')}</div>
            <div className="rp-stat-label">MILESTONES</div>
          </div>
          <div className="rp-stat-card">
            <div className="rp-stat-value" style={{ color: '#10b981' }}>{completedCount}</div>
            <div className="rp-stat-label">TASKS DONE</div>
          </div>
          <div className="rp-stat-card">
            <div className="rp-stat-value" style={{ color: '#3b82f6' }}>{overallPct}%</div>
            <div className="rp-stat-label">COMPLETE</div>
          </div>
          <div className="rp-stat-card">
            <div className="rp-stat-value" style={{ color: '#8b5cf6' }}>{totalTaskCount - completedCount}</div>
            <div className="rp-stat-label">REMAINING</div>
          </div>
        </div>

        <button
          type="button"
          className="rp-settings-button"
          onClick={onOpenGoalSettings}
        >
          ⚙️ Adjust Career Goal & Timeline ↗
        </button>

        <p className="rp-editor-count">
          {String(milestones.length).padStart(2, '0')} MILESTONES <span>·</span> {String(totalTaskCount).padStart(2, '0')} TOTAL TASKS
        </p>
        <p className="rp-live-message" aria-live="polite">{announcement}</p>
      </section>

      <style>{roadmapStyles}</style>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const roadmapStyles = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto+Condensed:wght@600;700;800;900&display=swap');

/* ── THEME DESIGN SYSTEM ── */
.rp-page {
  /* LIGHT MODE TOKENS (Default) */
  --rp-page-bg: transparent;
  --rp-board-bg: #FFFFFF;
  --rp-board-border: #E2E8F0;
  --rp-board-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.08);

  /* Card Surfaces */
  --rp-card-bg: #FFFFFF;
  --rp-card-border: #E2E8F0;
  --rp-card-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  --rp-card-hover-border: #3B82F6;
  --rp-card-hover-shadow: 0 8px 24px rgba(59, 130, 246, 0.12);

  /* Header Bar */
  --rp-header-title: #0F172A;
  --rp-header-accent: #2563EB;
  --rp-header-subtitle: #1E293B;
  --rp-header-progress: #64748B;
  --rp-btn-bg: #FFFFFF;
  --rp-btn-border: #E2E8F0;
  --rp-btn-text: #334155;
  --rp-btn-hover: #F8FAFC;
  --rp-remind-bg: #F8FAFC;
  --rp-remind-border: #E2E8F0;
  --rp-remind-text: #64748B;
  --rp-remind-active-bg: #2563EB;
  --rp-remind-active-text: #FFFFFF;

  /* Poster Typography */
  --rp-wordmark: #0F172A;
  --rp-wordmark-i: #64748B;
  --rp-wordmark-accent: #2563EB;
  --rp-h1: #0F172A;
  --rp-rule: #2563EB;
  --rp-desc: #475569;
  --rp-desc-strong: #1D4ED8;

  /* Goal Layers & Milestones */
  --rp-pin-bg: #FFFFFF;
  --rp-pin-text: #0F172A;
  --rp-pin-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
  --rp-pin-blue: #2563EB;
  --rp-pin-purple: #7C3AED;
  --rp-icon-color: #64748B;

  /* Goal Info & Checklist */
  --rp-goal-title: #0F172A;
  --rp-goal-hint: #64748B;
  --rp-task-title: #1E293B;
  --rp-task-title-done: #94A3B8;
  --rp-task-hover-bg: rgba(37, 99, 235, 0.06);

  /* Checkbox */
  --rp-check-bg: #FFFFFF;
  --rp-check-border: #CBD5E1;
  --rp-check-hover-border: #2563EB;

  /* Skill Tags */
  --rp-skill-bg: #F1F5F9;
  --rp-skill-text: #334155;
  --rp-skill-border: #E2E8F0;

  /* Connectors & Road */
  --rp-connector: #CBD5E1;
  --rp-road-shadow-color: rgba(15, 23, 42, 0.22);
  --rp-road-extrusion: #080E18;
  --rp-road-bevel: #E2E8F0;
  --rp-road-edge-shadow: #64748B;
  --rp-road-dashes: rgba(255, 255, 255, 0.95);

  /* Goal Editor / Footer */
  --rp-footer-border: #E2E8F0;
  --rp-footer-title: #2563EB;
  --rp-footer-text: #64748B;
  --rp-stat-card-bg: #FFFFFF;
  --rp-stat-card-border: #E2E8F0;
  --rp-stat-value: #0F172A;
  --rp-stat-label: #64748B;
  --rp-settings-btn-bg: #EFF6FF;
  --rp-settings-btn-border: #93C5FD;
  --rp-settings-btn-text: #1D4ED8;
  --rp-settings-btn-hover: #DBEAFE;

  width: 100%;
  min-height: 100vh;
  padding: 0 0 40px;
  background: var(--rp-page-bg);
  color: var(--rp-task-title);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: color 0.25s ease, background 0.25s ease;
}

@media (max-width: 680px) {
  .rp-page {
    padding-bottom: 96px;
  }
}

/* DARK MODE TOKENS */
:root.dark .rp-page,
[data-theme='dark'] .rp-page,
body.dark .rp-page,
.dark .rp-page {
  --rp-page-bg: transparent;
  --rp-board-bg: #0F172A;
  --rp-board-border: #1E293B;
  --rp-board-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.07);

  /* Card Surfaces */
  --rp-card-bg: #1E293B;
  --rp-card-border: #334155;
  --rp-card-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  --rp-card-hover-border: #60A5FA;
  --rp-card-hover-shadow: 0 8px 26px rgba(96, 165, 250, 0.25);

  /* Header Bar */
  --rp-header-title: #F8FAFC;
  --rp-header-accent: #60A5FA;
  --rp-header-subtitle: #F1F5F9;
  --rp-header-progress: #94A3B8;
  --rp-btn-bg: #1E293B;
  --rp-btn-border: #334155;
  --rp-btn-text: #F1F5F9;
  --rp-btn-hover: #2B384E;
  --rp-remind-bg: #1E293B;
  --rp-remind-border: #334155;
  --rp-remind-text: #94A3B8;
  --rp-remind-active-bg: #3B82F6;
  --rp-remind-active-text: #FFFFFF;

  /* Poster Typography */
  --rp-wordmark: #F8FAFC;
  --rp-wordmark-i: #94A3B8;
  --rp-wordmark-accent: #60A5FA;
  --rp-h1: #F8FAFC;
  --rp-rule: #60A5FA;
  --rp-desc: #94A3B8;
  --rp-desc-strong: #93C5FD;

  /* Goal Layers & Milestones */
  --rp-pin-bg: #0F172A;
  --rp-pin-text: #F8FAFC;
  --rp-pin-shadow: 0 4px 18px rgba(0, 0, 0, 0.7), 0 0 14px rgba(96, 165, 250, 0.35);
  --rp-pin-blue: #60A5FA;
  --rp-pin-purple: #A78BFA;
  --rp-icon-color: #94A3B8;

  /* Goal Info & Checklist */
  --rp-goal-title: #F8FAFC;
  --rp-goal-hint: #94A3B8;
  --rp-task-title: #F1F5F9;
  --rp-task-title-done: #64748B;
  --rp-task-hover-bg: rgba(96, 165, 250, 0.12);

  /* Checkbox */
  --rp-check-bg: #0F172A;
  --rp-check-border: #475569;
  --rp-check-hover-border: #60A5FA;

  /* Skill Tags */
  --rp-skill-bg: rgba(59, 130, 246, 0.15);
  --rp-skill-text: #93C5FD;
  --rp-skill-border: rgba(147, 197, 253, 0.25);

  /* Connectors & Road */
  --rp-connector: #475569;
  --rp-road-shadow-color: rgba(0, 0, 0, 0.7);
  --rp-road-extrusion: #030712;
  --rp-road-bevel: #334155;
  --rp-road-edge-shadow: #1E293B;
  --rp-road-dashes: rgba(248, 250, 252, 0.96);

  /* Goal Editor / Footer */
  --rp-footer-border: #1E293B;
  --rp-footer-title: #60A5FA;
  --rp-footer-text: #94A3B8;
  --rp-stat-card-bg: #1E293B;
  --rp-stat-card-border: #334155;
  --rp-stat-value: #F8FAFC;
  --rp-stat-label: #94A3B8;
  --rp-settings-btn-bg: #1E293B;
  --rp-settings-btn-border: #3B82F6;
  --rp-settings-btn-text: #93C5FD;
  --rp-settings-btn-hover: #1A2844;
}

/* ── HEADER BAR ── */
.rp-header-bar {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 10px 4px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 14px;
}
.rp-header-info {
  flex: 1 1 320px;
}
.rp-header-title {
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 950;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--rp-header-title);
  transition: color 0.25s ease;
}
.rp-header-accent {
  color: var(--rp-header-accent);
}
.rp-header-subtitle {
  font-size: clamp(15px, 2vw, 20px);
  font-weight: 800;
  color: var(--rp-header-subtitle);
  text-transform: uppercase;
  margin-top: 4px;
  transition: color 0.25s ease;
}
.rp-header-progress {
  font-size: 13px;
  color: var(--rp-header-progress);
  font-weight: 500;
  margin-top: 6px;
}
.rp-header-progress-pct {
  color: #10B981;
  font-weight: 700;
}
.rp-header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
@media (max-width: 680px) {
  .rp-header-controls {
    align-items: flex-start;
    width: 100%;
  }
}
.rp-header-btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rp-btn-alerts {
  background: var(--rp-btn-bg);
  border: 1px solid var(--rp-btn-border);
  border-radius: 9px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--rp-btn-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.rp-btn-alerts:hover {
  background: var(--rp-btn-hover);
}
.rp-btn-bell-icon {
  color: var(--rp-header-accent);
}
.rp-btn-career {
  background: #2563EB;
  color: #FFFFFF;
  border: none;
  border-radius: 9px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
  transition: background 0.15s ease, transform 0.1s ease;
}
.rp-btn-career:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
}
.rp-remind-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--rp-remind-bg);
  border: 1px solid var(--rp-remind-border);
  border-radius: 9px;
  padding: 4px 10px;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.rp-remind-label {
  font-size: 11px;
  color: var(--rp-remind-text);
  font-weight: 600;
}
.rp-remind-chip {
  padding: 2px 7px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--rp-remind-text);
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rp-remind-chip.active {
  background: var(--rp-remind-active-bg);
  color: var(--rp-remind-active-text);
}
.rp-remind-test-btn {
  background: #2563EB;
  color: #FFFFFF;
  border: none;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}
.rp-remind-test-btn:hover {
  background: #1D4ED8;
}

/* ── POSTER SHELL & BOARD ── */
.rp-poster-shell {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
}

.rp-roadmap-board {
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  background: var(--rp-board-bg);
  border: 1px solid var(--rp-board-border);
  border-radius: 24px;
  box-shadow: var(--rp-board-shadow);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

/* ── POSTER HEADING ── */
.rp-roadmap-heading {
  position: absolute;
  z-index: 3;
  top: 18px;
  left: 20px;
  right: 20px;
  max-width: 480px;
  pointer-events: none;
}
@media (max-width: 680px) {
  .rp-roadmap-heading {
    top: 12px;
    left: 14px;
    right: 14px;
    max-width: 290px;
  }
}
.rp-wordmark {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  color: var(--rp-wordmark);
  font-family: "Roboto Condensed", -apple-system, sans-serif;
  font-size: clamp(20px, 3.2vw, 36px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  transition: color 0.25s ease;
}
.rp-wordmark i {
  margin: 0 4px;
  color: var(--rp-wordmark-i);
  font-style: normal;
  font-weight: 500;
}
.rp-wordmark b {
  color: var(--rp-wordmark-accent);
  font-weight: 800;
}
.rp-roadmap-heading h1 {
  margin: 3px 0 0;
  font-family: "Roboto Condensed", -apple-system, sans-serif;
  font-size: clamp(13px, 1.8vw, 20px);
  line-height: 1.15;
  letter-spacing: -0.01em;
  font-weight: 700;
  color: var(--rp-h1);
  text-transform: uppercase;
  transition: color 0.25s ease;
}
.rp-title-rule {
  width: 40px;
  height: 3px;
  border-radius: 9999px;
  margin: 8px 0 6px;
  background: var(--rp-rule);
  transition: background 0.25s ease;
}
.rp-roadmap-heading p {
  margin: 0;
  color: var(--rp-desc);
  font-size: clamp(10.5px, 1.2vw, 13px);
  line-height: 1.45;
  font-weight: 500;
  transition: color 0.25s ease;
}
.rp-roadmap-heading p strong {
  color: var(--rp-desc-strong);
  font-weight: 700;
}

/* ── ROAD SVG ART ── */
.rp-road-art {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
.rp-road-shadow {
  fill: none;
  stroke: var(--rp-road-shadow-color);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .4;
}
.rp-road-extrusion {
  fill: none;
  stroke: var(--rp-road-extrusion);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .95;
}
.rp-road-rim {
  fill: none;
  stroke: url(#rp-roadRim);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.rp-road-bevel {
  fill: none;
  stroke: var(--rp-road-bevel);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .92;
}
.rp-road-edge-shadow {
  fill: none;
  stroke: var(--rp-road-edge-shadow);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .75;
}
.rp-road-face {
  fill: none;
  stroke: url(#rp-asphalt);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.rp-road-sheen {
  fill: none;
  stroke: url(#rp-roadSheen);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .85;
}
.rp-road-dashes {
  fill: none;
  stroke: var(--rp-road-dashes);
  stroke-linecap: round;
  opacity: .95;
}
.rp-connector {
  fill: none;
  stroke: var(--rp-connector);
  stroke-width: 1.25;
  stroke-dasharray: 3 3;
  stroke-linecap: round;
  opacity: .85;
  transition: stroke 0.25s ease;
}

/* ── PILOT ROADSTER VEHICLE ── */
.rp-car-vehicle {
  position: absolute;
  z-index: 6;
  pointer-events: auto;
  cursor: pointer;
  transition: left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              top 1.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rp-car-wrapper {
  position: relative;
  width: 38px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
  transition: transform 0.2s ease;
}
.rp-car-wrapper:hover {
  transform: scale(1.1);
}
.rp-car-wrapper:active {
  transform: scale(0.95);
}

@media (max-width: 680px) {
  .rp-car-wrapper {
    width: 26px;
    height: 48px;
  }
}

.rp-car-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.rp-car-headlights {
  position: absolute;
  top: -55px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 65px;
  pointer-events: none;
  background: radial-gradient(ellipse 65% 100% at 50% 100%, rgba(254, 240, 138, 0.5) 0%, rgba(250, 204, 21, 0.18) 45%, rgba(250, 204, 21, 0) 100%);
  clip-path: polygon(36% 100%, 64% 100%, 95% 0%, 5% 0%);
  filter: blur(1.5px);
  z-index: -1;
  animation: rpHeadlightPulse 2.5s ease-in-out infinite alternate;
}
@media (max-width: 680px) {
  .rp-car-headlights {
    top: -38px;
    width: 55px;
    height: 44px;
  }
}

@keyframes rpHeadlightPulse {
  0% { opacity: 0.65; }
  100% { opacity: 0.95; }
}

/* ── GOAL LAYERS & MILESTONE PINS ── */
.rp-goal-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.rp-milestone {
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--rp-pin-bg);
  box-shadow: var(--rp-pin-shadow);
  color: var(--rp-pin-text);
  font-family: Inter, sans-serif;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  pointer-events: auto;
  cursor: pointer;
}
@media (max-width: 680px) {
  .rp-milestone {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
.rp-milestone:hover {
  transform: translate(-50%, -50%) scale(1.1);
}
.rp-milestone.blue {
  border: 3.5px solid var(--rp-pin-blue);
}
.rp-milestone.purple {
  border: 3.5px solid var(--rp-pin-purple);
}
@media (max-width: 680px) {
  .rp-milestone.blue,
  .rp-milestone.purple {
    border-width: 2.5px;
  }
}
.rp-milestone span {
  position: relative;
  z-index: 2;
}

/* Current Stoppage Pulse Beacon */
.rp-milestone.current-stoppage {
  animation: rpStoppageBeacon 2.2s infinite;
}
@keyframes rpStoppageBeacon {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), var(--rp-pin-shadow);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), var(--rp-pin-shadow);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), var(--rp-pin-shadow);
  }
}

.rp-stoppage-pill {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: #2563EB;
  color: #FFFFFF;
  font-size: 7.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  padding: 1px 5px;
  border-radius: 9999px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
}
@media (max-width: 680px) {
  .rp-stoppage-pill {
    top: -15px;
    font-size: 6.5px;
    padding: 1px 4px;
  }
}

.rp-milestone-stem {
  position: absolute;
  z-index: -1;
  top: calc(100% - 2px);
  left: 50%;
  width: 4px;
  height: 32px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, currentColor 20%, transparent 100%);
  opacity: .8;
}
@media (max-width: 680px) {
  .rp-milestone-stem {
    width: 3px;
    height: 22px;
  }
}
.rp-milestone.blue .rp-milestone-stem {
  color: var(--rp-pin-blue);
}
.rp-milestone.purple .rp-milestone-stem {
  color: var(--rp-pin-purple);
}

/* ── GOAL COPY CARDS ── */
.rp-goal-copy {
  position: absolute;
  z-index: 3;
  pointer-events: auto;
  background: var(--rp-card-bg);
  border: 1px solid var(--rp-card-border);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--rp-card-shadow);
  transition: all 0.2s ease;
}
@media (max-width: 680px) {
  .rp-goal-copy {
    border-radius: 12px;
    padding: 9px 10px;
  }
}
.rp-goal-copy:hover {
  border-color: var(--rp-card-hover-border);
  box-shadow: var(--rp-card-hover-shadow);
}
.rp-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.rp-card-title-group {
  flex: 1;
}
.rp-card-step-kicker {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--rp-header-accent);
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}
@media (max-width: 680px) {
  .rp-card-step-kicker {
    font-size: 8px;
    letter-spacing: 0.5px;
  }
}
.rp-goal-copy h2 {
  margin: 0;
  color: var(--rp-goal-title);
  font-family: "Roboto Condensed", -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: color 0.25s ease;
}
@media (min-width: 680px) {
  .rp-goal-copy h2 {
    font-size: 15.5px;
    line-height: 1.3;
  }
}
.rp-card-icon-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--rp-icon-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 680px) {
  .rp-card-icon-badge {
    width: 18px;
    height: 18px;
  }
}
.rp-goal-icon {
  display: block;
  width: 100%;
  height: 100%;
}
.rp-goal-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* Progress hint */
.rp-progress-hint {
  font-size: 11px;
  color: var(--rp-goal-hint);
  font-weight: 600;
  margin-bottom: 8px;
  transition: color 0.25s ease;
}
@media (max-width: 680px) {
  .rp-progress-hint {
    font-size: 9.5px;
    margin-bottom: 5px;
  }
}
.rp-progress-done-badge {
  color: #10B981;
  font-weight: 700;
}

/* ── CHECKLIST TASKS ── */
.rp-task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
@media (max-width: 680px) {
  .rp-task-list {
    gap: 3.5px;
  }
}
.rp-task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.12s ease;
  pointer-events: auto;
}
@media (max-width: 680px) {
  .rp-task-item {
    gap: 6px;
    padding: 2px 3px;
  }
}
.rp-task-item:hover {
  background: var(--rp-task-hover-bg);
}
.rp-task-item:focus {
  outline: 1.5px solid var(--rp-header-accent);
  outline-offset: 1px;
}

.rp-checkbox {
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  min-width: 17px;
  min-height: 17px;
  border-radius: 4px;
  border: 1.5px solid var(--rp-check-border);
  background: var(--rp-check-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  font-weight: 900;
  margin-top: 1px;
  transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@media (max-width: 680px) {
  .rp-checkbox {
    width: 14px;
    height: 14px;
    min-width: 14px;
    min-height: 14px;
    font-size: 9.5px;
    border-radius: 3px;
  }
}
.rp-checkbox.checked {
  background: linear-gradient(135deg, #10B981, #059669);
  border-color: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.45);
}

.rp-task-title {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--rp-task-title);
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: color 0.15s, text-decoration 0.15s;
}
@media (min-width: 680px) {
  .rp-task-title {
    font-size: 13.5px;
    line-height: 1.45;
  }
}
@media (max-width: 680px) {
  .rp-task-title {
    font-size: 11px;
    line-height: 1.35;
  }
}
.rp-task-item.done .rp-task-title {
  color: var(--rp-task-title-done);
  text-decoration: line-through;
}

.rp-task-more {
  font-size: 11px;
  color: var(--rp-pin-purple);
  font-weight: 700;
  padding: 2px 6px;
  list-style: none;
}
@media (max-width: 680px) {
  .rp-task-more {
    font-size: 9.5px;
    padding: 1px 3px;
  }
}

/* Skills tags */
.rp-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}
@media (max-width: 680px) {
  .rp-skills {
    gap: 3px;
    margin-top: 5px;
  }
}
.rp-skill-tag {
  font-size: 11px;
  font-weight: 700;
  background: var(--rp-skill-bg);
  color: var(--rp-skill-text);
  border: 1px solid var(--rp-skill-border);
  border-radius: 5px;
  padding: 2px 7px;
  transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}
@media (max-width: 680px) {
  .rp-skill-tag {
    font-size: 9.5px;
    padding: 1.5px 5px;
  }
}

/* ── GOAL EDITOR / FOOTER SECTION ── */
.rp-goal-editor {
  width: 100%;
  max-width: 1040px;
  margin: 24px auto 0;
  padding: 20px 8px 8px;
  border-top: 1px solid var(--rp-footer-border);
  color: var(--rp-footer-text);
  transition: border-color 0.25s ease, color 0.25s ease;
}
.rp-editor-intro {
  max-width: 440px;
}
.rp-editor-kicker {
  font-size: 10.5px;
  color: var(--rp-footer-title);
  font-weight: 800;
  letter-spacing: 1.2px;
}
.rp-editor-intro p {
  margin: 6px 0 14px;
  color: var(--rp-footer-text);
  font-size: 12px;
  line-height: 1.6;
}

.rp-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
@media (max-width: 540px) {
  .rp-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
.rp-stat-card {
  background: var(--rp-stat-card-bg);
  border: 1px solid var(--rp-stat-card-border);
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: background 0.25s ease, border-color 0.25s ease;
}
.rp-stat-value {
  font-size: 22px;
  font-weight: 900;
  color: var(--rp-stat-value);
  line-height: 1;
  margin-bottom: 4px;
  transition: color 0.25s ease;
}
.rp-stat-label {
  font-size: 9.5px;
  font-weight: 800;
  color: var(--rp-stat-label);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.rp-settings-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--rp-settings-btn-border);
  border-radius: 8px;
  background: var(--rp-settings-btn-bg);
  padding: 9px 16px;
  color: var(--rp-settings-btn-text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.15s ease;
}
.rp-settings-button:hover {
  background: var(--rp-settings-btn-hover);
  transform: translateY(-1px);
}

.rp-editor-count {
  margin: 16px 0 0;
  color: var(--rp-footer-text);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}
.rp-editor-count span {
  margin: 0 6px;
  color: var(--rp-footer-title);
}
.rp-live-message {
  min-height: 16px;
  margin: 6px 0 0;
  color: #10B981;
  font-size: 11px;
  font-weight: 600;
}
`;
