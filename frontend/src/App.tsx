import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { AppScreenSkeleton, WorkspaceSkeleton } from './components/SkeletonScreen';
import { authService } from './features/auth/authService';
import { addResourceTask, addSkillTask, completeTask, createRoadmap, loadActiveRoadmap, saveCareerPlan } from './features/roadmap/roadmapRepository';
import { notificationService } from './features/notifications/notificationService';
import { loadAIQuotaSummary, requestAI } from './features/ai/aiGateway';
import type { AIQuotaSummary } from './features/ai/aiGateway';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { daysBetweenDateOnly, getLocalDateOnly } from './lib/dateOnly';
import { getInitialTheme, applyTheme } from './lib/theme';
import type { ThemeMode } from './lib/theme';
import type { ActiveNavTab, Task, AICoachMessage, Profile, Milestone } from './types';
import type { RolePlanOutline } from './features/roadmap/careerCatalog';

const RoadmapView = lazy(() => import('./features/roadmap/RoadmapView').then((module) => ({ default: module.RoadmapView })));
const WeeklyScheduleView = lazy(() => import('./features/roadmap/WeeklyScheduleView').then((module) => ({ default: module.WeeklyScheduleView })));
const CheckpointHistoryPanel = lazy(() => import('./features/roadmap/CheckpointHistoryPanel').then((module) => ({ default: module.CheckpointHistoryPanel })));
const OverviewAnalyticsView = lazy(() => import('./components/OverviewAnalyticsView').then((module) => ({ default: module.OverviewAnalyticsView })));
const ProfileAccountView = lazy(() => import('./components/ProfileAccountView').then((module) => ({ default: module.ProfileAccountView })));
const AICoachView = lazy(() => import('./features/coach/AICoachView').then((module) => ({ default: module.AICoachView })));
const InterviewSimulatorView = lazy(() => import('./components/InterviewSimulatorView').then((module) => ({ default: module.InterviewSimulatorView })));
const CVBuilderView = lazy(() => import('./components/CVBuilderView').then((module) => ({ default: module.CVBuilderView })));
const SkillGapView = lazy(() => import('./components/SkillGapView').then((module) => ({ default: module.SkillGapView })));
const CheckpointQuizModal = lazy(() => import('./features/roadmap/CheckpointQuizModal').then((module) => ({ default: module.CheckpointQuizModal })));
const RoleQuestSelectorModal = lazy(() => import('./components/RoleQuestSelectorModal').then((module) => ({ default: module.RoleQuestSelectorModal })));
const OnboardingGoalModal = lazy(() => import('./features/onboarding/OnboardingGoalModal').then((module) => ({ default: module.OnboardingGoalModal })));
const NotificationCenterModal = lazy(() => import('./features/notifications/NotificationCenterModal').then((module) => ({ default: module.NotificationCenterModal })));
const AuthScreen = lazy(() => import('./features/auth/AuthScreen').then((module) => ({ default: module.AuthScreen })));
const PasswordRecoveryScreen = lazy(() => import('./features/auth/PasswordRecoveryScreen').then((module) => ({ default: module.PasswordRecoveryScreen })));
const MFAChallengeScreen = lazy(() => import('./features/auth/MFAChallengeScreen').then((module) => ({ default: module.MFAChallengeScreen })));
const QuickActionSheetModal = lazy(() => import('./components/QuickActionSheetModal').then((module) => ({ default: module.QuickActionSheetModal })));
const ProfileSettingsModal = lazy(() => import('./components/ProfileSettingsModal').then((module) => ({ default: module.ProfileSettingsModal })));
const SignOutModal = lazy(() => import('./components/SignOutModal').then((module) => ({ default: module.SignOutModal })));

const APP_TABS: ActiveNavTab[] = ['home', 'plan', 'overview', 'coach', 'interview', 'cv', 'skills', 'profile'];

function getTabFromUrl(): ActiveNavTab {
  const requestedTab = new URLSearchParams(window.location.search).get('view');
  return APP_TABS.includes(requestedTab as ActiveNavTab) ? requestedTab as ActiveNavTab : 'home';
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>(getTabFromUrl);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMFARequired, setIsMFARequired] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const workspaceRequestId = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const [coachMessages, setCoachMessages] = useState<AICoachMessage[]>([]);
  const [isCoachSending, setIsCoachSending] = useState(false);
  const [aiQuota, setAIQuota] = useState<AIQuotaSummary | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<Record<string, string>>({});

  // Modals & Sheets
  const [activeQuizTask, setActiveQuizTask] = useState<Task | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  const navigateToTab = (tab: ActiveNavTab) => {
    if (tab === activeTab) return;
    const url = new URL(window.location.href);
    if (tab === 'home') url.searchParams.delete('view');
    else url.searchParams.set('view', tab);
    window.history.pushState({ view: tab }, '', url);
    setActiveTab(tab);
  };

  useEffect(() => {
    const restoreTabFromHistory = () => setActiveTab(getTabFromUrl());
    window.addEventListener('popstate', restoreTabFromHistory);
    return () => window.removeEventListener('popstate', restoreTabFromHistory);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const refreshEarnedAchievements = async (userProfile: Profile) => {
    if (userProfile.is_demo) {
      setEarnedAchievements({});
      return;
    }
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id,unlocked_at')
      .eq('user_id', userProfile.id);
    if (error) {
      console.error('Could not load earned achievements:', error);
      return;
    }
    setEarnedAchievements(Object.fromEntries((data ?? []).map((row) => [row.achievement_id, row.unlocked_at])));
  };

  const refreshAIQuota = async (userProfile: Profile) => {
    if (userProfile.is_demo) {
      setAIQuota(null);
      return;
    }
    try {
      const quota = await loadAIQuotaSummary(userProfile.id, userProfile.plan);
      setAIQuota(quota);
    } catch (error) {
      console.error('Could not load AI quota usage:', error);
      setAIQuota(null);
    }
  };

  const syncWorkspace = async (userProfile: Profile): Promise<boolean> => {
    const requestId = ++workspaceRequestId.current;
    if (!userProfile.is_demo) {
      const { data, error } = await supabase
        .from('ai_coach_messages')
        .select('id,sender,message,proposal,created_at')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!error && requestId === workspaceRequestId.current) {
        setCoachMessages((data ?? []).map((row: any) => ({
          id: row.id,
          sender: row.sender,
          text: row.message,
          timestamp: row.created_at,
          proposal: row.proposal ?? undefined,
        })));
      }
    } else {
      setCoachMessages([]);
    }
    await refreshEarnedAchievements(userProfile);
    await refreshAIQuota(userProfile);
    if (!userProfile.target_role) {
      if (requestId === workspaceRequestId.current) {
        setMilestones([]);
        setTasks([]);
        setWorkspaceError(null);
        setIsWorkspaceLoading(false);
      }
      return true;
    }

    setIsWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      if (userProfile.is_demo) {
        const { generateRoadmapForRole, generateTasksForMilestones } = await import('./features/roadmap/plannerEngine');
        const generated = generateRoadmapForRole(
          userProfile.target_role,
          userProfile.target_timeline_months || 6,
          userProfile.daily_minutes || 60,
          userProfile.target_completion_date,
          userProfile.experience_level || 'beginner',
          userProfile.target_role_category
        );
        let generatedTasks = generateTasksForMilestones(
          generated,
          userProfile.target_role,
          userProfile.experience_level || 'beginner',
          userProfile.target_role_category
        );
        if (import.meta.env.DEV && userProfile.is_demo) {
          const { attachDemoCheckpointQuizzes } = await import('./features/roadmap/demoCheckpointQuizzes');
          generatedTasks = attachDemoCheckpointQuizzes(generatedTasks);
        }
        if (requestId === workspaceRequestId.current) {
          setMilestones(generated);
          setTasks(generatedTasks);
        }
        return true;
      }

      let workspace = await loadActiveRoadmap(userProfile.id);
      if (!workspace) {
        if (!userProfile.target_completion_date) {
          if (requestId === workspaceRequestId.current) {
            setMilestones([]);
            setTasks([]);
          }
          return true;
        }
        const { generateRoadmapForRole, generateTasksForMilestones } = await import('./features/roadmap/plannerEngine');
        const generated = generateRoadmapForRole(
          userProfile.target_role,
          userProfile.target_timeline_months || 6,
          userProfile.daily_minutes || 60,
          userProfile.target_completion_date,
          userProfile.experience_level || 'beginner',
          userProfile.target_role_category
        );
        const generatedTasks = generateTasksForMilestones(generated, userProfile.target_role, userProfile.experience_level || 'beginner', userProfile.target_role_category);
        workspace = await createRoadmap(userProfile, generated, generatedTasks);
      }
      if (requestId === workspaceRequestId.current) {
        if (!userProfile.target_completion_date && workspace.targetDate) {
          setProfile((prev) => prev && prev.id === userProfile.id
            ? { ...prev, target_completion_date: workspace.targetDate, has_completed_onboarding: true }
            : prev);
        }
        setMilestones(workspace.milestones);
        setTasks(workspace.tasks);
      }
      return true;
    } catch (error) {
      console.error('Could not load the saved roadmap:', error);
      if (requestId === workspaceRequestId.current) {
        setWorkspaceError('Your roadmap could not be loaded. Check your connection and try again.');
      }
      return false;
    } finally {
      if (requestId === workspaceRequestId.current) setIsWorkspaceLoading(false);
    }
  };

  const activateProfile = async (userProfile: Profile) => {
    if (activeUserIdRef.current === userProfile.id && profile?.id === userProfile.id) {
      return;
    }
    activeUserIdRef.current = userProfile.id;
    setWorkspaceError(null);
    setProfile(userProfile);
    await syncWorkspace(userProfile);
  };

  const activateProfileRef = useRef(activateProfile);
  useEffect(() => {
    activateProfileRef.current = activateProfile;
  });

  // Restore the real Supabase identity before showing protected screens.
  useEffect(() => {
    let active = true;
    const isSyncingAuth = { current: false };

    const cleanAuthRedirectParams = () => {
      const url = new URL(window.location.href);
      let changed = false;
      for (const param of ['code', 'error', 'error_code', 'error_description']) {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          changed = true;
        }
      }
      if (changed) {
        window.history.replaceState({}, '', url);
      }
    };

    const hydrateAuthenticatedSession = async (recoveryRequested: boolean) => {
      if (isSyncingAuth.current) return;
      isSyncingAuth.current = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (assuranceError) throw assuranceError;
          if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
            if (active) setIsMFARequired(true);
            return;
          }
        }
        if (recoveryRequested) {
          if (active) setIsPasswordRecovery(true);
          return;
        }
        const restoredProfile = user ? await authService.loadProfile(user) : null;
        if (active && restoredProfile && activeUserIdRef.current !== restoredProfile.id) {
          await activateProfileRef.current(restoredProfile);
        }
        cleanAuthRedirectParams();
      } finally {
        isSyncingAuth.current = false;
      }
    };

    const restore = async () => {
      try {
        if (!isSupabaseConfigured()) return;
        const currentUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
        const redirectError = currentUrl.searchParams.get('error_description') || hashParams.get('error_description');
        if (redirectError) {
          showToast(redirectError);
          cleanAuthRedirectParams();
        }
        const recoveryRequested =
          currentUrl.searchParams.get('recovery') === '1' ||
          currentUrl.searchParams.get('type') === 'recovery' ||
          hashParams.get('type') === 'recovery';
        if (recoveryRequested && active) setIsPasswordRecovery(true);
        await hydrateAuthenticatedSession(recoveryRequested);
      } catch (error) {
        console.warn('Could not restore the authenticated profile:', error);
      } finally {
        if (active) setIsAuthReady(true);
      }
    };
    void restore();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        activeUserIdRef.current = null;
        setIsPasswordRecovery(true);
        setProfile(null);
        return;
      }
      if (event === 'SIGNED_OUT') {
        activeUserIdRef.current = null;
        workspaceRequestId.current += 1;
        setProfile(null);
        setIsMFARequired(false);
        setEarnedAchievements({});
        setMilestones([]);
        setTasks([]);
        setWorkspaceError(null);
        setIsWorkspaceLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUrl = new URL(window.location.href);
        const recoveryRequested = currentUrl.searchParams.get('recovery') === '1' || currentUrl.searchParams.get('type') === 'recovery';
        if (!recoveryRequested) {
          void hydrateAuthenticatedSession(false);
        }
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Add an in-app reminder when the active workspace refreshes with unfinished tasks or tasks due today,
  // and evaluate custom scheduled push reminders periodically while active.
  useEffect(() => {
    if (!profile || !profile.has_completed_onboarding) return;
    const runChecks = () => {
      void notificationService.checkUnmarkedProgress(tasks, profile).catch((error) => {
        console.warn('Could not create progress reminder:', error);
      });
      void notificationService.checkTaskDueReminders(tasks, profile).catch((error) => {
        console.warn('Could not check task due reminder:', error);
      });
      void notificationService.evaluateScheduledNotifications(tasks, milestones, profile).catch((error) => {
        console.warn('Could not evaluate scheduled push reminder:', error);
      });
    };
    runChecks();
    const timer = window.setInterval(runChecks, 60_000);
    return () => window.clearInterval(timer);
  }, [tasks, milestones, profile]);

  // Realtime Backend Data Integration: Live sync for tasks, AI coach messages, and notifications
  useEffect(() => {
    if (!profile || profile.is_demo || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`career_pilot_realtime:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as any;
            setTasks((prev) => {
              if (prev.some((t) => t.id === row.id)) return prev;
              return [...prev, row as Task];
            });
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            setTasks((prev) => prev.map((t) => (t.id === row.id ? { ...t, ...row } : t)));
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) {
              setTasks((prev) => prev.filter((t) => t.id !== oldId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_coach_messages',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.id && row?.message) {
            setCoachMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [...prev, {
                id: row.id,
                sender: row.sender || 'assistant',
                text: row.message,
                timestamp: row.created_at || new Date().toISOString(),
                proposal: row.proposal ?? undefined,
              }];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.title && row?.body) {
            showToast(`🔔 ${row.title}: ${row.body}`);
            if (notificationService.isSoundEnabled(profile.id)) {
              notificationService.playChime();
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile]);

  const handleRequestSignOut = () => {
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSignOutModalOpen(false);
    activeUserIdRef.current = null;
    await authService.signOut();
    setProfile(null);
    setEarnedAchievements({});
    showToast('Signed out. Sign in to continue.');
  };

  const handleAuthenticated = async (newProfile: Profile) => {
    if (!newProfile.is_demo) {
      const { data: assurance, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        showToast('Could not verify your account security. Please sign in again.');
        await authService.signOut();
        return;
      }
      if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
        setIsMFARequired(true);
        return;
      }
    }
    await activateProfile(newProfile);
  };

  const handleMFAVerified = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      await authService.signOut();
      setIsMFARequired(false);
      showToast('Your session could not be restored. Please sign in again.');
      return;
    }
    let verifiedProfile: Profile | null;
    try {
      verifiedProfile = await authService.loadProfile(user);
    } catch (loadError) {
      console.error('Could not load the verified account profile:', loadError);
      verifiedProfile = null;
    }
    if (!verifiedProfile) {
      await authService.signOut();
      setIsMFARequired(false);
      showToast('Your account profile could not be loaded. Please sign in again.');
      return;
    }
    setIsMFARequired(false);
    await activateProfile(verifiedProfile);
  };

  const handleCancelMFA = async () => {
    activeUserIdRef.current = null;
    await authService.signOut();
    setIsMFARequired(false);
    setProfile(null);
  };

  const handleOnboardingComplete = async (updatedProfile: Profile, roleOutline?: RolePlanOutline) => {
    setWorkspaceError(null);
    if (updatedProfile.is_demo) {
      setProfile(updatedProfile);
      if (await syncWorkspace(updatedProfile)) showToast(`🚀 Roadmap generated for ${updatedProfile.target_role}!`);
      return;
    }

    try {
      const { generateRoadmapForRole, generateTasksForMilestones } = await import('./features/roadmap/plannerEngine');
      const milestones = generateRoadmapForRole(
        updatedProfile.target_role,
        updatedProfile.target_timeline_months || 6,
        updatedProfile.daily_minutes || 60,
        updatedProfile.target_completion_date,
        updatedProfile.experience_level || 'beginner',
        updatedProfile.target_role_category,
        roleOutline
      );
      const tasks = generateTasksForMilestones(
        milestones,
        updatedProfile.target_role,
        updatedProfile.experience_level || 'beginner',
        updatedProfile.target_role_category,
        roleOutline
      );
      await saveCareerPlan(updatedProfile, milestones, tasks);
      const saved = await loadActiveRoadmap(updatedProfile.id);
      if (!saved) throw new Error('The career plan was saved but could not be reloaded.');
      setProfile(updatedProfile);
      setMilestones(saved.milestones);
      setTasks(saved.tasks);
      void refreshEarnedAchievements(updatedProfile);
      void refreshAIQuota(updatedProfile);
      showToast(`🚀 Roadmap generated for ${updatedProfile.target_role}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your initial career goal and roadmap. Check your connection and try again.';
      throw new Error(message);
    }
  };

  const reflectTaskCompletion = (taskId: string, doneAt: string): Milestone | null => {
    const updatedTasks = tasks.map((task) => task.id === taskId
      ? { ...task, done_at: doneAt, progress_pct: 100 }
      : task);
    setTasks(updatedTasks);
    const completedTask = updatedTasks.find((task) => task.id === taskId);
    const milestoneIndex = completedTask
      ? milestones.findIndex((milestone) => milestone.id === completedTask.milestone_id)
      : -1;
    if (milestoneIndex < 0) return null;
    const milestoneTasks = updatedTasks.filter((task) => task.milestone_id === milestones[milestoneIndex].id);
    if (milestoneTasks.length === 0 || milestoneTasks.some((task) => !task.done_at)) return null;
    setMilestones((previous) => previous.map((milestone, index) => {
      if (index === milestoneIndex) return { ...milestone, status: 'done' };
      if (index === milestoneIndex + 1 && milestone.status !== 'done') return { ...milestone, status: 'doing' };
      return milestone;
    }));
    return milestones[milestoneIndex];
  };

  const notifyMilestoneCompletion = (milestone: Milestone | null) => {
    if (!milestone || !profile || profile.notification_milestone_alerts === false) return;
    void notificationService.sendNotification(
      'Milestone completed',
      `You completed ${milestone.title}. Keep building toward your ${profile.target_role} goal.`,
      'milestone',
      profile,
      profile.is_demo ? undefined : `milestone_completed_${milestone.id}`
    ).catch((error) => {
      console.warn('Could not save the milestone notification:', error);
    });
  };

  // Checkpoint Quiz Passing handler
  const handlePassCheckpoint = async (
    taskId: string,
    completion?: { persisted: boolean; currentStreak?: number }
  ) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task || !profile) return;
    const doneAt = new Date().toISOString();
    try {
      let currentStreak = completion?.currentStreak;
      if (!profile.is_demo && !completion?.persisted) {
        const saved = await completeTask(task.id);
        currentStreak = saved.current_streak ?? currentStreak;
      }
      notifyMilestoneCompletion(reflectTaskCompletion(taskId, doneAt));
      if (currentStreak !== undefined) {
        setProfile((previous) => previous ? { ...previous, streak_days: currentStreak! } : previous);
      }
      if (!profile.is_demo) await refreshEarnedAchievements(profile);
      showToast('✨ Task marked complete.');
      setActiveQuizTask(null);
    } catch {
      showToast('Could not save task progress. Please try again.');
    }
  };

  // Direct Task Toggle
  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task || !profile) return;
    if (task.done_at) {
      showToast('Completed tasks stay recorded in your progress history.');
      return;
    }
    if (task.quiz && !task.done_at) {
      setActiveQuizTask(task);
      return;
    }
    if (task.type === 'Checkpoint' || /checkpoint/i.test(task.title)) {
      const milestoneIndex = Math.max(0, milestones.findIndex((milestone) => milestone.id === task.milestone_id));
      const { createFallbackCheckpointQuiz } = await import('./features/roadmap/demoCheckpointQuizzes');
      const fallbackQuiz = createFallbackCheckpointQuiz(
        task.id,
        task.title,
        profile.target_role,
        milestoneIndex,
        milestones.length,
        profile.target_role_category,
        task.quiz_template_id
      );
      setActiveQuizTask({ ...task, quiz: fallbackQuiz });
      return;
    }
    const doneAt = new Date().toISOString();
    try {
      let currentStreak: number | null = null;
      if (!profile.is_demo) {
        const result = await completeTask(task.id);
        currentStreak = result.current_streak;
      }
      notifyMilestoneCompletion(reflectTaskCompletion(taskId, doneAt));
      if (currentStreak !== null) setProfile((previous) => previous ? { ...previous, streak_days: currentStreak! } : previous);
      if (!profile.is_demo) await refreshEarnedAchievements(profile);
      showToast('Task completed and progress saved.');
    } catch {
      showToast('Could not save task progress. Please try again.');
    }
  };

  // Re-planning Action handler
  const handleApplyPlannerAction = async (action: 'behind' | 'early' | 'pause') => {
    if (!profile) return;
    if (profile.is_demo) {
      const { applyQuickPlannerAction } = await import('./features/roadmap/plannerEngine');
      const result = applyQuickPlannerAction(milestones, tasks, action);
      setMilestones(result.updatedMilestones);
      setTasks(result.updatedTasks);
      showToast(`Planner updated: ${result.message}`);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('apply_user_roadmap_action', { p_action_type: action });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      const refreshedProfile = user ? await authService.loadProfile(user) : null;
      if (!refreshedProfile) throw new Error('Could not reload your updated career goal.');
      setProfile(refreshedProfile);
      if (!(await syncWorkspace(refreshedProfile))) throw new Error('Could not reload your updated roadmap.');
      showToast(`Planner updated: ${(data as { message?: string })?.message || 'Schedule dates saved.'}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save the schedule change. Please try again.');
    }
  };

  // Coach Send Message handler
  const handleSendCoachMessage = async (text: string) => {
    if (!profile || profile.is_demo || isCoachSending) return;
    setIsCoachSending(true);
    let userMessage: AICoachMessage = {
      id: `local-user-${crypto.randomUUID()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      proposal: undefined,
    };
    let canPersistCoachHistory = true;
    try {
      const savedUserMessage = await supabase
        .from('ai_coach_messages')
        .insert({ user_id: profile.id, sender: 'user', message: text })
        .select('id,sender,message,proposal,created_at')
        .single();
      if (savedUserMessage.error) {
        const errCode = savedUserMessage.error.code || '';
        const errMsg = savedUserMessage.error.message || '';
        if (errCode === 'PGRST205' || errCode === '42P01' || /does not exist|schema cache|could not find the table/i.test(errMsg)) {
          canPersistCoachHistory = false;
        } else {
          throw savedUserMessage.error;
        }
      } else if (savedUserMessage.data) {
        userMessage = {
          id: savedUserMessage.data.id,
          sender: savedUserMessage.data.sender,
          text: savedUserMessage.data.message,
          timestamp: savedUserMessage.data.created_at,
          proposal: undefined,
        };
      }
    } catch {
      setIsCoachSending(false);
      showToast('Could not save your message. Please try again.');
      return;
    }
    setCoachMessages((previous) => [...previous, userMessage]);

    try {
      const nextTasks = tasks.filter((task) => !task.done_at).slice(0, 5).map((task) => ({
        title: task.title,
        due_date: task.due_date,
        estimated_minutes: task.est_minutes,
      }));
      const recentMessages = [...coachMessages.slice(-5), userMessage].map((message) => ({
        sender: message.sender,
        text: message.text.slice(0, 400),
      }));
      const result = await requestAI<{ reply: string; proposal?: AICoachMessage['proposal'] | null }>('coach', {
        text,
        target_role: profile.target_role,
        context: JSON.stringify({
          daily_minutes: profile.daily_minutes,
          current_streak: profile.streak_days,
          next_tasks: nextTasks,
          recent_messages: recentMessages,
        }),
      });
      const aiText = result.response.reply?.trim();
      if (!aiText) throw new Error('The coach returned an empty response.');
      const localReplyId = `local-${crypto.randomUUID()}`;
      setCoachMessages((previous) => [...previous, {
        id: localReplyId,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toISOString(),
        proposal: result.response.proposal ?? undefined,
      }]);
      if (canPersistCoachHistory) {
        const { data: savedAIMessage, error: saveAIError } = await supabase
          .from('ai_coach_messages')
          .insert({ user_id: profile.id, sender: 'ai', message: aiText, proposal: result.response.proposal ?? null })
          .select('id,sender,message,proposal,created_at')
          .single();
        if (saveAIError) {
          showToast('Coach reply generated, but it could not be saved to your history.');
          return;
        }
        setCoachMessages((previous) => previous.map((message) => message.id === localReplyId ? {
          id: savedAIMessage.id,
          sender: 'ai',
          text: savedAIMessage.message,
          timestamp: savedAIMessage.created_at,
          proposal: savedAIMessage.proposal ?? undefined,
        } : message));
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'AI service unavailable.';
      setCoachMessages((previous) => [...previous, {
        id: `local-err-${crypto.randomUUID()}`,
        sender: 'ai',
        text: `AI Coach could not reach the AI gateway (${detail}). Make sure your Supabase database migrations and ai-gateway Edge Function with an AI provider key are configured.`,
        timestamp: new Date().toISOString(),
      }]);
      showToast(`Coach unavailable: ${detail}`);
    } finally {
      setIsCoachSending(false);
      void refreshAIQuota(profile);
    }
  };

  // =========================================================================
  // HARD AUTHENTICATION GATE
  // Unauthenticated users CANNOT use this app; they must authenticate first.
  // =========================================================================
  if (!isAuthReady || isWorkspaceLoading) {
    const skeletonVariant = !profile
      ? 'auth'
      : profile.has_completed_onboarding && profile.target_role
        ? 'workspace'
        : 'onboarding';
    return <AppScreenSkeleton variant={skeletonVariant} label="Loading your Career Pilot account…" />;
  }

  if (isMFARequired) {
    return (
      <Suspense fallback={<AppScreenSkeleton variant="auth" label="Loading verification…" />}>
        <MFAChallengeScreen onVerified={handleMFAVerified} onCancel={handleCancelMFA} />
      </Suspense>
    );
  }

  const leavePasswordRecovery = async () => {
    activeUserIdRef.current = null;
    await authService.signOut();
    setIsPasswordRecovery(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('recovery');
    url.searchParams.delete('code');
    url.searchParams.delete('type');
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    url.hash = '';
    window.history.replaceState({}, '', url);
  };

  if (isPasswordRecovery) {
    return (
      <Suspense fallback={<AppScreenSkeleton variant="auth" label="Loading password recovery…" />}>
        <PasswordRecoveryScreen
          onExit={leavePasswordRecovery}
          onComplete={async () => {
            await leavePasswordRecovery();
            showToast('Password updated. Sign in with your new password.');
          }}
        />
      </Suspense>
    );
  }

  if (!profile) {
    return (
      <>
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3000,
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              border: '1px solid #334155',
              whiteSpace: 'nowrap',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {toastMessage}
          </div>
        )}
        <Suspense fallback={<AppScreenSkeleton variant="auth" label="Loading sign-in…" />}>
          <AuthScreen
            onAuthenticated={handleAuthenticated}
            onMFARequired={() => setIsMFARequired(true)}
            onToast={showToast}
          />
        </Suspense>
      </>
    );
  }

  if (workspaceError) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--md-background)' }}>
        <section className="m3-surface-card" style={{ maxWidth: 440, width: '100%' }}>
          <h1 style={{ marginTop: 0, color: 'var(--md-text-primary)' }}>Couldn’t load your roadmap</h1>
          <p style={{ color: 'var(--md-text-secondary)' }}>{workspaceError}</p>
          <button className="btn-m3-primary" onClick={() => void syncWorkspace(profile)}>Try again</button>
        </section>
      </main>
    );
  }

  // =========================================================================
  // POST-SIGNUP ONBOARDING WIZARD
  // User must set their career goal, timeline to achieve it, and daily pace.
  // =========================================================================
  if (!profile.has_completed_onboarding || !profile.target_role || (!profile.target_completion_date && !profile.is_demo)) {
    return (
      <Suspense fallback={<AppScreenSkeleton variant="onboarding" label="Loading career goal setup…" />}>
        <OnboardingGoalModal
          profile={profile}
          aiQuota={aiQuota}
          onAIUsageChanged={() => refreshAIQuota(profile)}
          onComplete={handleOnboardingComplete}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-root-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3000,
            background: 'var(--md-surface, #FFFFFF)',
            color: 'var(--md-text-primary, #1E293B)',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            border: '1px solid var(--md-outline, #E2E8F0)',
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Shell */}
      <div className="app-desktop-shell">
        <a className="skip-to-main" href="#main-content">Skip to main content</a>
        {/* Left Desktop Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          onChangeTab={navigateToTab}
          profile={profile}
          aiQuota={aiQuota}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => navigateToTab('profile')}
          onSignOut={handleRequestSignOut}
        />

        {/* Main Content Area */}
        <main className="desktop-main-area" id="main-content" tabIndex={-1}>
          {/* Top Navbar */}
          <Navbar
            profile={profile}
            aiQuota={aiQuota}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenProfile={() => navigateToTab('profile')}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenGoalSettings={() => setIsRoleModalOpen(true)}
            onSignOut={handleRequestSignOut}
          />

          <Suspense fallback={<WorkspaceSkeleton variant={activeTab} />}>
            {/* VIEW: Home / Winding Highway Roadmap View */}
            {activeTab === 'home' && (
              <RoadmapView
                tasks={tasks}
                milestones={milestones}
                profile={profile}
                onSelectTaskForQuiz={(t) => setActiveQuizTask(t)}
                onToggleTaskComplete={handleToggleTaskComplete}
                onApplyPlannerAction={handleApplyPlannerAction}
                onOpenGoalSettings={() => setIsRoleModalOpen(true)}
                onOpenCoach={() => navigateToTab('coach')}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                onUpdateReminderFrequency={async (frequency) => {
                  const saved = await authService.updateProfile(profile, { weekly_reminder_frequency: frequency });
                  setProfile(saved);
                }}
              />
            )}

            {/* VIEW: Plan / Weekly Stages Schedule */}
            {activeTab === 'plan' && (
              <WeeklyScheduleView
                milestones={milestones}
                tasks={tasks}
                profile={profile}
                onToggleTaskComplete={handleToggleTaskComplete}
                onApplyPlannerAction={handleApplyPlannerAction}
                onOpenGoalSettings={() => setIsRoleModalOpen(true)}
                onOpenCoach={() => navigateToTab('coach')}
              />
            )}

            {/* VIEW: Overview / Analytics */}
            {activeTab === 'overview' && (
              <>
                <CheckpointHistoryPanel userId={profile.id} isDemo={Boolean(profile.is_demo)} />
                <OverviewAnalyticsView
                  milestones={milestones}
                  tasks={tasks}
                  profile={profile}
                  onBack={() => navigateToTab('home')}
                  onNavigateToTab={navigateToTab}
                  onApplyPlannerAction={handleApplyPlannerAction}
                  onOpenGoalSettings={() => setIsRoleModalOpen(true)}
                />
              </>
            )}

            {/* VIEW: AI Career Coach */}
            {activeTab === 'coach' && (
              <AICoachView
                messages={coachMessages}
                onSendMessage={handleSendCoachMessage}
                isSending={isCoachSending}
                onApplyProposal={(action) => handleApplyPlannerAction(action === 'early' || action === 'pause' ? action : 'behind')}
                onBack={() => navigateToTab('home')}
              />
            )}

            {/* VIEW: Mock Interview Arena */}
            {activeTab === 'interview' && (
              <InterviewSimulatorView
                userId={profile.id}
                targetRole={profile.target_role}
                targetRoleCategory={profile.target_role_category}
                experienceLevel={profile.experience_level}
                userName={profile.full_name}
                onAIUsageChanged={() => refreshAIQuota(profile)}
              />
            )}

            {/* VIEW: CV & Resume Builder */}
            {activeTab === 'cv' && (
              <CVBuilderView
                profile={profile}
                onAIUsageChanged={() => refreshAIQuota(profile)}
                onToast={showToast}
              />
            )}

            {/* VIEW: Skill-Gap & Vacancies Match */}
            {activeTab === 'skills' && (
              <SkillGapView
                userId={profile.id}
                targetRole={profile.target_role}
                targetRoleCategory={profile.target_role_category}
                onToast={showToast}
                onAddSkillToRoadmap={async (skill) => {
                  await addSkillTask(profile.id, skill);
                  await syncWorkspace(profile);
                }}
                onAddResourceToRoadmap={async (resource) => {
                  const added = await addResourceTask(profile.id, resource);
                  if (added) await syncWorkspace(profile);
                  return added;
                }}
              />
            )}

            {/* VIEW: Separate Dedicated Account & Professional Profile */}
            {activeTab === 'profile' && (
              <ProfileAccountView
                profile={profile}
                milestones={milestones}
                tasks={tasks}
                earnedAchievements={earnedAchievements}
                aiQuota={aiQuota}
                theme={theme}
                onUpdateProfile={async (updated) => {
                  const saved = await authService.updateProfile(profile, updated);
                  setProfile(saved);
                }}
                onToggleTheme={toggleTheme}
                onOpenRoleModal={() => setIsRoleModalOpen(true)}
                onSignOut={handleRequestSignOut}
                onDeleteAccount={async () => {
                  if (profile.is_demo) throw new Error('Development demo accounts cannot be deleted.');
                  activeUserIdRef.current = null;
                  await authService.deleteAccount();
                  setProfile(null);
                  setEarnedAchievements({});
                  navigateToTab('home');
                  showToast('Your account and associated data were deleted.');
                }}
                onNavigateToTab={navigateToTab}
                onToast={showToast}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={navigateToTab}
        onOpenQuickAction={() => setIsQuickActionSheetOpen(true)}
      />

      <Suspense fallback={null}>
        {/* Quick Action Sheet Modal */}
        <QuickActionSheetModal
          isOpen={isQuickActionSheetOpen}
          onClose={() => setIsQuickActionSheetOpen(false)}
          onSelectTab={navigateToTab}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          onQuickReplan={handleApplyPlannerAction}
        />

        {/* Checkpoint Question Challenge Modal */}
        {activeQuizTask && (
          <CheckpointQuizModal
            task={activeQuizTask}
            isDemo={Boolean(profile.is_demo)}
            onClose={() => setActiveQuizTask(null)}
            onPassTask={handlePassCheckpoint}
          />
        )}

        {/* Role / Career Quest Selection Modal */}
        {isRoleModalOpen && (
          <RoleQuestSelectorModal
            currentRoleSlug={profile.target_role.toLowerCase().replace(/[^a-z0-9]/g, '-')}
            experienceLevel={profile.experience_level || 'beginner'}
            isDemo={Boolean(profile.is_demo)}
            aiQuota={aiQuota}
            onAIUsageChanged={() => refreshAIQuota(profile)}
            onClose={() => setIsRoleModalOpen(false)}
            onSelectNewPlan={async (roleTitle, roleCategory, targetDate, dailyMins, newMilestones, roleOutline) => {
              setIsWorkspaceLoading(true);
              setWorkspaceError(null);
              try {
                const { generateTasksForMilestones } = await import('./features/roadmap/plannerEngine');
                const daysDiff = Math.max(14, daysBetweenDateOnly(getLocalDateOnly(), targetDate));
                const months = Math.min(60, Math.max(1, Math.round(daysDiff / 30)));
                const updated: Profile = {
                  ...profile,
                  target_role: roleTitle,
                  target_role_category: roleCategory,
                  target_timeline_months: months,
                  target_completion_date: targetDate,
                  daily_minutes: dailyMins,
                  experience_level: profile.experience_level || 'beginner',
                  has_completed_onboarding: true,
                };
                let newTasks = generateTasksForMilestones(
                  newMilestones,
                  roleTitle,
                  profile.experience_level || 'beginner',
                  roleCategory,
                  roleOutline
                );
                if (import.meta.env.DEV && profile.is_demo) {
                  const { attachDemoCheckpointQuizzes } = await import('./features/roadmap/demoCheckpointQuizzes');
                  newTasks = attachDemoCheckpointQuizzes(newTasks);
                }
                let saved: { milestones: Milestone[]; tasks: Task[] };
                if (profile.is_demo) {
                  saved = { milestones: newMilestones, tasks: newTasks };
                } else {
                  await saveCareerPlan(updated, newMilestones, newTasks);
                  setProfile(updated);
                  setIsRoleModalOpen(false);
                  const persisted = await loadActiveRoadmap(updated.id);
                  if (!persisted) throw new Error('The career plan was saved but could not be reloaded.');
                  saved = persisted;
                }
                setIsRoleModalOpen(false);
                setProfile(updated);
                setMilestones(saved.milestones);
                setTasks(saved.tasks);
                showToast(`🚀 Roadmap Updated for ${roleTitle} (${dailyMins}m/day)!`);
              } catch {
                setWorkspaceError('Could not save the new career goal and roadmap. Check your connection and try again.');
              } finally {
                setIsWorkspaceLoading(false);
              }
            }}
          />
        )}

        {/* Profile & Preferences Settings Modal */}
        {isSettingsOpen && (
          <ProfileSettingsModal
            isOpen
            onClose={() => setIsSettingsOpen(false)}
            profile={profile}
            onUpdateProfile={async (updated) => {
              const saved = await authService.updateProfile(profile, updated);
              setProfile(saved);
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAuth={() => { }}
            onSignOut={handleRequestSignOut}
            onToast={showToast}
          />
        )}

        {/* Notification Center Modal */}
        {isNotificationsOpen && profile && (
          <NotificationCenterModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            tasks={tasks}
            profile={profile}
            onToast={showToast}
          />
        )}

        {/* Sign Out Confirmation Modal */}
        {isSignOutModalOpen && (
          <SignOutModal
            isOpen
            onClose={() => setIsSignOutModalOpen(false)}
            onConfirmSignOut={handleConfirmSignOut}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
