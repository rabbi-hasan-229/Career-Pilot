import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { TodayPlanView } from './components/TodayPlanView';
import { OverviewAnalyticsView } from './components/OverviewAnalyticsView';
import { AICoachView } from './components/AICoachView';
import { RoadmapTimelineView } from './components/RoadmapTimelineView';
import { CheckpointQuestionModal } from './components/CheckpointQuestionModal';
import { RoleQuestSelectorModal } from './components/RoleQuestSelectorModal';
import { InterviewSimulatorView } from './components/InterviewSimulatorView';
import { CVBuilderView } from './components/CVBuilderView';
import { SkillGapView } from './components/SkillGapView';
import { QuickActionSheetModal } from './components/QuickActionSheetModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { AuthModal } from './components/AuthModal';
import {
  initialProfile,
  initialMilestones,
  initialTasks,
  initialCoachMessages,
} from './lib/mockData';
import { applyQuickPlannerAction } from './lib/plannerEngine';
import { supabase } from './lib/supabase';
import { getInitialTheme, applyTheme } from './lib/theme';
import type { ThemeMode } from './lib/theme';
import type { ActiveNavTab, Task, AICoachMessage, Profile } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('home');
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [coachMessages, setCoachMessages] = useState<AICoachMessage[]>(initialCoachMessages);
  const [activeQuizTask, setActiveQuizTask] = useState<Task | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isQuickActionSheetOpen, setIsQuickActionSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Material 3 Dark / Light Mode
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Responsive Width Detection
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Supabase Live Verification & Auth Listener
  useEffect(() => {
    async function verifySupabase() {
      try {
        const { data } = await supabase.from('roles').select('id, title, slug');
        if (data && data.length > 0) {
          console.log('Connected to remote Supabase project:', data.map((r) => r.title).join(', '));
        }

        const { data: authData } = await supabase.auth.getSession();
        if (authData.session?.user) {
          const user = authData.session.user;
          setProfile((p) => ({
            ...p,
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || p.full_name,
          }));
        }
      } catch (e) {
        console.warn('Local fallback active:', e);
      }
    }
    verifySupabase();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Decrement AI Prompt Quota
  const handleUseAICall = () => {
    setProfile((prev) => ({
      ...prev,
      ai_prompts_left: Math.max(0, prev.ai_prompts_left - 1),
    }));
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

    showToast('✨ Checkpoint Verified! Session marked Complete.');
    setActiveQuizTask(null);

    // Record submission to Supabase
    try {
      await supabase.from('quiz_submissions').insert({
        task_id: taskId,
        user_id: profile.id,
        selected_option: 'correct',
        is_correct: true,
      });
    } catch {
      // offline/demo fallback
    }
  };

  // Re-planning Action handler (Docx Section 6)
  const handleApplyPlannerAction = (action: 'behind' | 'early' | 'pause', days?: number) => {
    const updated = applyQuickPlannerAction(milestones, action);
    setMilestones(updated);

    const msgs: Record<string, string> = {
      behind: `Milestone shifted by +${days || 3} days. Unfinished tasks moved to free slots.`,
      early: 'Stage marked complete! Next milestone pulled forward.',
      pause: 'Roadmap shifted by +7 days without breaking streak.',
    };

    showToast(`📅 Planner Updated: ${msgs[action]}`);
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

    // Check if user is asking for replan
    if (text.toLowerCase().includes('behind') || text.toLowerCase().includes('shift')) {
      setTimeout(() => {
        const aiReply: AICoachMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: 'I checked your remaining effort. We can shift your current milestone by 3 days and rebalance your weekday sessions without affecting the final target date.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          proposal: {
            action: 'shift_milestone',
            title: 'Shift Current Milestone (+3 Days)',
            description: 'Moves 3 overdue sessions to free slots. Total remaining effort stays on schedule.',
            days: 3,
          },
        };
        setCoachMessages((prev) => [...prev, aiReply]);
      }, 700);
    } else {
      setTimeout(() => {
        const aiReply: AICoachMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: `Got it! I am keeping your weekly plan aligned with your 90 min/day target for ${profile.target_role}. Keep up the momentum!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setCoachMessages((prev) => [...prev, aiReply]);
      }, 600);
    }

    handleUseAICall();
  };

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
            zIndex: 1600,
            background: 'var(--md-surface)',
            color: 'var(--md-text-primary)',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            border: '1px solid var(--md-outline)',
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Shell (Desktop Widescreen or Mobile Container) */}
      <div className="app-desktop-shell">
        {/* Left Desktop Sidebar (Hidden on Mobile) */}
        <DesktopSidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          profile={profile}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Content Area */}
        <main className="desktop-main-area">
          {/* Top Navbar */}
          <Navbar
            profile={profile}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenProfile={() => setIsSettingsOpen(true)}
          />

          {/* VIEW: Home / Today's Plan */}
          {activeTab === 'home' && (
            isDesktop ? (
              /* Smart Widescreen Multi-Column View on PC */
              <div className="desktop-grid-2col">
                <div>
                  <TodayPlanView
                    tasks={tasks}
                    onSelectTaskForQuiz={(t) => setActiveQuizTask(t)}
                    onOpenCoach={() => setActiveTab('coach')}
                    onViewAllPlans={() => setActiveTab('plan')}
                  />
                </div>
                <div>
                  <OverviewAnalyticsView isDesktopEmbedded={true} />
                </div>
              </div>
            ) : (
              /* Mobile View */
              <TodayPlanView
                tasks={tasks}
                onSelectTaskForQuiz={(t) => setActiveQuizTask(t)}
                onOpenCoach={() => setActiveTab('coach')}
                onViewAllPlans={() => setActiveTab('plan')}
              />
            )
          )}

          {/* VIEW: Plan / Roadmap */}
          {activeTab === 'plan' && (
            <RoadmapTimelineView
              milestones={milestones}
              profile={profile}
              onApplyAction={(act) => handleApplyPlannerAction(act)}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
            />
          )}

          {/* VIEW: Overview / Analytics */}
          {activeTab === 'overview' && (
            <OverviewAnalyticsView onBack={() => setActiveTab('home')} />
          )}

          {/* VIEW: AI Coach Assistant */}
          {activeTab === 'coach' && (
            <AICoachView
              messages={coachMessages}
              promptsLeft={profile.ai_prompts_left}
              onSendMessage={handleSendCoachMessage}
              onApplyProposal={(_act, days) => handleApplyPlannerAction('behind', days)}
              onBack={() => setActiveTab('home')}
            />
          )}

          {/* VIEW: Mock Interview Arena (Phase 4) */}
          {activeTab === 'interview' && (
            <InterviewSimulatorView
              aiPromptsLeft={profile.ai_prompts_left}
              onUseAICall={handleUseAICall}
            />
          )}

          {/* VIEW: CV & Resume Builder (Phase 4) */}
          {activeTab === 'cv' && (
            <CVBuilderView
              aiPromptsLeft={profile.ai_prompts_left}
              onUseAICall={handleUseAICall}
              onToast={showToast}
            />
          )}

          {/* VIEW: Skill-Gap & Vacancies Match (Phase 4) */}
          {activeTab === 'skills' && (
            <SkillGapView
              targetRole={profile.target_role}
              onToast={showToast}
              onAddSkillToRoadmap={(sk) => showToast(`🎯 Queued "${sk}" into next milestone!`)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Hidden on PC >= 1024px) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionSheetOpen(true)}
      />

      {/* Quick Action Sheet Modal (Opened by + FAB on Mobile) */}
      <QuickActionSheetModal
        isOpen={isQuickActionSheetOpen}
        onClose={() => setIsQuickActionSheetOpen(false)}
        onSelectTab={setActiveTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onQuickReplan={handleApplyPlannerAction}
      />

      {/* Checkpoint Question Challenge Modal */}
      {activeQuizTask && (
        <CheckpointQuestionModal
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
          onSelectNewPlan={(roleTitle, _targetDate, dailyMins, newMilestones) => {
            setProfile((prev) => ({
              ...prev,
              target_role: roleTitle,
              daily_minutes: dailyMins,
            }));
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
        onUpdateProfile={(updated) => setProfile((p) => ({ ...p, ...updated }))}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToast={showToast}
      />

      {/* Supabase Authentication & Demo Switcher Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSelectProfile={(newProfile) => {
          setProfile(newProfile);
          showToast(`👤 Signed in as ${newProfile.full_name}`);
        }}
        onToast={showToast}
      />
    </div>
  );
}

export default App;
