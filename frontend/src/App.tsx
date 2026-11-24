import { lazy, Suspense, useCallback, useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { LEARNER_CORE_NAV_ITEMS, LEARNER_TOOL_NAV_ITEMS } from './components/learnerNavItems';
import { MobileNavDrawer, MobileSectionStrip } from './components/MobileNavDrawer';
import { AppScreenSkeleton, WorkspaceSkeleton } from './components/SkeletonScreen';
import { authService } from './features/auth/authService';
import { addResourceTask, addSkillTask, applyPlannerAction, completeTask, createRoadmap, loadActiveRoadmap, saveCareerPlan } from './features/roadmap/roadmapRepository';
import { notificationService } from './features/notifications/notificationService';
import { loadAIQuotaSummary, requestAI } from './features/ai/aiGateway';
import type { AIQuotaSummary } from './features/ai/aiGateway';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { daysBetweenDateOnly, getLocalDateOnly } from './lib/dateOnly';
import { getInitialTheme, applyTheme } from './lib/theme';
import type { ThemeMode } from './lib/theme';
import type { ActiveNavTab, AppNotification, Task, AICoachMessage, Profile, Milestone, ExpertProfile } from './types';
import type { RolePlanOutline } from './features/roadmap/careerCatalog';
import { expertRepository } from './features/experts/expertRepository';
import { createRealtimeChannelName, syncSupabaseRealtimeAuth } from './features/experts/sessionChatSync';

const RoadmapView = lazy(() => import('./features/roadmap/RoadmapView').then((module) => ({ default: module.RoadmapView })));
const WeeklyScheduleView = lazy(() => import('./features/roadmap/WeeklyScheduleView').then((module) => ({ default: module.WeeklyScheduleView })));
const CheckpointHistoryPanel = lazy(() => import('./features/roadmap/CheckpointHistoryPanel').then((module) => ({ default: module.CheckpointHistoryPanel })));
const OverviewAnalyticsView = lazy(() => import('./components/OverviewAnalyticsView').then((module) => ({ default: module.OverviewAnalyticsView })));
const ProfileAccountView = lazy(() => import('./components/ProfileAccountView').then((module) => ({ default: module.ProfileAccountView })));
const AICoachView = lazy(() => import('./features/coach/AICoachView').then((module) => ({ default: module.AICoachView })));
const InterviewSimulatorView = lazy(() => import('./components/InterviewSimulatorView').then((module) => ({ default: module.InterviewSimulatorView })));
const CVBuilderView = lazy(() => import('./components/CVBuilderView').then((module) => ({ default: module.CVBuilderView })));
const SkillGapView = lazy(() => import('./components/SkillGapView').then((module) => ({ default: module.SkillGapView })));
const ExpertsMarketplaceView = lazy(() => import('./components/ExpertsMarketplaceView').then((module) => ({ default: module.ExpertsMarketplaceView })));
const ExpertDashboardShell = lazy(() => import('./components/ExpertDashboardShell').then((module) => ({ default: module.ExpertDashboardShell })));
const ExpertOnboardingView = lazy(() => import('./features/experts/ExpertOnboardingView').then((module) => ({ default: module.ExpertOnboardingView })));
const CheckpointQuizModal = lazy(() => import('./features/roadmap/CheckpointQuizModal').then((module) => ({ default: module.CheckpointQuizModal })));
const RoleQuestSelectorModal = lazy(() => import('./components/RoleQuestSelectorModal').then((module) => ({ default: module.RoleQuestSelectorModal })));
const OnboardingGoalModal = lazy(() => import('./features/onboarding/OnboardingGoalModal').then((module) => ({ default: module.OnboardingGoalModal })));
const NotificationCenterModal = lazy(() => import('./features/notifications/NotificationCenterModal').then((module) => ({ default: module.NotificationCenterModal })));
const AuthScreen = lazy(() => import('./features/auth/AuthScreen').then((module) => ({ default: module.AuthScreen })));
const PasswordRecoveryScreen = lazy(() => import('./features/auth/PasswordRecoveryScreen').then((module) => ({ default: module.PasswordRecoveryScreen })));
const QuickActionSheetModal = lazy(() => import('./components/QuickActionSheetModal').then((module) => ({ default: module.QuickActionSheetModal })));
const ProfileSettingsModal = lazy(() => import('./components/ProfileSettingsModal').then((module) => ({ default: module.ProfileSettingsModal })));
const SignOutModal = lazy(() => import('./components/SignOutModal').then((module) => ({ default: module.SignOutModal })));

const APP_TABS: ActiveNavTab[] = ['home', 'plan', 'overview', 'coach', 'interview', 'cv', 'skills', 'experts', 'profile'];

function getTabFromUrl(): ActiveNavTab {
  const requestedTab = new URLSearchParams(window.location.search).get('view');
  return APP_TABS.includes(requestedTab as ActiveNavTab) ? requestedTab as ActiveNavTab : 'home';
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>(getTabFromUrl);
  const [profile, setProfile] = useState<Profile | null>(null);
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
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null | undefined>(undefined);

  // Modals & Sheets
  const [activeQuizTask, setActiveQuizTask] = useState<Task | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadSessionMessagesCount, setUnreadSessionMessagesCount] = useState(0);
  const [pendingChatBookingId, setPendingChatBookingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToastMessage(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  const navigateToTab = useCallback((tab: ActiveNavTab) => {
    setActiveTab((prev) => {
      if (tab === prev) return prev;
      const url = new URL(window.location.href);
      if (tab === 'home') url.searchParams.delete('view');
      else url.searchParams.set('view', tab);
      window.history.pushState({ view: tab }, '', url);
      return tab;
    });
  }, []);

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
    if (userProfile.account_role === 'expert') {
      setIsWorkspaceLoading(true);
      setWorkspaceError(null);
      try {
        if (!userProfile.is_demo) {
          const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
          await expertRepository
            .completePendingRegistration(userProfile.id, userProfile.avatar_url, authData?.user?.user_metadata)
            .catch(() => null);
        }
        const loadedExpert = await expertRepository.loadMyExpertProfile(userProfile.id);
        if (requestId === workspaceRequestId.current) {
          setExpertProfile(loadedExpert);
          setMilestones([]);
          setTasks([]);
        }
        return true;
      } catch (err) {
        console.error('Could not load expert profile:', err);
        if (requestId === workspaceRequestId.current) {
          setExpertProfile(null);
        }
        return true;
      } finally {
        if (requestId === workspaceRequestId.current) setIsWorkspaceLoading(false);
      }
    }

    setExpertProfile(undefined);
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
          generatedTasks = attachDemoCheckpointQuizzes(
            generatedTasks,
            generated,
            userProfile.target_role,
            userProfile.target_role_category
          );
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
        setExpertProfile(undefined);
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

  const refreshUnreadNotifications = useCallback(async (userId?: string, isDemo?: boolean) => {
    const targetId = userId ?? profile?.id;
    const demoFlag = isDemo ?? Boolean(profile?.is_demo);
    if (!targetId) {
      setUnreadNotificationCount(0);
      setUnreadSessionMessagesCount(0);
      return;
    }
    const summary = await notificationService.getUnreadSummary(targetId, demoFlag);
    setUnreadNotificationCount(summary.totalUnread);
    setUnreadSessionMessagesCount(summary.unreadSessionMessages);
  }, [profile?.id, profile?.is_demo]);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadNotificationCount(0);
      setUnreadSessionMessagesCount(0);
      return;
    }
    void refreshUnreadNotifications(profile.id, Boolean(profile.is_demo));

    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refreshUnreadNotifications(profile.id, Boolean(profile.is_demo));
    };
    window.addEventListener('focus', handleResume);
    window.addEventListener('online', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    const pollTimer = window.setInterval(handleResume, 15_000);
    return () => {
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('online', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      window.clearInterval(pollTimer);
    };
  }, [profile?.id, profile?.is_demo, refreshUnreadNotifications]);

  // Realtime Backend Data Integration: Live sync for tasks, AI coach messages, and notifications
  useEffect(() => {
    if (!profile?.id || profile.is_demo || !isSupabaseConfigured()) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const userId = profile.id;

    const connect = async () => {
      await syncSupabaseRealtimeAuth();
      if (!active) return;

      channel = supabase
        .channel(createRealtimeChannelName('career_pilot_realtime', userId))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!active) return;
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
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!active) return;
            const row = payload.new as any;
            if (row?.id && row?.message) {
              const incomingSender: 'user' | 'ai' = row.sender === 'user' ? 'user' : 'ai';
              const mappedRow: AICoachMessage = {
                id: row.id,
                sender: incomingSender,
                text: row.message,
                timestamp: row.created_at || new Date().toISOString(),
                proposal: row.proposal ?? undefined,
              };
              setCoachMessages((prev) => {
                if (prev.some((m) => m.id === row.id)) return prev;
                const matchingOptimisticIndex = prev.findIndex(
                  (m) => m.id.startsWith('local-') && m.sender === incomingSender && m.text === row.message
                );
                if (matchingOptimisticIndex !== -1) {
                  return prev.map((m, idx) => (idx === matchingOptimisticIndex ? mappedRow : m));
                }
                return [...prev, mappedRow];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!active) return;
            void refreshUnreadNotifications(userId, false);
            if (payload.eventType !== 'INSERT') return;
            const row = payload.new as any;
            if (row?.title && row?.body) {
              const isChatMsg = row.metadata?.kind === 'session_message';
              showToast(`${isChatMsg ? '💬' : '🔔'} ${row.title}: ${row.body}`);
              if (notificationService.isSoundEnabled(userId)) {
                notificationService.playChime();
              }
              const targetUrl = isChatMsg ? '/?view=experts' : '/?view=plan';
              void notificationService.showBrowserPopup(
                row.title,
                row.body,
                row.metadata?.dedupe_key || `notif-${row.id}`,
                targetUrl
              );
            }
          }
        )
        .subscribe((status) => {
          if (active && status === 'SUBSCRIBED') {
            void refreshUnreadNotifications(userId, false);
          }
        });
    };

    void connect();

    return () => {
      active = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [profile?.id, profile?.is_demo, showToast, refreshUnreadNotifications]);

  const handlePendingChatHandled = useCallback(() => {
    setPendingChatBookingId(null);
  }, []);

  const handleNotificationAction = useCallback((notification: AppNotification) => {
    if (notification.bookingId) {
      setPendingChatBookingId(notification.bookingId);
    }
    if (profile?.account_role === 'expert') {
      return;
    }
    if (notification.kind === 'session_message' || notification.bookingId) {
      navigateToTab('experts');
      return;
    }
    const learnerTabs: ActiveNavTab[] = ['home', 'plan', 'overview', 'coach', 'interview', 'cv', 'skills', 'experts', 'profile'];
    if (notification.actionTab && learnerTabs.includes(notification.actionTab as ActiveNavTab)) {
      navigateToTab(notification.actionTab as ActiveNavTab);
    }
  }, [profile?.account_role, navigateToTab]);

  const handleRequestSignOut = () => {
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSignOutModalOpen(false);
    activeUserIdRef.current = null;
    await authService.signOut();
    setProfile(null);
    setExpertProfile(undefined);
    setEarnedAchievements({});
    showToast('Signed out. Sign in to continue.');
  };

  const handleAuthenticated = async (newProfile: Profile) => {
    await activateProfile(newProfile);
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

  const reflectTaskCompletion = (
    taskId: string,
    doneAt: string
  ): { completedMilestone: Milestone | null; prevTasks: Task[]; prevMilestones: Milestone[] } => {
    const prevTasks = tasks;
    const prevMilestones = milestones;
    const updatedTasks = tasks.map((task) => task.id === taskId
      ? { ...task, done_at: doneAt, progress_pct: 100 }
      : task);
    setTasks(updatedTasks);
    const completedTask = updatedTasks.find((task) => task.id === taskId);
    const milestoneIndex = completedTask
      ? milestones.findIndex((milestone) => milestone.id === completedTask.milestone_id)
      : -1;
    if (milestoneIndex < 0) return { completedMilestone: null, prevTasks, prevMilestones };
    const milestoneTasks = updatedTasks.filter((task) => task.milestone_id === milestones[milestoneIndex].id);
    if (milestoneTasks.length === 0 || milestoneTasks.some((task) => !task.done_at)) {
      return { completedMilestone: null, prevTasks, prevMilestones };
    }
    setMilestones((previous) => previous.map((milestone, index) => {
      if (index === milestoneIndex) return { ...milestone, status: 'done' };
      if (index === milestoneIndex + 1 && milestone.status !== 'done') return { ...milestone, status: 'doing' };
      return milestone;
    }));
    return { completedMilestone: milestones[milestoneIndex], prevTasks, prevMilestones };
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

  const completingTaskIdsRef = useRef<Set<string>>(new Set());

  // Checkpoint Quiz Passing handler (optimistic instant UI update)
  const handlePassCheckpoint = async (
    taskId: string,
    completion?: { persisted: boolean; currentStreak?: number }
  ) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task || !profile) return;
    const doneAt = new Date().toISOString();
    const { completedMilestone, prevTasks, prevMilestones } = reflectTaskCompletion(taskId, doneAt);
    notifyMilestoneCompletion(completedMilestone);
    if (completion?.currentStreak !== undefined) {
      setProfile((previous) => previous ? { ...previous, streak_days: completion.currentStreak! } : previous);
    }
    setActiveQuizTask(null);

    if (profile.is_demo) {
      showToast('Checkpoint completed.');
      return;
    }

    completingTaskIdsRef.current.add(taskId);
    try {
      let currentStreak = completion?.currentStreak;
      if (!completion?.persisted) {
        const saved = await completeTask(task.id);
        currentStreak = saved.current_streak ?? currentStreak;
      }
      if (currentStreak !== undefined) {
        setProfile((previous) => previous ? { ...previous, streak_days: currentStreak! } : previous);
      }
      void refreshEarnedAchievements(profile);
      showToast('Checkpoint completed.');
    } catch {
      setTasks(prevTasks);
      setMilestones(prevMilestones);
      showToast('Could not save task progress. Please try again.');
    } finally {
      completingTaskIdsRef.current.delete(taskId);
    }
  };

  // Direct Task Toggle (instant optimistic update + background sync)
  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task || !profile) return;
    if (task.done_at) {
      showToast('Completed tasks stay recorded in your progress history.');
      return;
    }
    if (completingTaskIdsRef.current.has(taskId)) return;

    const milestoneIndex = Math.max(0, milestones.findIndex((milestone) => milestone.id === task.milestone_id));
    const currentMilestone = milestones[milestoneIndex];
    const siblingTasks = tasks.filter((entry) => entry.milestone_id === task.milestone_id);

    if (task.quiz || task.type === 'Checkpoint' || /checkpoint/i.test(task.title)) {
      const { createFallbackCheckpointQuiz } = await import('./features/roadmap/demoCheckpointQuizzes');
      const smartQuiz = createFallbackCheckpointQuiz(
        task.id,
        task.title,
        profile.target_role,
        milestoneIndex,
        milestones.length,
        profile.target_role_category,
        task.quiz_template_id,
        currentMilestone,
        siblingTasks,
        task
      );
      setActiveQuizTask({ ...task, quiz: smartQuiz });
      return;
    }

    const doneAt = new Date().toISOString();
    const { completedMilestone, prevTasks, prevMilestones } = reflectTaskCompletion(taskId, doneAt);
    notifyMilestoneCompletion(completedMilestone);

    if (profile.is_demo) return;

    completingTaskIdsRef.current.add(taskId);
    try {
      const result = await completeTask(task.id);
      if (result.current_streak !== null) {
        setProfile((previous) => previous ? { ...previous, streak_days: result.current_streak! } : previous);
      }
      void refreshEarnedAchievements(profile);
    } catch {
      setTasks(prevTasks);
      setMilestones(prevMilestones);
      showToast('Could not save task progress. Please try again.');
    } finally {
      completingTaskIdsRef.current.delete(taskId);
    }
  };

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      const msg = (error as { message: string }).message.trim();
      if (msg) return msg;
    }
    return fallback;
  };

  // Re-planning Action handler
  const handleApplyPlannerAction = async (action: 'behind' | 'early' | 'pause'): Promise<boolean> => {
    if (!profile) return false;
    if (profile.is_demo) {
      const { applyQuickPlannerAction } = await import('./features/roadmap/plannerEngine');
      const result = applyQuickPlannerAction(milestones, tasks, action);
      setMilestones(result.updatedMilestones);
      setTasks(result.updatedTasks);
      showToast(`Planner updated: ${result.message}`);
      return true;
    }

    const previousMilestones = milestones;
    const previousTasks = tasks;
    const previousTargetDate = profile.target_completion_date;

    try {
      const { applyQuickPlannerAction } = await import('./features/roadmap/plannerEngine');
      const preview = applyQuickPlannerAction(previousMilestones, previousTasks, action);
      setMilestones(preview.updatedMilestones);
      setTasks(preview.updatedTasks);

      const outcome = await applyPlannerAction(profile.id, action, previousMilestones, previousTasks);
      setMilestones(outcome.updatedMilestones);
      setTasks(outcome.updatedTasks);
      if (outcome.targetDate) {
        setProfile((prev) => (prev ? { ...prev, target_completion_date: outcome.targetDate! } : prev));
      }
      showToast(`Planner updated: ${outcome.message || 'Schedule dates saved.'}`);
      return true;
    } catch (error) {
      setMilestones(previousMilestones);
      setTasks(previousTasks);
      if (previousTargetDate) {
        setProfile((prev) => (prev ? { ...prev, target_completion_date: previousTargetDate } : prev));
      }
      showToast(getErrorMessage(error, 'Could not save the schedule change. Please try again.'));
      return false;
    }
  };

  const replaceOptimisticCoachMessage = (localId: string, saved: AICoachMessage) => {
    setCoachMessages((previous) => {
      if (previous.some((message) => message.id === saved.id)) {
        return previous.filter((message) => message.id !== localId);
      }
      return previous.map((message) => (message.id === localId ? saved : message));
    });
  };

  // Coach Send Message handler
  const handleSendCoachMessage = async (text: string) => {
    if (!profile || isCoachSending) return;
    setIsCoachSending(true);
    const localUserId = `local-user-${crypto.randomUUID()}`;
    const userMessage: AICoachMessage = {
      id: localUserId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      proposal: undefined,
    };

    if (profile.is_demo) {
      const nextCount = tasks.filter((t) => !t.done_at).length;
      setCoachMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: `local-demo-ai-${crypto.randomUUID()}`,
          sender: 'ai',
          text: `In Demo Mode (${profile.target_role}), you have ${nextCount} upcoming tasks at ${profile.daily_minutes} mins/day. Sign in with your account to unlock live Gemini coaching tailored to your full progress history.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsCoachSending(false);
      return;
    }

    const recentMessages = [...coachMessages.slice(-4), userMessage].map((message) => ({
      sender: message.sender,
      text: message.text.slice(0, 240),
    }));

    // Append the user's message immediately so it appears above the Thinking indicator.
    setCoachMessages((previous) => [...previous, userMessage]);

    const persistUserPromise = (async (): Promise<boolean> => {
      try {
        const savedUserMessage = await supabase
          .from('ai_coach_messages')
          .insert({ user_id: profile.id, sender: 'user', message: text })
          .select('id,sender,message,proposal,created_at')
          .single();
        if (savedUserMessage.error || !savedUserMessage.data) {
          return false;
        }
        replaceOptimisticCoachMessage(localUserId, {
          id: savedUserMessage.data.id,
          sender: savedUserMessage.data.sender === 'user' ? 'user' : 'ai',
          text: savedUserMessage.data.message,
          timestamp: savedUserMessage.data.created_at,
          proposal: undefined,
        });
        return true;
      } catch {
        return false;
      }
    })();

    try {
      const nextTasks = tasks.filter((task) => !task.done_at).slice(0, 5).map((task) => ({
        title: task.title,
        due_date: task.due_date,
        estimated_minutes: task.est_minutes,
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
      const canPersistCoachHistory = await persistUserPromise;
      if (canPersistCoachHistory) {
        const { data: savedAIMessage, error: saveAIError } = await supabase
          .from('ai_coach_messages')
          .insert({ user_id: profile.id, sender: 'ai', message: aiText, proposal: result.response.proposal ?? null })
          .select('id,sender,message,proposal,created_at')
          .single();
        if (saveAIError || !savedAIMessage) {
          showToast('Coach reply generated, but it could not be saved to your history.');
          return;
        }
        replaceOptimisticCoachMessage(localReplyId, {
          id: savedAIMessage.id,
          sender: 'ai',
          text: savedAIMessage.message,
          timestamp: savedAIMessage.created_at,
          proposal: savedAIMessage.proposal ?? undefined,
        });
      }
    } catch (error) {
      await persistUserPromise;
      const detail = getErrorMessage(error, 'AI service unavailable.');
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
  // EXPERT PORTAL ROUTING
  // Dedicated Expert Onboarding & Expert Dashboard System
  // =========================================================================
  if (profile.account_role === 'expert') {
    const toastBanner = toastMessage ? (
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
    ) : null;

    if (!expertProfile || expertProfile.status === 'draft') {
      return (
        <>
          {toastBanner}
          <Suspense fallback={<AppScreenSkeleton variant="onboarding" label="Loading expert setup…" />}>
            <ExpertOnboardingView
              profile={profile}
              onComplete={(saved) => setExpertProfile(saved)}
              onSignOut={handleRequestSignOut}
              onToast={showToast}
            />
          </Suspense>
          <Suspense fallback={null}>
            {isSignOutModalOpen && (
              <SignOutModal
                isOpen
                onClose={() => setIsSignOutModalOpen(false)}
                onConfirmSignOut={handleConfirmSignOut}
              />
            )}
          </Suspense>
        </>
      );
    }

    return (
      <>
        {toastBanner}
        <Suspense fallback={<AppScreenSkeleton variant="workspace" label="Loading Expert Dashboard…" />}>
          <ExpertDashboardShell
            profile={profile}
            expertProfile={expertProfile}
            theme={theme}
            unreadNotificationCount={unreadNotificationCount}
            unreadSessionMessagesCount={unreadSessionMessagesCount}
            pendingChatBookingId={pendingChatBookingId}
            onPendingChatHandled={handlePendingChatHandled}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onToggleTheme={toggleTheme}
            onExpertProfileUpdated={(updated) => {
              setExpertProfile(updated);
              if (updated.avatar_url && updated.avatar_url !== profile.avatar_url) {
                void authService
                  .updateProfile(profile, { avatar_url: updated.avatar_url })
                  .then((saved) => setProfile(saved))
                  .catch(() => undefined);
              }
            }}
            onSignOut={handleRequestSignOut}
            onDeleteAccount={async () => {
              if (profile.is_demo) throw new Error('Development demo accounts cannot be deleted.');
              activeUserIdRef.current = null;
              await authService.deleteAccount();
              setProfile(null);
              setExpertProfile(undefined);
              showToast('Your expert account and associated data were deleted.');
            }}
            onToast={showToast}
          />
        </Suspense>
        <Suspense fallback={null}>
          {isNotificationsOpen && (
            <NotificationCenterModal
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              tasks={tasks}
              profile={profile}
              onNotificationAction={handleNotificationAction}
              onNotificationsChanged={() => void refreshUnreadNotifications(profile.id, Boolean(profile.is_demo))}
              onToast={showToast}
            />
          )}
          {isSignOutModalOpen && (
            <SignOutModal
              isOpen
              onClose={() => setIsSignOutModalOpen(false)}
              onConfirmSignOut={handleConfirmSignOut}
            />
          )}
        </Suspense>
      </>
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
            unreadNotificationCount={unreadNotificationCount}
            onOpenGoalSettings={() => setIsRoleModalOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onSignOut={handleRequestSignOut}
          />

          {/* Mobile Section Switcher (visible < 1024px so all pages are 1-tap reachable) */}
          <MobileSectionStrip
            items={[...LEARNER_CORE_NAV_ITEMS, ...LEARNER_TOOL_NAV_ITEMS]}
            activeId={activeTab}
            onSelect={(id) => navigateToTab(id as ActiveNavTab)}
            ariaLabel="Mobile page sections"
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

            {/* VIEW: Job Market & Progression-Matched Global Circulars */}
            {activeTab === 'skills' && (
              <SkillGapView
                key={profile.target_role}
                userId={profile.id}
                targetRole={profile.target_role}
                targetRoleCategory={profile.target_role_category}
                milestones={milestones}
                tasks={tasks}
                onNavigateToRoadmap={() => navigateToTab('home')}
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

            {/* VIEW: Industry Experts Marketplace & 1-on-1 Sessions */}
            {activeTab === 'experts' && (
              <ExpertsMarketplaceView
                profile={profile}
                initialChatBookingId={pendingChatBookingId}
                onInitialChatHandled={handlePendingChatHandled}
                onOpenGoalSettings={() => setIsRoleModalOpen(true)}
                onToast={showToast}
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

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Career Pilot"
        subtitle="Workspace"
        activeId={activeTab}
        onSelect={(id) => navigateToTab(id as ActiveNavTab)}
        groups={[
          { title: 'Navigation', items: LEARNER_CORE_NAV_ITEMS },
          { title: 'Tools & Career Pages', items: LEARNER_TOOL_NAV_ITEMS },
        ]}
        roleLabel={profile.target_role}
        onChangeRole={() => setIsRoleModalOpen(true)}
        onSignOut={handleRequestSignOut}
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
                  newTasks = attachDemoCheckpointQuizzes(newTasks, newMilestones, roleTitle, roleCategory);
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
            onNotificationAction={handleNotificationAction}
            onNotificationsChanged={() => void refreshUnreadNotifications(profile.id, Boolean(profile.is_demo))}
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
