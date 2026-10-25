import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { RoadmapView } from './features/roadmap/RoadmapView';
import { WeeklyScheduleView } from './features/roadmap/WeeklyScheduleView';
import { CheckpointQuizModal } from './features/roadmap/CheckpointQuizModal';
import { RoleQuestSelectorModal } from './components/RoleQuestSelectorModal';
import { OnboardingGoalModal } from './features/onboarding/OnboardingGoalModal';
import { NotificationCenterModal } from './features/notifications/NotificationCenterModal';
import { AuthScreen } from './features/auth/AuthScreen';
import { OverviewAnalyticsView } from './components/OverviewAnalyticsView';
import { ProfileAccountView } from './components/ProfileAccountView';
import { AICoachView } from './features/coach/AICoachView';
import { InterviewSimulatorView } from './components/InterviewSimulatorView';
import { CVBuilderView } from './components/CVBuilderView';
import { SkillGapView } from './components/SkillGapView';
import { QuickActionSheetModal } from './components/QuickActionSheetModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { SignOutModal } from './components/SignOutModal';
import confetti from 'canvas-confetti';
import {
  initialCoachMessages,
} from './lib/mockData';
import {
  applyQuickPlannerAction,
  generateRoadmapForRole,
  generateTasksForMilestones,
} from './features/roadmap/plannerEngine';
import { authService } from './features/auth/authService';
import { notificationService } from './features/notifications/notificationService';
import { supabase } from './lib/supabase';
import { getInitialTheme, applyTheme } from './lib/theme';
import type { ThemeMode } from './lib/theme';
import type { ActiveNavTab, Task, AICoachMessage, Profile, Milestone } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('home');
  const [profile, setProfile] = useState<Profile | null>(() => authService.getSession());
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const role = profile?.target_role || 'UI/UX Designer';
    return generateRoadmapForRole(role, profile?.target_timeline_months || 6, profile?.daily_minutes || 60);
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const role = profile?.target_role || 'UI/UX Designer';
    const initMilestones = generateRoadmapForRole(role, profile?.target_timeline_months || 6, profile?.daily_minutes || 60);
    return generateTasksForMilestones(initMilestones, role);
  });
  const [coachMessages, setCoachMessages] = useState<AICoachMessage[]>(initialCoachMessages);

  // Modals & Sheets
  const [activeQuizTask, setActiveQuizTask] = useState<Task | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Supabase Auth Check & Persistence Sync
  useEffect(() => {
    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const user = data.session.user;
          const current = authService.getSession();
          if (!current) {
            const newProf: Profile = {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Navigator',
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || 'user')}`,
              target_role: user.user_metadata?.target_role || '',
              plan: 'free',
              daily_minutes: 60,
              ai_prompts_left: 15,
              streak_days: 1,
              created_at: new Date().toISOString(),
              is_guest: false,
              has_completed_onboarding: Boolean(user.user_metadata?.target_role),
            };
            authService.saveSession(newProf);
            setProfile(newProf);
          }
        }
      } catch (e) {
        console.warn('Auth sync info:', e);
      }
    }
    initAuth();
  }, []);

  // Automatic Check for Unmarked Daily Tasks & Push Notification Alert
  useEffect(() => {
    if (profile && profile.has_completed_onboarding) {
      notificationService.checkUnmarkedProgress(tasks, profile);
    }
  }, [tasks, profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestSignOut = () => {
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSignOutModalOpen(false);
    await authService.signOut();
    setProfile(null);
    showToast('👋 Signed out. Please authenticate to continue.');
  };

  const handleAuthenticated = (newProfile: Profile) => {
    setProfile(newProfile);
    if (newProfile.target_role) {
      const generated = generateRoadmapForRole(
        newProfile.target_role,
        newProfile.target_timeline_months || 6,
        newProfile.daily_minutes || 60
      );
      const newTasks = generateTasksForMilestones(generated, newProfile.target_role);
      setMilestones(generated);
      setTasks(newTasks);
    }
  };

  const handleOnboardingComplete = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    const generated = generateRoadmapForRole(
      updatedProfile.target_role,
      updatedProfile.target_timeline_months || 6,
      updatedProfile.daily_minutes || 60
    );
    const newTasks = generateTasksForMilestones(generated, updatedProfile.target_role);
    setMilestones(generated);
    setTasks(newTasks);
    showToast(`🚀 Roadmap generated for ${updatedProfile.target_role}!`);
  };

  // Decrement AI Prompt Quota
  const handleUseAICall = () => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        ai_prompts_left: Math.max(0, prev.ai_prompts_left - 1),
      };
      authService.saveSession(updated);
      return updated;
    });
  };

  // Checkpoint Quiz Passing handler
  const handlePassCheckpoint = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, done_at: new Date().toISOString(), progress_pct: 100 }
          : t
      )
    );

    showToast('✨ Checkpoint Passed! Task marked 100% Complete.');
    setActiveQuizTask(null);

    // Record submission to Supabase
    if (profile) {
      try {
        await supabase.from('quiz_submissions').insert({
          task_id: taskId,
          user_id: profile.id,
          selected_option: 'correct',
          is_correct: true,
        });
      } catch {}
    }
  };

  // Direct Task Toggle
  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.done_at != null;
          return {
            ...t,
            done_at: isDone ? null : new Date().toISOString(),
            progress_pct: isDone ? 0 : 100,
          };
        }
        return t;
      })
    );
  };

  // Re-planning Action handler
  const handleApplyPlannerAction = (action: 'behind' | 'early' | 'pause') => {
    const result = applyQuickPlannerAction(milestones, tasks, action);
    setMilestones(result.updatedMilestones);
    setTasks(result.updatedTasks);

    if (action === 'early') {
      confetti({
        particleCount: 50,
        spread: 75,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#10B981', '#38BDF8', '#2563EB', '#F59E0B'],
      });
    }

    showToast(`📅 Planner Updated: ${result.message}`);
  };

  // Coach Send Message handler
  const handleSendCoachMessage = (text: string) => {
    const userMsg: AICoachMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCoachMessages((prev) => [...prev, userMsg]);

    if (text.toLowerCase().includes('behind') || text.toLowerCase().includes('shift')) {
      setTimeout(() => {
        const aiReply: AICoachMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: 'I checked your remaining effort. We can shift your current stage by 3 days and rebalance your daily sessions without affecting the final target date.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          proposal: {
            action: 'shift_milestone',
            title: 'Shift Current Stage (+3 Days)',
            description: 'Moves remaining sessions to free slots. Total remaining effort stays on schedule.',
            days: 3,
          },
        };
        setCoachMessages((prev) => [...prev, aiReply]);
      }, 600);
    } else {
      setTimeout(() => {
        const aiReply: AICoachMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: `Got it! I am keeping your daily plan aligned with your ${profile?.daily_minutes || 60} min/day commitment for ${profile?.target_role || 'your career goal'}. Keep up the momentum!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setCoachMessages((prev) => [...prev, aiReply]);
      }, 500);
    }

    handleUseAICall();
  };

  // =========================================================================
  // HARD AUTHENTICATION GATE
  // Unauthenticated users CANNOT use this app; they must authenticate first.
  // =========================================================================
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
        <AuthScreen onAuthenticated={handleAuthenticated} onToast={showToast} />
      </>
    );
  }

  // =========================================================================
  // POST-SIGNUP ONBOARDING WIZARD
  // User must set their career goal, timeline to achieve it, and daily pace.
  // =========================================================================
  if (!profile.has_completed_onboarding || !profile.target_role) {
    return (
      <OnboardingGoalModal
        profile={profile}
        onComplete={handleOnboardingComplete}
      />
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
        {/* Left Desktop Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          profile={profile}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setActiveTab('profile')}
          onSignOut={handleRequestSignOut}
        />

        {/* Main Content Area */}
        <main className="desktop-main-area">
          {/* Top Navbar */}
          <Navbar
            profile={profile}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenGoalSettings={() => setIsRoleModalOpen(true)}
            onSignOut={handleRequestSignOut}
          />

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
              onOpenCoach={() => setActiveTab('coach')}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
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
              onOpenCoach={() => setActiveTab('coach')}
            />
          )}

          {/* VIEW: Overview / Analytics */}
          {activeTab === 'overview' && (
            <OverviewAnalyticsView
              milestones={milestones}
              tasks={tasks}
              profile={profile}
              onBack={() => setActiveTab('home')}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveNavTab)}
              onApplyPlannerAction={handleApplyPlannerAction}
              onOpenGoalSettings={() => setIsRoleModalOpen(true)}
            />
          )}

          {/* VIEW: AI Career Coach */}
          {activeTab === 'coach' && (
            <AICoachView
              messages={coachMessages}
              promptsLeft={profile.ai_prompts_left}
              onSendMessage={handleSendCoachMessage}
              onApplyProposal={(_act) => handleApplyPlannerAction('behind')}
              onBack={() => setActiveTab('home')}
            />
          )}

          {/* VIEW: Mock Interview Arena */}
          {activeTab === 'interview' && (
            <InterviewSimulatorView
              aiPromptsLeft={profile.ai_prompts_left}
              onUseAICall={handleUseAICall}
            />
          )}

          {/* VIEW: CV & Resume Builder */}
          {activeTab === 'cv' && (
            <CVBuilderView
              aiPromptsLeft={profile.ai_prompts_left}
              onUseAICall={handleUseAICall}
              onToast={showToast}
            />
          )}

          {/* VIEW: Skill-Gap & Vacancies Match */}
          {activeTab === 'skills' && (
            <SkillGapView
              targetRole={profile.target_role}
              onToast={showToast}
              onAddSkillToRoadmap={(sk) => showToast(`🎯 Queued "${sk}" into next roadmap stage!`)}
            />
          )}

          {/* VIEW: Separate Dedicated Account & Professional Profile */}
          {activeTab === 'profile' && (
            <ProfileAccountView
              profile={profile}
              milestones={milestones}
              tasks={tasks}
              theme={theme}
              onUpdateProfile={(updated) => {
                setProfile((p) => {
                  if (!p) return p;
                  const res = { ...p, ...updated };
                  authService.saveSession(res);
                  return res;
                });
              }}
              onToggleTheme={toggleTheme}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
              onSignOut={handleRequestSignOut}
              onNavigateToTab={setActiveTab}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionSheetOpen(true)}
      />

      {/* Quick Action Sheet Modal */}
      <QuickActionSheetModal
        isOpen={isQuickActionSheetOpen}
        onClose={() => setIsQuickActionSheetOpen(false)}
        onSelectTab={setActiveTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onQuickReplan={handleApplyPlannerAction}
      />

      {/* Checkpoint Question Challenge Modal */}
      {activeQuizTask && (
        <CheckpointQuizModal
          task={activeQuizTask}
          onClose={() => setActiveQuizTask(null)}
          onPassTask={handlePassCheckpoint}
        />
      )}

      {/* Role / Career Quest Selection Modal */}
      {isRoleModalOpen && (
        <RoleQuestSelectorModal
          currentRoleSlug={profile.target_role.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          onClose={() => setIsRoleModalOpen(false)}
          onSelectNewPlan={(roleTitle, targetDate, dailyMins, newMilestones) => {
            setProfile((prev) => {
              if (!prev) return prev;
              const targetDateObj = new Date(targetDate);
              const daysDiff = Math.max(14, Math.ceil((targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              const months = Math.max(1, Math.round(daysDiff / 30));
              const updated = {
                ...prev,
                target_role: roleTitle,
                target_timeline_months: months,
                target_completion_date: targetDate,
                daily_minutes: dailyMins,
              };
              authService.saveSession(updated);
              return updated;
            });
            setMilestones(newMilestones);
            setIsRoleModalOpen(false);
            showToast(`🚀 Roadmap Updated for ${roleTitle} (${dailyMins}m/day)!`);
          }}
        />
      )}

      {/* Profile & Preferences Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={(updated) => {
          setProfile((p) => {
            if (!p) return p;
            const res = { ...p, ...updated };
            authService.saveSession(res);
            return res;
          });
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => {}}
        onSignOut={handleRequestSignOut}
        onToast={showToast}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        tasks={tasks}
        profile={profile}
        onToast={showToast}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirmSignOut={handleConfirmSignOut}
      />
    </div>
  );
}

export default App;
