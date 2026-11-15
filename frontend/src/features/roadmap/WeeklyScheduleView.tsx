import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Code2,
  FastForward,
  Flame,
  Layers,
  ListChecks,
  Moon,
  Pause,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Milestone, Profile, Task, TaskActionType } from '../../types';
import {
  notificationService,
  type DetailedNotificationSettings,
} from '../notifications/notificationService';
import { TaskResourceLink } from './TaskResourceLink';

interface Props {
  milestones: Milestone[];
  tasks: Task[];
  profile: Profile | null;
  onToggleTaskComplete: (taskId: string) => void;
  onApplyPlannerAction?: (action: 'behind' | 'early' | 'pause') => void;
  onOpenGoalSettings: () => void;
  onOpenCoach?: () => void;
}

type ScheduleTab = 'agenda' | 'grid' | 'stages' | 'push';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const WEEKDAY_CHOICES: Array<{ day: number; label: string }> = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

const QUICK_TIMES = ['08:00', '09:00', '13:00', '19:00', '21:00'] as const;

const TYPE_META: Record<TaskActionType, { label: string; icon: React.ReactNode }> = {
  Learn: { label: 'Learn', icon: <BookOpen size={11} /> },
  Build: { label: 'Build', icon: <Code2 size={11} /> },
  Practice: { label: 'Practice', icon: <Layers size={11} /> },
  Checkpoint: { label: 'Checkpoint', icon: <ShieldCheck size={11} /> },
};

interface GoalGuide {
  summary: string;
  steps: Array<{ title: string; hint: string }>;
  deliverable: string;
  split: string;
}

function buildGoalGuide(task: Task, roleName: string): GoalGuide {
  const title = (task.title || '').toLowerCase();
  const subject = (task.subject || '').toLowerCase();
  const text = `${title} ${subject}`;
  const mins = task.est_minutes || 45;
  const prep = Math.max(10, Math.round(mins * 0.25));
  const core = Math.max(15, Math.round(mins * 0.55));
  const verify = Math.max(5, mins - prep - core);
  const split = `${prep}m prep · ${core}m focus · ${verify}m verify`;

  if (task.type === 'Checkpoint' || /checkpoint|quiz|review|audit|capstone|portfolio/.test(text)) {
    return {
      summary: `Validate core decisions, edge cases, and tangible output for ${roleName}.`,
      steps: [
        { title: 'Review key invariants', hint: 'Summarize constraints and failure modes for this stage.' },
        { title: 'Self-test unaided', hint: 'Trace inputs to outputs without referencing notes.' },
        { title: 'Log verification', hint: 'Capture concise test output or note confirming mastery.' },
      ],
      deliverable: task.deliverable || `Verified ${roleName} stage checkpoint`,
      split,
    };
  }

  if (/serverless|lambda|aws|cloud|terraform|docker|kubernetes|deploy|infra|ci\/cd|observability/.test(text)) {
    return {
      summary: `Configure production-minded ${roleName} infrastructure with safe rollback and logging.`,
      steps: [
        { title: 'Set boundaries & config', hint: 'Verify least-privilege permissions, timeouts, and env vars.' },
        { title: 'Run local verification', hint: 'Test handler execution with realistic payloads and logs.' },
        { title: 'Check failure & retries', hint: 'Confirm error paths, dead-letter handling, and health checks.' },
      ],
      deliverable: task.deliverable || 'Working configuration with verified execution logs',
      split,
    };
  }

  if (/api|backend|database|sql|postgres|auth|schema|webhook|queue|cache|redis/.test(text)) {
    return {
      summary: 'Design explicit contracts, predictable state, and resilient error handling.',
      steps: [
        { title: 'Define contract & schema', hint: 'Confirm input validation, status codes, and constraints.' },
        { title: 'Implement core slice', hint: 'Keep business logic isolated, idempotent, and clean.' },
        { title: 'Verify edge cases', hint: 'Test invalid payloads, unauthorized access, and timeouts.' },
      ],
      deliverable: task.deliverable || `Tested ${roleName} contract & implementation`,
      split,
    };
  }

  if (/ui|ux|design|figma|react|frontend|component|layout|css|responsive|accessibility/.test(text)) {
    return {
      summary: 'Deliver responsive, accessible UI structure across loading, empty, and error states.',
      steps: [
        { title: 'Outline hierarchy & states', hint: 'Define layout across mobile and desktop plus edge states.' },
        { title: 'Build modular component', hint: 'Keep props explicit and controls keyboard-accessible.' },
        { title: 'Audit responsive fit', hint: 'Check contrast, spacing, focus rings, and zero overflow.' },
      ],
      deliverable: task.deliverable || 'Responsive UI verified across mobile & desktop',
      split,
    };
  }

  if (task.type === 'Build') {
    return {
      summary: `Ship a concrete working slice aligned with ${roleName}.`,
      steps: [
        { title: 'Scope core slice', hint: 'Keep inputs minimal so the slice runs end-to-end today.' },
        { title: 'Implement working path', hint: 'Prioritize clean boundaries and observable output.' },
        { title: 'Run end-to-end check', hint: 'Confirm expected output and record one takeaway.' },
      ],
      deliverable: task.deliverable || `Completed ${roleName} build exercise`,
      split,
    };
  }

  if (task.type === 'Practice') {
    return {
      summary: `Sharpen speed and recall for ${roleName} via focused active drills.`,
      steps: [
        { title: 'Pick drill focus', hint: 'Isolate one pattern or workflow for this timebox.' },
        { title: 'Solve without notes', hint: 'Write code or trace scenarios unaided before checking docs.' },
        { title: 'Note friction points', hint: 'Capture the one gap that slowed you down.' },
      ],
      deliverable: task.deliverable || 'Completed drill and concise gap notes',
      split,
    };
  }

  return {
    summary: `Build clear mental models and practical tradeoffs for ${task.title}.`,
    steps: [
      { title: 'Inspect core mechanics', hint: 'Focus on purpose, constraints, and real use cases.' },
      { title: 'Summarize tradeoffs', hint: 'Note when to apply this pattern—and when not to.' },
      { title: 'Test tiny example', hint: 'Run a minimal snippet or trace to verify understanding.' },
    ],
    deliverable: task.deliverable || 'Concise tradeoff notes & sanity check',
    split,
  };
}

export const WeeklyScheduleView: React.FC<Props> = ({
  milestones,
  tasks,
  profile,
  onToggleTaskComplete,
  onApplyPlannerAction,
  onOpenGoalSettings,
  onOpenCoach,
}) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('agenda');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const [checkedSubSteps, setCheckedSubSteps] = useState<Record<string, boolean>>({});
  const [pacingFeedback, setPacingFeedback] = useState<string | null>(null);

  const userId = profile?.id || 'guest';
  const isDemo = Boolean(profile?.is_demo);

  const [pushSettingsState, setPushSettingsState] = useState<{
    key: string;
    value: DetailedNotificationSettings;
  }>(() => ({
    key: userId,
    value: notificationService.getNotificationSettings(userId, profile),
  }));

  const pushSettings =
    pushSettingsState.key === userId
      ? pushSettingsState.value
      : notificationService.getNotificationSettings(userId, profile);

  const setPushSettings = useCallback(
    (
      updater:
        | DetailedNotificationSettings
        | ((prev: DetailedNotificationSettings) => DetailedNotificationSettings)
    ) => {
      setPushSettingsState((prev) => {
        const base =
          prev.key === userId
            ? prev.value
            : notificationService.getNotificationSettings(userId, profile);
        const nextValue = typeof updater === 'function' ? updater(base) : updater;
        return { key: userId, value: nextValue };
      });
    },
    [userId, profile]
  );

  const [pushStatus, setPushStatus] = useState<'loading' | 'unsupported' | 'disabled' | 'enabled'>('loading');
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isSavingPush, setIsSavingPush] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let active = true;
    notificationService
      .getPushStatus(userId, isDemo)
      .then((status) => {
        if (active) setPushStatus(status);
      })
      .catch(() => {
        if (active) setPushStatus('disabled');
      });
    return () => {
      active = false;
    };
  }, [userId, isDemo]);

  const dailyMinutes = profile?.daily_minutes || 60;
  const roleName = profile?.target_role || 'Career Plan';
  const streakDays = profile?.streak_days ?? 0;

  const activeMilestoneIndex = useMemo(() => {
    if (milestones.length === 0) return 0;
    for (let i = 0; i < milestones.length; i += 1) {
      const mTasks = tasks.filter((t) => t.milestone_id === milestones[i].id);
      if (mTasks.some((t) => t.done_at == null)) return i;
    }
    return 0;
  }, [milestones, tasks]);

  const currentMilestone = useMemo(() => {
    if (selectedMilestoneId) {
      return milestones.find((m) => m.id === selectedMilestoneId) || milestones[activeMilestoneIndex] || milestones[0];
    }
    return milestones[activeMilestoneIndex] || milestones[0];
  }, [milestones, selectedMilestoneId, activeMilestoneIndex]);

  const currentStageNumber = useMemo(() => {
    if (!currentMilestone) return 1;
    const idx = milestones.findIndex((m) => m.id === currentMilestone.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [milestones, currentMilestone]);

  const currentTasks = useMemo(() => {
    if (!currentMilestone) return [];
    return tasks.filter((t) => t.milestone_id === currentMilestone.id);
  }, [currentMilestone, tasks]);

  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.done_at != null).length, [tasks]);
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentStageDone = useMemo(() => currentTasks.filter((t) => t.done_at != null).length, [currentTasks]);
  const currentStagePct = currentTasks.length > 0 ? Math.round((currentStageDone / currentTasks.length) * 100) : 0;

  const activeTask = useMemo(() => {
    if (selectedTaskId) {
      const found = currentTasks.find((t) => t.id === selectedTaskId);
      if (found) return found;
    }
    return currentTasks.find((t) => t.done_at == null) || currentTasks[0] || null;
  }, [currentTasks, selectedTaskId]);

  const weeklyHours = ((dailyMinutes * 5) / 60).toFixed(1);

  const handlePacingAction = (action: 'behind' | 'early' | 'pause') => {
    if (action === 'early') {
      setSelectedMilestoneId(null);
    }
    onApplyPlannerAction?.(action);
    const messages: Record<'behind' | 'early' | 'pause', string> = {
      behind: 'Added +3 days buffer across upcoming dates.',
      early: 'Stage advanced — queue updated.',
      pause: 'Schedule paused for 7 days. Streak preserved.',
    };
    setPacingFeedback(messages[action]);
    window.setTimeout(() => setPacingFeedback(null), 4000);
  };

  const handleTaskCheck = useCallback(
    (task: Task, e: React.MouseEvent) => {
      e.stopPropagation();
      const wasDone = task.done_at != null;
      onToggleTaskComplete(task.id);
      if (!wasDone) {
        try {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          confetti({
            particleCount: 24,
            spread: 48,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            },
            colors: ['#123C69', '#059669', '#64748B'],
          });
        } catch {
          // Ignore confetti errors in headless tests
        }
      }
    },
    [onToggleTaskComplete]
  );

  const handleRowSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setMobileExpandedId((prev) => (prev === taskId ? null : taskId));
  };

  const toggleSubStep = (stepKey: string) => {
    setCheckedSubSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const activeGuide = useMemo(() => {
    if (!activeTask) return null;
    return buildGoalGuide(activeTask, roleName);
  }, [activeTask, roleName]);

  const showPushNotice = (text: string, tone: 'success' | 'error' = 'success') => {
    setPushFeedback({ text, tone });
    window.setTimeout(() => setPushFeedback(null), 4500);
  };

  const handleToggleDevicePush = async () => {
    setIsUpdatingPush(true);
    try {
      if (pushStatus === 'enabled') {
        await notificationService.disableSmartPush(userId, isDemo, pushSettings);
        const updated = { ...pushSettings, push_enabled: false };
        setPushSettings(updated);
        setPushStatus('disabled');
        showPushNotice('Device push alerts paused.');
      } else {
        const res = await notificationService.enableSmartPush(userId, isDemo, pushSettings);
        const updated = { ...pushSettings, push_enabled: true };
        setPushSettings(updated);
        setPushStatus('enabled');
        showPushNotice(
          res.mode === 'web-push'
            ? 'Background Web Push active for scheduled reminders.'
            : 'Browser push alerts enabled for your study schedule.'
        );
      }
    } catch (e) {
      showPushNotice(e instanceof Error ? e.message : 'Could not update push permission.', 'error');
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleSavePushSettings = async (nextSettings = pushSettings) => {
    setIsSavingPush(true);
    try {
      await notificationService.saveNotificationSettings(userId, isDemo, nextSettings);
      showPushNotice('Push reminder schedule saved.');
    } catch {
      showPushNotice('Could not save notification preferences.', 'error');
    } finally {
      setIsSavingPush(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!profile) return;
    setIsTestingPush(true);
    try {
      const granted = await notificationService.triggerTestReminder(tasks, profile);
      if (granted) {
        setPushStatus('enabled');
        setPushSettings((prev) => ({ ...prev, push_enabled: true }));
      }
      showPushNotice(
        granted
          ? 'Real push notification delivered to your browser.'
          : 'Saved in-app notification (grant browser permission for OS banners).'
      );
    } catch (e) {
      showPushNotice(e instanceof Error ? e.message : 'Could not send test push.', 'error');
    } finally {
      setIsTestingPush(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setPushSettings((prev) => {
      const exists = prev.selected_days.includes(dayIndex);
      if (exists && prev.selected_days.length === 1) return prev; // keep at least one day
      const nextDays = exists
        ? prev.selected_days.filter((d) => d !== dayIndex)
        : [...prev.selected_days, dayIndex];
      return { ...prev, selected_days: nextDays };
    });
  };

  const pushEnabled = pushStatus === 'enabled' || (pushSettings.push_enabled && notificationService.getPermission() === 'granted');
  const nextQueuedTask = useMemo(() => tasks.find((t) => t.done_at == null) || currentTasks[0] || null, [tasks, currentTasks]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }}>
      {/* Minimalist Top Header with Modern Command Toolbar */}
      <header
        className="m3-surface-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ minWidth: 0, flex: '1 1 260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--md-primary)' }}>
                Agenda
              </span>
              <span style={{ color: 'var(--md-text-muted)', fontSize: '11px' }}>·</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
                {roleName}
              </span>
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--md-text-primary)', letterSpacing: '-0.02em' }}>
              {currentMilestone ? `Stage ${currentStageNumber}: ${currentMilestone.title}` : 'Study Plan'}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: 'var(--md-text-secondary)', fontWeight: 500 }}>
              <span>{dailyMinutes}m/day ({weeklyHours}h/wk)</span>
              <span>{completedTasks}/{totalTasks} tasks ({overallPct}%)</span>
              {streakDays > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--md-primary)', fontWeight: 600 }}>
                  <Flame size={13} /> {streakDays}d streak
                </span>
              )}
            </div>
          </div>

          {/* Modern Segmented & Icon Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenGoalSettings}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '9px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Customize daily minutes and target timeline"
            >
              <SlidersHorizontal size={13} color="var(--md-primary)" />
              <span>{dailyMinutes}m Pace</span>
            </button>

            {onOpenCoach && (
              <button
                type="button"
                onClick={onOpenCoach}
                style={{
                  height: '34px',
                  padding: '0 13px',
                  borderRadius: '9px',
                  border: '1px solid var(--md-primary)',
                  background: 'var(--md-primary)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={13} />
                <span>AI Coach</span>
              </button>
            )}

            {onApplyPlannerAction && (
              <div
                role="group"
                aria-label="Timeline adjustments"
                style={{
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--md-surface)',
                  border: '1px solid var(--md-outline-variant)',
                  borderRadius: '9px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePacingAction('behind')}
                  title="Shift upcoming dates by +3 days"
                  style={{
                    height: '100%',
                    padding: '0 10px',
                    border: 'none',
                    borderRight: '1px solid var(--md-outline-variant)',
                    background: 'transparent',
                    color: 'var(--md-text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Clock size={12} /> +3d
                </button>
                <button
                  type="button"
                  onClick={() => handlePacingAction('early')}
                  title="Advance to next milestone early"
                  style={{
                    height: '100%',
                    padding: '0 10px',
                    border: 'none',
                    borderRight: '1px solid var(--md-outline-variant)',
                    background: 'transparent',
                    color: 'var(--md-text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <FastForward size={12} /> Advance
                </button>
                <button
                  type="button"
                  onClick={() => handlePacingAction('pause')}
                  title="Pause study schedule for 7 days"
                  style={{
                    height: '100%',
                    padding: '0 10px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--md-text-secondary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Pause size={12} /> Pause
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('push')}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '9px',
                border: activeTab === 'push' ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                background: activeTab === 'push' ? 'var(--md-primary-container)' : 'var(--md-surface)',
                color: activeTab === 'push' ? 'var(--md-primary)' : 'var(--md-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Customize push notification schedule"
            >
              <Bell size={13} color={pushEnabled ? '#059669' : 'var(--md-primary)'} />
              <span>Push</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: pushEnabled ? '#059669' : '#94A3B8',
                }}
              />
            </button>
          </div>
        </div>

        {/* Hairline Progress + Stage Switcher Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', height: '5px', borderRadius: '999px', background: 'var(--md-surface-muted)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${currentStagePct}%`,
                height: '100%',
                background: 'var(--md-primary)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            Stage {currentStageDone}/{currentTasks.length} ({currentStagePct}%)
          </span>

          {milestones.length > 1 && (
            <select
              aria-label="Select roadmap stage"
              value={currentMilestone?.id || ''}
              onChange={(e) => {
                setSelectedMilestoneId(e.target.value || null);
                setSelectedTaskId(null);
                setMobileExpandedId(null);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {milestones.map((m, idx) => (
                <option key={m.id} value={m.id}>
                  Stage {idx + 1}: {m.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {pacingFeedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--md-primary-container)',
            border: '1px solid var(--md-primary)',
            color: 'var(--md-primary)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={14} />
          <span>{pacingFeedback}</span>
        </div>
      )}

      {/* Minimalist View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--md-surface)',
            border: '1px solid var(--md-outline-variant)',
            borderRadius: '10px',
            padding: '3px',
            gap: '3px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'agenda' as const, label: 'Agenda', icon: <ListChecks size={13} /> },
            { id: 'grid' as const, label: 'Week Grid', icon: <CalendarDays size={13} /> },
            { id: 'stages' as const, label: `Stages (${milestones.length})`, icon: <Layers size={13} /> },
            { id: 'push' as const, label: 'Push Alerts', icon: <Bell size={13} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: active ? 'var(--md-primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--md-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Asymmetric 2-Pane Agenda + Task Inspector */}
      {activeTab === 'agenda' && (
        <div className="ws-agenda-layout">
          {/* Left: Crisp Hairline Queue */}
          <div
            className="m3-surface-card"
            style={{
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--md-outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)', letterSpacing: '0.01em' }}>
                Queue · Stage {currentStageNumber}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)' }}>
                {currentTasks.length} tasks
              </span>
            </div>

            {currentTasks.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--md-text-secondary)' }}>
                No tasks scheduled for this stage.
              </div>
            ) : (
              <div>
                {currentTasks.map((task, idx) => {
                  const isDone = task.done_at != null;
                  const isSelected = activeTask?.id === task.id;
                  const isMobileOpen = mobileExpandedId === task.id;
                  const guide = isMobileOpen ? buildGoalGuide(task, roleName) : null;
                  const dayLabel = DAY_NAMES[idx % 5];
                  const meta = TYPE_META[task.type || 'Learn'];

                  return (
                    <div
                      key={task.id}
                      style={{
                        borderBottom: idx < currentTasks.length - 1 ? '1px solid var(--md-outline-variant)' : 'none',
                        borderLeft: isSelected ? '3px solid var(--md-primary)' : '3px solid transparent',
                        background: isSelected ? 'var(--md-primary-container)' : 'transparent',
                        transition: 'background 0.14s ease',
                      }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowSelect(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRowSelect(task.id);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '13px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleTaskCheck(task, e)}
                          aria-label={isDone ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: isDone ? 'none' : '1.5px solid var(--md-outline)',
                            background: isDone ? '#059669' : 'var(--md-surface)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                        >
                          {isDone && <Check size={12} strokeWidth={3} />}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13.5px',
                              fontWeight: isSelected ? 700 : 600,
                              color: isDone ? 'var(--md-text-muted)' : 'var(--md-text-primary)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              {meta.icon} {meta.label}
                            </span>
                            <span>·</span>
                            <span>{dayLabel}</span>
                            <span>·</span>
                            <span>{task.est_minutes || 45}m</span>
                          </div>
                        </div>

                        <ChevronRight size={14} style={{ color: isSelected ? 'var(--md-primary)' : 'var(--md-text-muted)', flexShrink: 0 }} />
                      </div>

                      {/* Mobile Inline Runbook (< 900px only) */}
                      {isMobileOpen && guide && (
                        <div
                          className="ws-mobile-inline-detail"
                          style={{
                            padding: '0 16px 14px 48px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--md-text-secondary)', lineHeight: 1.45 }}>
                            {guide.summary}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {guide.steps.map((step, sIdx) => {
                              const stepKey = `${task.id}-${sIdx}`;
                              const stepDone = !!checkedSubSteps[stepKey];
                              return (
                                <label
                                  key={stepKey}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    fontSize: '12px',
                                    color: stepDone ? 'var(--md-text-muted)' : 'var(--md-text-primary)',
                                    textDecoration: stepDone ? 'line-through' : 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={stepDone}
                                    onChange={() => toggleSubStep(stepKey)}
                                    style={{ accentColor: 'var(--md-primary)', marginTop: '2px' }}
                                  />
                                  <span>{step.title}</span>
                                </label>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                            <strong style={{ color: 'var(--md-text-primary)' }}>Output:</strong> {guide.deliverable}
                          </div>
                          <TaskResourceLink resource={task.resource} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Sticky Desktop Focus Inspector */}
          {activeTask && activeGuide && (
            <aside
              className="m3-surface-card ws-desktop-inspector"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--md-primary)' }}>
                    Task Focus
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)' }}>
                    {activeGuide.split}
                  </span>
                </div>

                <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--md-text-primary)', lineHeight: 1.35 }}>
                  {activeTask.title}
                </h2>

                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--md-text-secondary)', lineHeight: 1.5 }}>
                  {activeGuide.summary}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--md-outline-variant)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Execution Steps
                </span>
                {activeGuide.steps.map((step, sIdx) => {
                  const stepKey = `${activeTask.id}-${sIdx}`;
                  const stepDone = !!checkedSubSteps[stepKey];
                  return (
                    <button
                      key={stepKey}
                      type="button"
                      onClick={() => toggleSubStep(stepKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-outline-variant)',
                        background: stepDone ? 'var(--md-surface-subtle)' : 'var(--md-surface)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          marginTop: '1px',
                          border: stepDone ? 'none' : '1.5px solid var(--md-outline)',
                          background: stepDone ? 'var(--md-primary)' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {stepDone && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: stepDone ? 'var(--md-text-muted)' : 'var(--md-text-primary)',
                            textDecoration: stepDone ? 'line-through' : 'none',
                          }}
                        >
                          {step.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--md-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                          {step.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--md-surface-subtle)', fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                <strong style={{ color: 'var(--md-text-primary)', fontWeight: 700 }}>Deliverable:</strong> {activeGuide.deliverable}
              </div>

              <TaskResourceLink resource={activeTask.resource} />

              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={(e) => handleTaskCheck(activeTask, e)}
                  className="btn-m3-primary"
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    fontSize: '12.5px',
                    background: activeTask.done_at != null ? '#059669' : 'var(--md-primary)',
                  }}
                >
                  <Check size={14} />
                  {activeTask.done_at != null ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* TAB 2: Minimalist 7-Day Week Grid */}
      {activeTab === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
          }}
        >
          {DAY_NAMES.map((day, dIdx) => {
            const isWeekend = dIdx >= 5;
            const dayTasks = isWeekend ? [] : currentTasks.filter((_, idx) => idx % 5 === dIdx);
            return (
              <div
                key={day}
                className="m3-surface-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '140px',
                  background: isWeekend ? 'var(--md-surface-subtle)' : 'var(--md-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isWeekend ? 'var(--md-text-muted)' : 'var(--md-primary)' }}>
                    {day}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--md-text-muted)', fontWeight: 600 }}>
                    {isWeekend ? 'Rest' : `${dayTasks.length}`}
                  </span>
                </div>

                {isWeekend ? (
                  <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--md-text-muted)', lineHeight: 1.4 }}>
                    Recovery & light recap
                  </p>
                ) : dayTasks.length === 0 ? (
                  <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--md-text-muted)' }}>
                    Open block
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayTasks.map((t) => {
                      const done = t.done_at != null;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            setMobileExpandedId(t.id);
                            setActiveTab('agenda');
                          }}
                          style={{
                            padding: '8px 9px',
                            borderRadius: '7px',
                            border: '1px solid var(--md-outline-variant)',
                            background: 'var(--md-surface)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: done ? 'var(--md-text-muted)' : 'var(--md-text-primary)',
                            textDecoration: done ? 'line-through' : 'none',
                            lineHeight: 1.35,
                          }}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Clean Stages Overview */}
      {activeTab === 'stages' && (
        <div className="m3-surface-card" style={{ padding: 0, overflow: 'hidden' }}>
          {milestones.map((m, idx) => {
            const mTasks = tasks.filter((t) => t.milestone_id === m.id);
            const doneCount = mTasks.filter((t) => t.done_at != null).length;
            const pct = mTasks.length > 0 ? Math.round((doneCount / mTasks.length) * 100) : 0;
            const isCurrent = currentMilestone?.id === m.id;

            return (
              <div
                key={m.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: idx < milestones.length - 1 ? '1px solid var(--md-outline-variant)' : 'none',
                  borderLeft: isCurrent ? '3px solid var(--md-primary)' : '3px solid transparent',
                  background: isCurrent ? 'var(--md-primary-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)' }}>
                      STAGE {idx + 1}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                      {doneCount}/{mTasks.length} tasks · {m.effort_hours || 25}h
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                    {m.title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '90px', height: '5px', borderRadius: '999px', background: 'var(--md-surface-muted)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#059669' : 'var(--md-primary)' }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMilestoneId(m.id);
                      setSelectedTaskId(null);
                      setMobileExpandedId(null);
                      setActiveTab('agenda');
                    }}
                    className="btn-m3-tonal"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Open <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: Full Functional Push Notification Customization */}
      {activeTab === 'push' && (
        <div className="ws-agenda-layout">
          {/* Left: Customization Controls */}
          <div className="m3-surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Device Push Status Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--md-outline-variant)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                    Browser &amp; OS Push
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: pushEnabled ? 'rgba(5, 150, 105, 0.12)' : 'var(--md-surface-muted)',
                      color: pushEnabled ? '#059669' : 'var(--md-text-secondary)',
                    }}
                  >
                    {pushEnabled ? 'Active' : pushStatus === 'unsupported' ? 'Unsupported' : 'Off'}
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                  Permission: {notificationService.getPermission()} · Service Worker ready
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleToggleDevicePush()}
                disabled={isUpdatingPush || pushStatus === 'unsupported'}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: pushEnabled ? '1px solid var(--md-outline-variant)' : 'none',
                  background: pushEnabled ? 'var(--md-surface)' : 'var(--md-primary)',
                  color: pushEnabled ? 'var(--md-text-primary)' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: pushStatus === 'unsupported' ? 'not-allowed' : 'pointer',
                }}
              >
                {isUpdatingPush ? 'Updating…' : pushEnabled ? 'Disable Push' : 'Enable Push'}
              </button>
            </div>

            {pushFeedback && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: pushFeedback.tone === 'error' ? 'rgba(185, 28, 28, 0.08)' : 'var(--md-primary-container)',
                  color: pushFeedback.tone === 'error' ? '#B91C1C' : 'var(--md-primary)',
                  border: `1px solid ${pushFeedback.tone === 'error' ? 'rgba(185, 28, 28, 0.25)' : 'var(--md-primary)'}`,
                }}
              >
                {pushFeedback.text}
              </div>
            )}

            {/* Time + Lead Notice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                  Reminder Time
                </span>
                <input
                  type="time"
                  aria-label="Study reminder time"
                  value={pushSettings.daily_reminder_time}
                  onChange={(e) => setPushSettings((prev) => ({ ...prev, daily_reminder_time: e.target.value || '09:00' }))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-outline-variant)',
                    background: 'var(--md-surface)',
                    color: 'var(--md-text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_TIMES.map((timeStr) => {
                  const active = pushSettings.daily_reminder_time === timeStr;
                  return (
                    <button
                      key={timeStr}
                      type="button"
                      onClick={() => setPushSettings((prev) => ({ ...prev, daily_reminder_time: timeStr }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '7px',
                        border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                        background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                        color: active ? '#ffffff' : 'var(--md-text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {timeStr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Days Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                Active Study Days
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {WEEKDAY_CHOICES.map(({ day, label }) => {
                  const active = pushSettings.selected_days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '6px 11px',
                        borderRadius: '8px',
                        border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                        background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                        color: active ? '#ffffff' : 'var(--md-text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lead Time & Weekly Check-in Cadence */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Lead Notice
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {([
                    { v: 0 as const, label: 'On time' },
                    { v: 15 as const, label: '15m' },
                    { v: 30 as const, label: '30m' },
                    { v: 60 as const, label: '1h' },
                  ]).map((opt) => {
                    const active = pushSettings.lead_minutes === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setPushSettings((prev) => ({ ...prev, lead_minutes: opt.v }))}
                        style={{
                          padding: '5px 9px',
                          borderRadius: '7px',
                          border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                          background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                          color: active ? '#ffffff' : 'var(--md-text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Check-in Cadence
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['2x', '3x', '4x'] as const).map((freq) => {
                    const active = pushSettings.weekly_frequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setPushSettings((prev) => ({ ...prev, weekly_frequency: freq }))}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '7px',
                          border: active ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                          background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                          color: active ? '#ffffff' : 'var(--md-text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {freq}/wk
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                  <Moon size={13} color="var(--md-primary)" /> Quiet Hours
                </span>
                <input
                  type="checkbox"
                  aria-label="Enable quiet hours"
                  checked={pushSettings.quiet_hours_enabled}
                  onChange={(e) => setPushSettings((prev) => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
                  style={{ accentColor: 'var(--md-primary)', width: '15px', height: '15px', cursor: 'pointer' }}
                />
              </div>
              {pushSettings.quiet_hours_enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                  <span>Pause from</span>
                  <input
                    type="time"
                    aria-label="Quiet hours start"
                    value={pushSettings.quiet_hours_start}
                    onChange={(e) => setPushSettings((prev) => ({ ...prev, quiet_hours_start: e.target.value || '22:00' }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--md-outline-variant)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    aria-label="Quiet hours end"
                    value={pushSettings.quiet_hours_end}
                    onChange={(e) => setPushSettings((prev) => ({ ...prev, quiet_hours_end: e.target.value || '07:30' }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--md-outline-variant)',
                      background: 'var(--md-surface)',
                      color: 'var(--md-text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Alert Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
              {[
                { key: 'daily_reminder' as const, label: 'Daily Study Prompts' },
                { key: 'streak_alerts' as const, label: 'Streak Risk Guard' },
                { key: 'milestone_alerts' as const, label: 'Milestone Alerts' },
                { key: 'sound_enabled' as const, label: 'Notification Chime' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-outline-variant)',
                    background: 'var(--md-surface)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--md-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {item.key === 'sound_enabled' && (
                      pushSettings.sound_enabled ? <Volume2 size={13} color="var(--md-primary)" /> : <VolumeX size={13} color="var(--md-text-muted)" />
                    )}
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(pushSettings[item.key])}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPushSettings((prev) => ({ ...prev, [item.key]: checked }));
                      if (item.key === 'sound_enabled' && checked) {
                        notificationService.playChime();
                      }
                    }}
                    style={{ accentColor: 'var(--md-primary)', width: '15px', height: '15px' }}
                  />
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => void handleSavePushSettings()}
                disabled={isSavingPush}
                className="btn-m3-primary"
                style={{ padding: '9px 18px', fontSize: '12.5px', background: 'var(--md-primary)' }}
              >
                <Check size={14} />
                {isSavingPush ? 'Saving…' : 'Save Push Schedule'}
              </button>
            </div>
          </div>

          {/* Right: Live OS Banner Preview + Immediate Test */}
          <aside className="m3-surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--md-primary)' }}>
                Live Notification Preview
              </span>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface-subtle)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--md-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={15} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                    Career Pilot
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--md-text-muted)' }}>
                    {pushSettings.daily_reminder_time}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)', marginBottom: '2px' }}>
                  {pushSettings.lead_minutes > 0 ? `Starts in ${pushSettings.lead_minutes}m` : 'Study Block Ready'} · {roleName}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', lineHeight: 1.4 }}>
                  {nextQueuedTask
                    ? `${nextQueuedTask.title} (${nextQueuedTask.est_minutes || 45}m)`
                    : 'Your scheduled study block is ready.'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', lineHeight: 1.55 }}>
              <div>
                <strong style={{ color: 'var(--md-text-primary)' }}>Schedule:</strong>{' '}
                {WEEKDAY_CHOICES.filter((d) => pushSettings.selected_days.includes(d.day)).map((d) => d.label).join(', ')} at {pushSettings.daily_reminder_time}
              </div>
              <div>
                <strong style={{ color: 'var(--md-text-primary)' }}>Quiet Hours:</strong>{' '}
                {pushSettings.quiet_hours_enabled
                  ? `${pushSettings.quiet_hours_start} – ${pushSettings.quiet_hours_end}`
                  : 'Off'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSendTestPush()}
              disabled={isTestingPush}
              style={{
                height: '36px',
                borderRadius: '9px',
                border: '1px solid var(--md-outline-variant)',
                background: 'var(--md-surface)',
                color: 'var(--md-primary)',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                cursor: 'pointer',
              }}
            >
              <Send size={13} />
              {isTestingPush ? 'Sending Push…' : 'Send Real Test Push'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};
