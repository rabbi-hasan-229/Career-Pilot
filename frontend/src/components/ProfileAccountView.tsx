import React, { useEffect, useState } from 'react';
import {
  User,
  Shield,
  CreditCard,
  Award,
  Settings as SettingsIcon,
  Compass,
  CheckCircle2,
  Clock,
  Zap,
  Flame,
  Bot,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sparkles,
  ArrowLeft,
  Save,
  RotateCcw,
  Download,
  Check,
  AlertCircle,
  Lock,
  Bell,
  Sun,
  Moon,
  Camera,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { AvatarPicker } from '../features/auth/AuthIllustration';
import type { Profile, ActiveNavTab, Milestone, Task } from '../types';
import type { ThemeMode } from '../lib/theme';
import { downloadAccountExport, exportAccountData } from '../features/account/accountRepository';
import type { AIQuotaSummary } from '../features/ai/aiGateway';
import { supabase } from '../lib/supabase';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon: React.FC<{ size?: number; className?: string }> = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface Props {
  profile: Profile;
  milestones?: Milestone[];
  tasks?: Task[];
  earnedAchievements?: Record<string, string>;
  aiQuota?: AIQuotaSummary | null;
  theme: ThemeMode;
  onUpdateProfile: (updated: Partial<Profile>) => Promise<void>;
  onToggleTheme: () => void;
  onOpenRoleModal: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
  onNavigateToTab: (tab: ActiveNavTab) => void;
  onToast: (msg: string) => void;
}

type ProfileTab = 'identity' | 'career' | 'plan' | 'badges' | 'security';

export const ProfileAccountView: React.FC<Props> = ({
  profile,
  milestones = [],
  tasks = [],
  earnedAchievements = {},
  aiQuota = null,
  theme,
  onUpdateProfile,
  onToggleTheme,
  onOpenRoleModal,
  onSignOut,
  onDeleteAccount,
  onNavigateToTab,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
  const [mfaFactors, setMfaFactors] = useState<Array<{ id: string; friendly_name?: string; factor_type: string; status: string }>>([]);
  const [mfaSetup, setMfaSetup] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [mfaFriendlyName, setMfaFriendlyName] = useState('Primary authenticator');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [confirmDisableFactorId, setConfirmDisableFactorId] = useState<string | null>(null);
  const [mfaSupported, setMfaSupported] = useState(true);

  // Form state
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [email] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || '');
  const [githubUrl, setGithubUrl] = useState(profile.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '/avatars/career_navigator.jpg');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Career pacing state
  const [dailyMinutes, setDailyMinutes] = useState(profile.daily_minutes || 60);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'switcher' | 'junior' | 'mid'>(
    profile.experience_level || 'junior'
  );
  const [learningStyle, setLearningStyle] = useState<'hands_on' | 'balanced' | 'fast_track'>(
    profile.learning_style || 'hands_on'
  );

  // Subscription state
  const selectedPlan = profile.plan || 'free';
  const totalAIQuota = aiQuota
    ? Object.values(aiQuota).reduce((total, quota) => ({ remaining: total.remaining + quota.remaining, limit: total.limit + quota.limit }), { remaining: 0, limit: 0 })
    : null;
  const totalAIQuotaPercent = totalAIQuota?.limit
    ? Math.round((totalAIQuota.remaining / totalAIQuota.limit) * 100)
    : 0;

  // Notifications & Security
  const [dailyReminder, setDailyReminder] = useState(profile.notification_daily_reminder ?? true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(profile.notification_milestone_alerts ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(profile.notification_weekly_digest ?? true);
  const verifiedMfaFactors = mfaFactors.filter((factor) => factor.factor_type === 'totp' && factor.status === 'verified');
  const pendingMfaFactors = mfaFactors.filter((factor) => factor.factor_type === 'totp' && factor.status === 'unverified');
  const twoFactor = verifiedMfaFactors.length > 0;

  const refreshMfaFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMfaSupported(false);
      setMfaError('Authenticator verification is unavailable for this account right now.');
      return;
    }
    setMfaSupported(true);
    setMfaFactors(data.all);
    setMfaFriendlyName(data.totp.length ? `Backup authenticator ${data.totp.length + 1}` : 'Primary authenticator');
    setMfaError('');
  };

  useEffect(() => {
    if (activeTab !== 'security' || profile.is_demo) return;
    let active = true;
    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMfaSupported(false);
        setMfaError('Authenticator verification is unavailable for this account right now.');
        return;
      }
      setMfaSupported(true);
      setMfaFactors(data.all);
      setMfaFriendlyName(data.totp.length ? `Backup authenticator ${data.totp.length + 1}` : 'Primary authenticator');
      setMfaError('');
    });
    return () => { active = false; };
  }, [activeTab, profile.is_demo]);

  const beginMfaEnrollment = async () => {
    if (profile.is_demo) return;
    setMfaBusy(true);
    setMfaError('');
    const friendlyName = mfaFriendlyName.trim();
    if (!friendlyName || friendlyName.length > 40) {
      setMfaError('Give this authenticator a name between 1 and 40 characters.');
      setMfaBusy(false);
      return;
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName });
    if (error || !data?.totp) {
      setMfaError(error?.message ?? 'Could not start authenticator setup.');
    } else {
      const qrCode = data.totp.qr_code.startsWith('data:')
        ? data.totp.qr_code
        : `data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`;
      setMfaSetup({ id: data.id, qrCode, secret: data.totp.secret });
      setMfaCode('');
    }
    setMfaBusy(false);
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaSetup || !/^\d{6}$/.test(mfaCode)) {
      setMfaError('Enter the six-digit code from your authenticator app.');
      return;
    }
    setMfaBusy(true);
    setMfaError('');
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaSetup.id });
    if (challengeError) {
      setMfaError('Could not verify the authenticator code. Please try again.');
      setMfaBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaSetup.id, challengeId: challenge.id, code: mfaCode });
    if (error) {
      setMfaError('That code was not accepted. Check the time on your device and try again.');
      setMfaBusy(false);
      return;
    }
    setMfaSetup(null);
    setMfaCode('');
    await refreshMfaFactors();
    onToast('Authenticator verification is now enabled.');
    setMfaBusy(false);
  };

  const disableMfaFactor = async (factorId: string) => {
    setMfaBusy(true);
    setMfaError('');
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setMfaError('Could not remove this authenticator. Please try again.');
    } else {
      await supabase.auth.refreshSession();
      setConfirmDisableFactorId(null);
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) {
        setMfaError('The authenticator was removed, but the remaining security state could not be checked. Sign out and back in to refresh it.');
      } else {
        setMfaFactors(factors.all);
        const hasAnotherVerifiedFactor = [...factors.totp, ...factors.phone, ...factors.webauthn].some((factor) => factor.status === 'verified');
        if (hasAnotherVerifiedFactor) {
          await supabase.auth.signOut();
          onToast('Authenticator removed. Sign in again and verify with your remaining authenticator.');
        } else {
          onToast('Authenticator verification is now disabled.');
        }
      }
    }
    setMfaBusy(false);
  };

  const cancelMfaEnrollment = async () => {
    if (!mfaSetup) return;
    setMfaBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaSetup.id });
    if (error) {
      setMfaError('Could not cancel authenticator setup. Please try again.');
    } else {
      setMfaSetup(null);
      setMfaCode('');
      setMfaError('');
      await refreshMfaFactors();
    }
    setMfaBusy(false);
  };

  const removePendingMfaFactor = async (factorId: string) => {
    setMfaBusy(true);
    setMfaError('');
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setMfaError('Could not remove the incomplete authenticator setup. Please try again.');
    } else {
      await refreshMfaFactors();
      onToast('Incomplete authenticator setup removed.');
    }
    setMfaBusy(false);
  };

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteDialogRef = useAccessibleDialog<HTMLFormElement>(isDeleteConfirmOpen, () => {
    if (!isDeleting) setIsDeleteConfirmOpen(false);
  });

  // Detect dirty state
  const isDirty =
    fullName !== (profile.full_name || '') ||
    username !== (profile.username || '') ||
    bio !== (profile.bio || '') ||
    phone !== (profile.phone || '') ||
    location !== (profile.location || '') ||
    portfolioUrl !== (profile.portfolio_url || '') ||
    githubUrl !== (profile.github_url || '') ||
    linkedinUrl !== (profile.linkedin_url || '') ||
    avatarUrl !== (profile.avatar_url || '/avatars/career_navigator.jpg') ||
    dailyMinutes !== (profile.daily_minutes || 60) ||
    experienceLevel !== (profile.experience_level || 'junior') ||
    learningStyle !== (profile.learning_style || 'hands_on') ||
    dailyReminder !== (profile.notification_daily_reminder ?? true) ||
    milestoneAlerts !== (profile.notification_milestone_alerts ?? true) ||
    weeklyDigest !== (profile.notification_weekly_digest ?? true);

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateProfile({
        full_name: fullName,
        username,
        bio,
        phone,
        location,
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        avatar_url: avatarUrl,
        daily_minutes: dailyMinutes,
        experience_level: experienceLevel,
        learning_style: learningStyle,
        notification_daily_reminder: dailyReminder,
        notification_milestone_alerts: milestoneAlerts,
        notification_weekly_digest: weeklyDigest,
      });
      onToast('✅ Account & Profile successfully updated!');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your account changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Revert handler
  const handleRevert = () => {
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setPhone(profile.phone || '');
    setLocation(profile.location || '');
    setPortfolioUrl(profile.portfolio_url || '');
    setGithubUrl(profile.github_url || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setAvatarUrl(profile.avatar_url || '/avatars/career_navigator.jpg');
    setDailyMinutes(profile.daily_minutes || 60);
    setExperienceLevel(profile.experience_level || 'junior');
    setLearningStyle(profile.learning_style || 'hands_on');
    setDailyReminder(profile.notification_daily_reminder ?? true);
    setMilestoneAlerts(profile.notification_milestone_alerts ?? true);
    setWeeklyDigest(profile.notification_weekly_digest ?? true);
    onToast('🔄 Unsaved changes reverted.');
  };

  // Export JSON handler
  const handleExportData = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const data = await exportAccountData(profile, milestones, tasks);
      downloadAccountExport(data, profile.target_role);
      onToast('Your account data export has been downloaded.');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not export your account data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete this account.');
      setIsDeleting(false);
    }
  };

  const completedTaskCount = tasks.filter((task) => Boolean(task.done_at)).length;
  const completionRate = tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : null;
  const memberSince = Number.isNaN(Date.parse(profile.created_at))
    ? 'Member'
    : `Member since ${new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(profile.created_at))}`;
  const quizTasks = tasks.filter((task) => Boolean(task.quiz));
  const completedQuizCount = quizTasks.filter((task) => Boolean(task.done_at)).length;
  const taskProgress = tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : 0;
  const quizProgress = quizTasks.length ? Math.round((completedQuizCount / quizTasks.length) * 100) : 0;
  const badgesList = [
    { id: 'first_step', name: 'First Footprint', desc: 'Complete your first learning task.', icon: '👣', progress: completedTaskCount ? 100 : 0, hint: `${completedTaskCount} tasks completed` },
    { id: 'quiz_master_1', name: 'Riddle Solver', desc: 'Pass your first checkpoint quiz.', icon: '🧠', progress: quizProgress, hint: `${completedQuizCount} checkpoints passed` },
    { id: 'streak_3', name: 'Momentum Seeker', desc: 'Maintain a 3-day learning streak.', icon: '🔥', progress: Math.min(100, Math.round((profile.streak_days / 3) * 100)), hint: `${profile.streak_days}/3 day streak` },
    { id: 'streak_7', name: 'Island Pioneer', desc: 'Maintain a 7-day learning streak.', icon: '🏆', progress: Math.min(100, Math.round((profile.streak_days / 7) * 100)), hint: `${profile.streak_days}/7 day streak` },
    { id: 'role_graduate', name: 'Quest Champion', desc: 'Complete every task in your career roadmap.', icon: '👑', progress: taskProgress, hint: `${completedTaskCount}/${tasks.length} tasks completed` },
  ].map((badge) => {
    const unlockedAt = earnedAchievements[badge.id];
    const demoUnlocked = Boolean(profile.is_demo) && (
      (badge.id === 'first_step' && completedTaskCount > 0) ||
      (badge.id === 'quiz_master_1' && completedQuizCount > 0) ||
      (badge.id === 'streak_3' && profile.streak_days >= 3) ||
      (badge.id === 'streak_7' && profile.streak_days >= 7) ||
      (badge.id === 'role_graduate' && tasks.length > 0 && completedTaskCount === tasks.length)
    );
    return {
      ...badge,
      unlocked: Boolean(unlockedAt) || demoUnlocked,
      date: unlockedAt
        ? `Earned ${new Date(unlockedAt).toLocaleDateString()}`
        : demoUnlocked
          ? 'Earned in demo session'
          : badge.hint,
      progress: `${Math.min(100, badge.progress)}%`,
    };
  });

  return (
    <div className="pa-container">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BREADCRUMB & SAVE ACTION BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="pa-top-bar">
        <div className="pa-breadcrumbs">
          <button
            type="button"
            className="pa-btn-back"
            onClick={() => onNavigateToTab('home')}
            aria-label="Back to Roadmap"
          >
            <ArrowLeft size={14} />
            <span>Roadmap Highway</span>
          </button>
          <span className="pa-breadcrumb-sep">/</span>
          <span className="pa-breadcrumb-current">Account & Professional Profile</span>
        </div>

        <div className="pa-top-actions">
          {isDirty && (
            <button type="button" className="pa-btn-secondary" onClick={handleRevert} title="Revert edits">
              <RotateCcw size={13} />
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            className={`pa-btn-primary ${isDirty ? 'pulse-save' : ''}`}
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            title={isDirty ? 'Save your changes' : 'All changes saved'}
          >
            {isSaving ? (
              <>
                <Clock size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : isDirty ? (
              <>
                <Save size={13} />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Check size={13} />
                <span>Changes Synced</span>
              </>
            )}
          </button>
          {saveError && <p role="alert" className="pa-error-message">{saveError}</p>}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. HERO PROFILE SHOWCASE CARD
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="pa-hero-card" aria-label="Profile Header">
        <div className="pa-hero-grid">
          {/* Avatar with edit overlay */}
          <div className="pa-avatar-wrap">
            <div className="pa-avatar-frame">
              <img src={avatarUrl} alt={fullName} className="pa-avatar-img" />
              <button
                type="button"
                className="pa-avatar-edit-badge"
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                title="Change Avatar"
                aria-label="Change Avatar"
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          {/* User Identity Details */}
          <div className="pa-identity-details">
            <div className="pa-identity-kicker-row">
              <span className="pa-handle-pill">@{username}</span>
              <span className="pa-verified-pill">
                <CheckCircle2 size={11} /> Verified Member
              </span>
              <span className="pa-plan-kicker-pill">{selectedPlan === 'premium' ? 'Pro' : 'Free Tier'}</span>
            </div>

            <h1 className="pa-user-heading">{fullName || 'Alex Rivera'}</h1>
            <p className="pa-user-bio">{bio}</p>

            <div className="pa-meta-pills-row">
              <button
                type="button"
                className="pa-meta-role-btn"
                onClick={onOpenRoleModal}
                title="Switch Target Career Roadmap"
              >
                <Compass size={13} />
                <span>{profile.target_role || 'Choose a career goal'}</span>
                <ChevronRight size={12} />
              </button>
              <span className="pa-meta-text-pill">
                <MapPin size={12} /> {location}
              </span>
              <span className="pa-meta-text-pill">
                <Clock size={12} /> {memberSince}
              </span>
            </div>
          </div>

          {/* 4 Quick Telemetry Indicators */}
          <div className="pa-hero-stats-panel">
            <div className="pa-stat-box">
              <div className="pa-stat-icon">
                <Flame size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{profile.streak_days ?? 0} Days</span>
                <span className="pa-stat-lbl">Streak</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon">
                <Zap size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{completionRate === null ? '—' : `${completionRate}%`}</span>
                <span className="pa-stat-lbl">Completed</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon">
                <Bot size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{aiQuota ? `${aiQuota.coach.remaining}/${aiQuota.coach.limit}` : '—'}</span>
                <span className="pa-stat-lbl">Coach Left</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon">
                <Clock size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{profile.target_timeline_months || 6} Months</span>
                <span className="pa-stat-lbl">Timeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Avatar Picker Drawer */}
        {isAvatarPickerOpen && (
          <div className="pa-avatar-drawer">
            <div className="pa-avatar-drawer-header">
              <span className="pa-drawer-title">Choose Your Career Navigator Avatar</span>
              <button
                type="button"
                className="pa-btn-close-drawer"
                onClick={() => setIsAvatarPickerOpen(false)}
              >
                Done
              </button>
            </div>
            <AvatarPicker
              selectedUrl={avatarUrl}
              onSelect={(url) => {
                setAvatarUrl(url);
                setIsAvatarPickerOpen(false);
              }}
            />
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. CATEGORY NAVIGATION TABS
      ────────────────────────────────────────────────────────────────────────── */}
      <nav className="pa-subnav-bar" aria-label="Profile navigation sections">
        <button
          type="button"
          className={`pa-subnav-btn ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <User size={15} />
          <span>Identity & Persona</span>
        </button>

        <button
          type="button"
          className={`pa-subnav-btn ${activeTab === 'career' ? 'active' : ''}`}
          onClick={() => setActiveTab('career')}
        >
          <Compass size={15} />
          <span>Career & Pacing</span>
        </button>

        <button
          type="button"
          className={`pa-subnav-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <CreditCard size={15} />
          <span>Plan & AI Quota</span>
        </button>

        <button
          type="button"
          className={`pa-subnav-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <Award size={15} />
          <span>Credentials & Badges</span>
        </button>

        <button
          type="button"
          className={`pa-subnav-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={15} />
          <span>Security & System</span>
        </button>
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. TAB CONTENT PANELS
      ────────────────────────────────────────────────────────────────────────── */}
      <main className="pa-main-content">
        {/* ─── TAB 1: IDENTITY & PERSONA ──────────────────────────────────────── */}
        {activeTab === 'identity' && (
          <div className="pa-tab-section">
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <User size={18} style={{ color: 'var(--md-primary)' }} />
                <span>Personal Information</span>
              </h2>
              <p className="pa-panel-desc">
                Profile name, contact details, and public bio.
              </p>

              <div className="pa-form-grid">
                <div className="pa-field-group">
                  <label htmlFor="pa-fullname" className="pa-label">
                    Full Name
                  </label>
                  <input
                    id="pa-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pa-input"
                    placeholder="e.g. Alex Rivera"
                  />
                </div>

                <div className="pa-field-group">
                  <label htmlFor="pa-username" className="pa-label">
                    Profile Handle / Username
                  </label>
                  <div className="pa-input-prefix-wrap">
                    <span className="pa-input-prefix">@</span>
                    <input
                      id="pa-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pa-input with-prefix"
                      placeholder="alex.rivera"
                    />
                  </div>
                </div>

                <div className="pa-field-group full-width">
                  <label htmlFor="pa-bio" className="pa-label">
                    Professional Bio & Career Objective
                  </label>
                  <textarea
                    id="pa-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="pa-textarea"
                    placeholder="Briefly state your career specialization and goals..."
                  />
                </div>

                <div className="pa-field-group">
                  <label htmlFor="pa-email" className="pa-label">
                    Primary Email (Verified)
                  </label>
                  <div className="pa-input-icon-wrap">
                    <Mail size={15} className="pa-input-icon" />
                    <input
                      id="pa-email"
                      type="email"
                      value={email}
                      readOnly
                      className="pa-input with-icon readonly"
                    />
                    <span className="pa-verified-badge">Verified</span>
                  </div>
                </div>

                <div className="pa-field-group">
                  <label htmlFor="pa-phone" className="pa-label">
                    Phone Number
                  </label>
                  <div className="pa-input-icon-wrap">
                    <Phone size={15} className="pa-input-icon" />
                    <input
                      id="pa-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pa-input with-icon"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="pa-field-group full-width">
                  <label htmlFor="pa-location" className="pa-label">
                    Location & Timezone
                  </label>
                  <div className="pa-input-icon-wrap">
                    <MapPin size={15} className="pa-input-icon" />
                    <input
                      id="pa-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pa-input with-icon"
                      placeholder="e.g. San Francisco, CA (PST)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Online Portfolios & Links */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Globe size={18} style={{ color: 'var(--md-primary)' }} />
                <span>Links & Portfolios</span>
              </h2>
              <p className="pa-panel-desc">
                Links included in CV exports and portfolio checks.
              </p>

              <div className="pa-form-grid">
                <div className="pa-field-group">
                  <label htmlFor="pa-portfolio" className="pa-label">
                    Personal Portfolio URL
                  </label>
                  <div className="pa-input-icon-wrap">
                    <Globe size={15} className="pa-input-icon" />
                    <input
                      id="pa-portfolio"
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="pa-input with-icon"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>

                <div className="pa-field-group">
                  <label htmlFor="pa-github" className="pa-label">
                    GitHub Profile
                  </label>
                  <div className="pa-input-icon-wrap">
                    <GithubIcon size={15} className="pa-input-icon" />
                    <input
                      id="pa-github"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="pa-input with-icon"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div className="pa-field-group full-width">
                  <label htmlFor="pa-linkedin" className="pa-label">
                    LinkedIn Profile
                  </label>
                  <div className="pa-input-icon-wrap">
                    <LinkedinIcon size={15} className="pa-input-icon" />
                    <input
                      id="pa-linkedin"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="pa-input with-icon"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: CAREER & PACING ────────────────────────────────────────── */}
        {activeTab === 'career' && (
          <div className="pa-tab-section">
            {/* Target Role & Roadmap Highway */}
            <div className="pa-panel-card">
              <div className="pa-card-header-flex">
                <div>
                  <h2 className="pa-panel-title">
                    <Compass size={18} style={{ color: 'var(--md-primary)' }} />
                    <span>Target Career Role</span>
                  </h2>
                  <p className="pa-panel-desc">
                    Active role shaping your roadmap stages and tasks.
                  </p>
                </div>
                <button
                  type="button"
                  className="pa-btn-accent"
                  onClick={onOpenRoleModal}
                  title="Choose new career roadmap"
                >
                  <Sparkles size={13} />
                  <span>Change Career Role</span>
                </button>
              </div>

              <div className="pa-role-preview-card">
                <div className="pa-role-icon-box">
                  <Compass size={24} className="text-emerald-500" />
                </div>
                <div className="pa-role-info">
                  <span className="pa-role-kicker">ACTIVE ROADMAP</span>
                  <div className="pa-role-name">{profile.target_role || 'Choose a career goal'}</div>
                  <span className="pa-role-meta">
                    {milestones.length} Strategic Milestones · {tasks.length} Action Tasks · ~
                    {Math.round(tasks.reduce((acc, t) => acc + (t.est_minutes || 60), 0) / 60)}h Total Depth
                  </span>
                </div>
                <div className="pa-role-badge">
                  <CheckCircle2 size={13} /> Enrolled
                </div>
              </div>
            </div>

            {/* Daily Deep Work Target */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Clock size={18} className="text-amber-500" />
                <span>Daily Deep Work Target</span>
              </h2>
              <p className="pa-panel-desc">
                Your committed daily execution rhythm. Used by the weekly scheduler to distribute tasks.
              </p>

              <div className="pa-preset-grid">
                {[30, 45, 60, 90, 120].map((mins) => {
                  const isSelected = dailyMinutes === mins;
                  const weeklyHours = ((mins * 7) / 60).toFixed(1);
                  return (
                    <button
                      key={mins}
                      type="button"
                      className={`pa-preset-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setDailyMinutes(mins)}
                    >
                      <span className="pa-preset-val">{mins} min</span>
                      <span className="pa-preset-lbl">/ day</span>
                      <span className="pa-preset-sub">~{weeklyHours} hrs/wk</span>
                      {isSelected && <div className="pa-preset-check"><Check size={11} /></div>}
                    </button>
                  );
                })}
              </div>

              <div className="pa-slider-box">
                <div className="pa-slider-labels">
                  <span>Custom: {dailyMinutes} minutes daily</span>
                  <span>{((dailyMinutes * 7) / 60).toFixed(1)} hours per week</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={180}
                  step={5}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="pa-range-slider"
                />
              </div>
            </div>

            {/* Career Experience Level & Learning Style */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Layers size={18} className="text-purple-500" />
                <span>Execution & Learning Style</span>
              </h2>
              <p className="pa-panel-desc">
                Adapts the ratio of hands-on build projects, drills, and conceptual specifications.
              </p>

              <div className="pa-learning-style-grid">
                {[
                  {
                    id: 'hands_on' as const,
                    title: 'Hands-on Builder (Recommended)',
                    desc: '40% Build Artifacts · 30% Drills · 20% Theory · 10% Checkpoints',
                    tag: 'Portfolio First',
                  },
                  {
                    id: 'balanced' as const,
                    title: 'Balanced Engineer',
                    desc: '30% Build · 30% Theory · 20% Drills · 20% Checkpoints',
                    tag: 'Holistic',
                  },
                  {
                    id: 'fast_track' as const,
                    title: 'Fast-Track Drillmaster',
                    desc: '50% Drills & Audits · 30% Build · 20% Theory',
                    tag: 'High Velocity',
                  },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={`pa-style-card ${learningStyle === style.id ? 'active' : ''}`}
                    onClick={() => setLearningStyle(style.id)}
                  >
                    <div className="pa-style-header">
                      <span className="pa-style-title">{style.title}</span>
                      <span className="pa-style-tag">{style.tag}</span>
                    </div>
                    <p className="pa-style-desc">{style.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pa-field-group" style={{ marginTop: '20px' }}>
                <label className="pa-label">Current Experience Baseline</label>
                <div className="pa-level-pill-group">
                  {[
                    { id: 'beginner' as const, label: 'Beginner (0 YOE)' },
                    { id: 'switcher' as const, label: 'Career Switcher' },
                    { id: 'junior' as const, label: 'Junior (1-2 YOE)' },
                    { id: 'mid' as const, label: 'Mid-Level (3+ YOE)' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`pa-level-pill ${experienceLevel === lvl.id ? 'active' : ''}`}
                      onClick={() => setExperienceLevel(lvl.id)}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
                <p className="pa-panel-desc">Your baseline shapes the starting point of a new roadmap. Existing roadmap progress stays intact.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: PLAN & AI QUOTA ────────────────────────────────────────── */}
        {activeTab === 'plan' && (
          <div className="pa-tab-section">
            {/* AI Prompts Meter */}
            <div className="pa-panel-card pa-quota-highlight">
              <div className="pa-quota-header">
                <div>
                    <span className="pa-quota-kicker">ROLLING 7-DAY AI QUOTAS</span>
                  <h2 className="pa-quota-title">
                    {totalAIQuota ? `${totalAIQuota.remaining} Requests Remaining` : 'Usage unavailable'}
                  </h2>
                  <p className="pa-quota-desc">
                    Limits are tracked separately for coach, resume, interview, and custom-role requests. Personal text is sent only when you request an AI action.
                  </p>
                </div>
                <div className="pa-quota-ring">
                  <span className="pa-quota-pct">
                    {totalAIQuota ? `${totalAIQuotaPercent}%` : '—'}
                  </span>
                    <span className="pa-quota-sub">Remaining</span>
                </div>
              </div>

              <div className="pa-quota-track">
                <div
                  className="pa-quota-fill"
                  style={{ width: `${totalAIQuotaPercent}%` }}
                />
              </div>
              {aiQuota && <div className="pa-quota-desc" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                {(['coach', 'cv', 'interview', 'role'] as const).map((feature) => (
                  <span key={feature} className="pa-subnav-btn">{feature === 'cv' ? 'Resume' : feature === 'role' ? 'Custom role' : feature}: {aiQuota[feature].remaining}/{aiQuota[feature].limit}</span>
                ))}
              </div>}
            </div>

            <div className="pa-panel-card" aria-labelledby="account-access-title">
              <div className="pa-card-header-flex">
                <div>
                  <h2 id="account-access-title" className="pa-panel-title">
                    <CreditCard size={18} />
                    <span>Account access</span>
                  </h2>
                  <p className="pa-panel-desc">
                    This account currently has {selectedPlan === 'premium' ? 'Pro' : 'Free'} access.
                    AI request limits are shown above and refresh on a rolling seven-day window.
                  </p>
                </div>
                <span className="pa-badge-counter">{selectedPlan === 'premium' ? 'PRO ACCESS' : 'FREE ACCESS'}</span>
              </div>
              <div
                role="status"
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '12px',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-secondary)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                }}
              >
                Billing is not connected in this version. Checkout, plan changes, and subscription management are unavailable.
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: CREDENTIALS & BADGES ───────────────────────────────────── */}
        {activeTab === 'badges' && (
          <div className="pa-tab-section">
            <div className="pa-panel-card">
              <div className="pa-card-header-flex">
                <div>
                  <h2 className="pa-panel-title">
                    <Award size={18} className="text-amber-500" />
                    <span>Career Accomplishments & Badges</span>
                  </h2>
                  <p className="pa-panel-desc">
                    Verified milestone completions, habit consistency, and engineering audits earned along your roadmap.
                  </p>
                </div>
                <span className="pa-badge-counter">
                  {badgesList.filter((b) => b.unlocked).length} / {badgesList.length} Unlocked
                </span>
              </div>

              <div className="pa-badges-grid">
                {badgesList.map((badge) => (
                  <div key={badge.id} className={`pa-badge-item ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="pa-badge-glyph-wrap">
                      <span className="pa-badge-glyph">{badge.icon}</span>
                      {badge.unlocked && (
                        <div className="pa-badge-check">
                          <Check size={10} />
                        </div>
                      )}
                    </div>
                    <div className="pa-badge-content">
                      <div className="pa-badge-name-row">
                        <span className="pa-badge-name">{badge.name}</span>
                        <span className={`pa-badge-status ${badge.unlocked ? 'active' : ''}`}>
                          {badge.unlocked ? 'Earned' : 'In Progress'}
                        </span>
                      </div>
                      <p className="pa-badge-desc">{badge.desc}</p>
                      <div className="pa-badge-meta-row">
                        <div className="pa-badge-track">
                          <div
                            className={`pa-badge-fill ${badge.unlocked ? 'gold' : 'blue'}`}
                            style={{ width: badge.progress }}
                          />
                        </div>
                        <span className="pa-badge-date">{badge.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: SECURITY, SYSTEM & DATA ────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="pa-tab-section">
            {/* Security Credentials */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Shield size={18} style={{ color: 'var(--md-primary)' }} />
                <span>Security & Authentication</span>
              </h2>
              <p className="pa-panel-desc">
                Manage authenticator verification and active sessions.
              </p>

              <div className="pa-toggle-list">
                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Two-Factor Authentication (2FA)</span>
                    <span className="pa-toggle-desc">Use a time-based code from an authenticator app when you sign in.</span>
                  </div>
                  <span className="pa-session-active-tag">{twoFactor ? 'Enabled' : 'Not enabled'}</span>
                </div>

                {profile.is_demo ? (
                  <p className="pa-panel-desc">Authenticator setup is available for signed-in accounts, not demo mode.</p>
                ) : twoFactor ? (
                  <div style={{ padding: '12px 0' }}>
                    {verifiedMfaFactors.map((factor) => (
                      <div key={factor.id} className="pa-toggle-item">
                        <div className="pa-toggle-info">
                          <span className="pa-toggle-title">{factor.friendly_name || 'Authenticator app'}</span>
                          <span className="pa-toggle-desc">Verified authenticator</span>
                        </div>
                        {confirmDisableFactorId === factor.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button type="button" className="btn-m3-secondary" disabled={mfaBusy} onClick={() => setConfirmDisableFactorId(null)}>Keep</button>
                            <button type="button" className="btn-m3-primary" disabled={mfaBusy} onClick={() => void disableMfaFactor(factor.id)}>{mfaBusy ? 'Removing…' : 'Remove'}</button>
                          </div>
                        ) : (
                          <button type="button" className="btn-m3-secondary" disabled={mfaBusy} onClick={() => setConfirmDisableFactorId(factor.id)}>Remove</button>
                        )}
                      </div>
                    ))}
                    <p className="pa-panel-desc">For sign-in recovery, add another authenticator on a separate device and give it a distinct name.</p>
                    <label htmlFor="mfa-new-name" className="pa-toggle-title">New authenticator name</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <input id="mfa-new-name" value={mfaFriendlyName} maxLength={40} onChange={(event) => setMfaFriendlyName(event.target.value)} style={{ flex: '1 1 220px', minWidth: 0, padding: 10, borderRadius: 8, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }} />
                      <button type="button" className="btn-m3-secondary" disabled={mfaBusy} onClick={() => void beginMfaEnrollment()}>Add authenticator</button>
                    </div>
                  </div>
                ) : pendingMfaFactors.length > 0 ? (
                  <div style={{ padding: '12px 0' }}>
                    <p className="pa-panel-desc">An unfinished authenticator setup was found. Remove it before starting a fresh setup.</p>
                    {pendingMfaFactors.map((factor) => (
                      <div key={factor.id} className="pa-toggle-item">
                        <span className="pa-toggle-title">{factor.friendly_name || 'Incomplete authenticator'}</span>
                        <button type="button" className="btn-m3-secondary" disabled={mfaBusy} onClick={() => void removePendingMfaFactor(factor.id)}>{mfaBusy ? 'Removing…' : 'Remove setup'}</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px 0' }}>
                    <label htmlFor="mfa-first-name" className="pa-toggle-title">Authenticator name</label>
                    <input id="mfa-first-name" value={mfaFriendlyName} maxLength={40} onChange={(event) => setMfaFriendlyName(event.target.value)} style={{ display: 'block', width: '100%', maxWidth: 340, boxSizing: 'border-box', margin: '8px 0 12px', padding: 10, borderRadius: 8, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }} />
                    <button type="button" className="btn-m3-primary" disabled={!mfaSupported || mfaBusy} onClick={() => void beginMfaEnrollment()}>
                      {mfaBusy ? 'Starting setup…' : 'Set up authenticator'}
                    </button>
                  </div>
                )}

                {mfaSetup && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 200px) 1fr', gap: 20, alignItems: 'center', padding: '20px 0' }}>
                    <img src={mfaSetup.qrCode} alt="Scan this QR code with your authenticator app" style={{ width: '100%', maxWidth: 200, background: 'white', borderRadius: 12, padding: 8, boxSizing: 'border-box' }} />
                    <div>
                      <p className="pa-panel-desc">Scan the QR code, then enter the six-digit code generated by your app.</p>
                      <label htmlFor="mfa-enrollment-secret" className="pa-toggle-title">Setup key</label>
                      <input id="mfa-enrollment-secret" readOnly value={mfaSetup.secret} style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: '6px 0 14px', padding: 10, borderRadius: 8, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }} />
                      <label htmlFor="mfa-enrollment-code" className="pa-toggle-title">Authenticator code</label>
                      <input id="mfa-enrollment-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: '6px 0 12px', padding: 10, borderRadius: 8, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)', color: 'var(--md-text-primary)' }} />
                      <button type="button" className="btn-m3-primary" disabled={mfaBusy || mfaCode.length !== 6} onClick={() => void verifyMfaEnrollment()}>{mfaBusy ? 'Verifying…' : 'Verify and enable'}</button>
                      <button type="button" className="btn-m3-secondary" disabled={mfaBusy} onClick={() => void cancelMfaEnrollment()}>Cancel</button>
                    </div>
                  </div>
                )}
                {mfaError && <p role="alert" style={{ color: 'var(--md-error, #b3261e)' }}>{mfaError}</p>}

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Active Browser Session</span>
                    <span className="pa-toggle-desc">This signed-in session is active on the current device.</span>
                  </div>
                  <span className="pa-session-active-tag">Active</span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Bell size={18} style={{ color: 'var(--md-primary)' }} />
                <span>Notification Preferences</span>
              </h2>
              <p className="pa-panel-desc">
                Manage task reminders, milestone alerts, and check-ins.
              </p>

              <div className="pa-toggle-list">
                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Daily task reminder</span>
                    <span className="pa-toggle-desc">Record reminders for due tasks and send background push when enabled.</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${dailyReminder ? 'on' : 'off'}`}
                    onClick={() => setDailyReminder(!dailyReminder)}
                    aria-label="Toggle daily task reminders"
                    aria-pressed={dailyReminder}
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Milestone completion alerts</span>
                    <span className="pa-toggle-desc">Notify when all tasks in a milestone finish.</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${milestoneAlerts ? 'on' : 'off'}`}
                    onClick={() => setMilestoneAlerts(!milestoneAlerts)}
                    aria-label="Toggle milestone completion alerts"
                    aria-pressed={milestoneAlerts}
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Weekly check-in reminders</span>
                    <span className="pa-toggle-desc">Allow on-demand progress check-ins from your roadmap.</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${weeklyDigest ? 'on' : 'off'}`}
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    aria-label="Allow on-demand weekly check-ins"
                    aria-pressed={weeklyDigest}
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>
              </div>
            </div>

            {/* System Theme & Density */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <SettingsIcon size={18} style={{ color: 'var(--md-primary)' }} />
                <span>Appearance</span>
              </h2>
              <p className="pa-panel-desc">Switch between dark and light themes.</p>

              <div className="pa-theme-selector-row">
                <button
                  type="button"
                  className={`pa-theme-card ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    if (theme !== 'dark') onToggleTheme();
                  }}
                >
                  <Moon size={20} style={{ color: 'var(--md-text-secondary)' }} />
                  <span className="pa-theme-name">Dark Mode</span>
                  <span className="pa-theme-desc">Low-glare dark workspace</span>
                </button>

                <button
                  type="button"
                  className={`pa-theme-card ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => {
                    if (theme !== 'light') onToggleTheme();
                  }}
                >
                  <Sun size={20} style={{ color: 'var(--md-primary)' }} />
                  <span className="pa-theme-name">Light Mode</span>
                  <span className="pa-theme-desc">Clean light workspace</span>
                </button>
              </div>
            </div>

            {/* Data Management & Danger Zone */}
            <div className="pa-panel-card pa-danger-card">
              <h2 className="pa-panel-title danger">
                <AlertCircle size={18} className="text-rose-500" />
                <span>Data Management & Danger Zone</span>
              </h2>
              <p className="pa-panel-desc">
                Download a copy of your saved account data or permanently delete your account.
              </p>

              {exportError && <p role="alert" style={{ color: '#B91C1C', fontSize: 12 }}>{exportError}</p>}

              <div className="pa-danger-actions-row">
                <button
                  type="button"
                  className="pa-btn-export"
                  onClick={() => void handleExportData()}
                  disabled={isExporting}
                  title="Download account data JSON"
                >
                  <Download size={14} />
                  <span>{isExporting ? 'Preparing export…' : 'Export Account Data (JSON)'}</span>
                </button>

                <button
                  type="button"
                  className="pa-btn-signout"
                  onClick={onSignOut}
                  title="Sign out of Career Pilot"
                >
                  <Lock size={14} />
                  <span>Sign Out of Account</span>
                </button>
                {!profile.is_demo && (
                  <button
                    type="button"
                    className="pa-btn-delete"
                    onClick={() => { setDeleteError(''); setDeleteConfirmationText(''); setIsDeleteConfirmOpen(true); }}
                  >
                    <AlertCircle size={14} />
                    <span>Delete Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {isDeleteConfirmOpen && (
        <div
          role="presentation"
          onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1800, background: 'rgba(15,23,42,.72)', display: 'grid', placeItems: 'center', padding: 20 }}
        >
          <form
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            tabIndex={-1}
            onSubmit={(event) => { event.preventDefault(); if (deleteConfirmationText === 'DELETE') void handleDeleteAccount(); }}
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(100%, 440px)', background: 'var(--md-surface)', color: 'var(--md-text-primary)', borderRadius: 20, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,.35)' }}
          >
            <h2 id="delete-account-title" style={{ margin: '0 0 8px', fontSize: 20 }}>Delete your account?</h2>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--md-text-secondary)' }}>
              This permanently deletes your profile, roadmap, saved CVs, interview and quiz history, skills, messages, and notifications. This cannot be undone.
            </p>
            {deleteError && <p role="alert" style={{ color: '#B91C1C', fontSize: 12 }}>{deleteError}</p>}
            <label htmlFor="delete-account-confirmation" style={{ display: 'block', fontSize: 12, fontWeight: 700, margin: '16px 0 6px' }}>
              Type DELETE to confirm
            </label>
            <input
              id="delete-account-confirmation"
              data-dialog-initial-focus
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              autoComplete="off"
              disabled={isDeleting}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--md-outline)', borderRadius: 10, padding: 10, background: 'var(--md-surface-variant)', color: 'var(--md-text-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" disabled={isDeleting} onClick={() => setIsDeleteConfirmOpen(false)} className="pa-btn-export">Cancel</button>
              <button type="submit" disabled={isDeleting || deleteConfirmationText !== 'DELETE'} className="pa-btn-delete">
                {isDeleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          5. EMBEDDED STYLES FOR PROFILE & ACCOUNT VIEW
      ────────────────────────────────────────────────────────────────────────── */}
      <style>{paStyles}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS STYLING
// ─────────────────────────────────────────────────────────────────────────────
const paStyles = `
/* Profile & Account View Base Container */
.pa-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 18px 24px 64px 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  font-family: inherit;
  color: var(--md-text-primary, #0F172A);
  animation: fadeIn 0.25s ease-out;
}

/* 1. Top Bar */
.pa-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pa-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.pa-btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-container-high, #f1f5f9);
  border: 1px solid var(--outline-variant, #e2e8f0);
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-btn-back:hover {
  color: var(--md-text-primary, #0f172a);
  background: var(--surface-container-highest, #e2e8f0);
}

.pa-breadcrumb-sep {
  color: var(--outline-variant, #94a3b8);
}

.pa-breadcrumb-current {
  color: var(--md-text-primary, #0f172a);
  font-weight: 700;
}

.pa-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pa-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-container-high, #f1f5f9);
  border: 1px solid var(--outline-variant, #e2e8f0);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-btn-secondary:hover {
  background: var(--surface-container-highest, #e2e8f0);
  color: var(--md-text-primary, #0f172a);
}

.pa-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--md-primary, #123C69);
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
  background: var(--surface-container-high, #f1f5f9);
  color: var(--md-text-secondary, #64748B);
  border-color: var(--outline-variant, #e2e8f0);
  box-shadow: none;
}

.pa-btn-primary.pulse-save {
  background: var(--md-primary, #123C69);
}

/* 2. Hero Profile Card */
.pa-hero-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 18px;
  padding: 24px;
}

[data-theme='dark'] .pa-hero-card {
  background: var(--md-surface, #111827);
  border-color: var(--md-outline, #1F2937);
}

.pa-hero-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
}

@media (max-width: 900px) {
  .pa-hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.pa-avatar-wrap {
  display: flex;
  justify-content: center;
}

.pa-avatar-frame {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 20px;
  padding: 3px;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.2));
  border: 1px solid var(--md-primary, #123C69);
}

.pa-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.pa-avatar-edit-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1E293B;
  border: 2px solid #FFFFFF;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.15s ease;
}

.pa-avatar-edit-badge:hover {
  transform: scale(1.06);
  background: var(--md-primary, #123C69);
}

.pa-identity-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 900px) {
  .pa-identity-details {
    align-items: center;
  }
}

.pa-identity-kicker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pa-handle-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  background: var(--surface-container-high, #f1f5f9);
  padding: 2px 8px;
  border-radius: 6px;
}

[data-theme='dark'] .pa-handle-pill {
  background: #1F2937;
  color: #94A3B8;
}

.pa-verified-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  color: var(--md-on-primary-container, #3E521C);
  padding: 2px 8px;
  border-radius: 9999px;
}

.pa-plan-kicker-pill {
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  padding: 2px 8px;
  border-radius: 9999px;
}

.pa-user-heading {
  font-size: 1.625rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-user-heading {
  color: #F8FAFC;
}

.pa-user-bio {
  font-size: 0.875rem;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.45;
  margin: 0;
  max-width: 600px;
}

[data-theme='dark'] .pa-user-bio {
  color: #94A3B8;
}

.pa-meta-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.pa-meta-role-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  color: var(--md-on-primary-container, #3E521C);
  border: 1px solid rgba(18, 60, 105, 0.3);
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-meta-role-btn:hover {
  background: rgba(18, 60, 105, 0.24);
}

.pa-meta-text-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--md-text-secondary, #64748B);
}

/* Hero Stats Panel */
.pa-hero-stats-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  min-width: 280px;
}

@media (max-width: 900px) {
  .pa-hero-stats-panel {
    width: 100%;
    grid-template-columns: repeat(2, 1fr);
  }
}

.pa-stat-box {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

[data-theme='dark'] .pa-stat-box {
  background: #1E293B;
  border-color: #334155;
}

.pa-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  color: var(--md-primary, #123C69);
}

.pa-stat-content {
  display: flex;
  flex-direction: column;
}

.pa-stat-val {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-stat-val {
  color: #F8FAFC;
}

.pa-stat-lbl {
  font-size: 0.6875rem;
  color: var(--md-text-secondary, #64748B);
  font-weight: 500;
}

/* Avatar Drawer */
.pa-avatar-drawer {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--outline-variant, #E2E8F0);
  animation: fadeIn 0.2s ease-out;
}

[data-theme='dark'] .pa-avatar-drawer {
  border-top-color: #1F2937;
}

.pa-avatar-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pa-drawer-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-drawer-title {
  color: #F8FAFC;
}

.pa-btn-close-drawer {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-primary, #123C69);
  background: none;
  border: none;
  cursor: pointer;
}

/* 3. Sub-Navigation Bar */
.pa-subnav-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-container, #FFFFFF);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 14px;
  padding: 6px;
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

[data-theme='dark'] .pa-subnav-bar {
  background: #111827;
  border-color: #1F2937;
}

.pa-subnav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.pa-subnav-btn:hover {
  color: var(--md-text-primary, #0f172a);
  background: var(--surface-container-high, #f8fafc);
}

[data-theme='dark'] .pa-subnav-btn:hover {
  background: #1E293B;
  color: #F8FAFC;
}

.pa-subnav-btn.active {
  background: var(--md-primary, #123C69);
  color: #FFFFFF;
  font-weight: 700;
}

/* 4. Tab Section Layout */
.pa-tab-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pa-panel-card {
  background: var(--md-surface, #FFFFFF);
  border: 1px solid var(--md-outline, #E2E8F0);
  border-radius: 16px;
  padding: 22px 24px;
}

[data-theme='dark'] .pa-panel-card {
  background: var(--md-surface, #111827);
  border-color: var(--md-outline, #1F2937);
}

.pa-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.0625rem;
  font-weight: 800;
  margin: 0 0 4px 0;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-panel-title {
  color: #F8FAFC;
}

.pa-panel-title.danger {
  color: #EF4444;
}

.pa-panel-desc {
  font-size: 0.8125rem;
  color: var(--md-text-secondary, #64748B);
  margin: 0 0 20px 0;
  line-height: 1.45;
}

[data-theme='dark'] .pa-panel-desc {
  color: #94A3B8;
}

.pa-card-header-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.pa-card-header-flex .pa-panel-desc {
  margin-bottom: 0;
}

.pa-btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--md-primary, #123C69);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.pa-btn-accent:hover {
  opacity: 0.92;
}

/* Forms */
.pa-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .pa-form-grid {
    grid-template-columns: 1fr;
  }
}

.pa-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pa-field-group.full-width {
  grid-column: 1 / -1;
}

.pa-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-text-secondary, #475569);
  letter-spacing: 0.01em;
}

[data-theme='dark'] .pa-label {
  color: #CBD5E1;
}

.pa-input,
.pa-textarea {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--md-text-primary, #0f172a);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

[data-theme='dark'] .pa-input,
[data-theme='dark'] .pa-textarea {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}

.pa-input:focus,
.pa-textarea:focus {
  outline: none;
  border-color: var(--md-primary, #123C69);
  box-shadow: 0 0 0 3px rgba(18, 60, 105, 0.18);
}

.pa-input-prefix-wrap,
.pa-input-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pa-input-prefix {
  position: absolute;
  left: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
}

.pa-input.with-prefix {
  padding-left: 28px;
  width: 100%;
}

.pa-input-icon {
  position: absolute;
  left: 12px;
  color: var(--md-text-secondary, #64748B);
}

.pa-input.with-icon {
  padding-left: 36px;
  width: 100%;
}

.pa-input.readonly {
  background: var(--surface-container-highest, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  cursor: default;
}

[data-theme='dark'] .pa-input.readonly {
  background: #0F172A;
  color: #94A3B8;
}

.pa-verified-badge {
  position: absolute;
  right: 10px;
  font-size: 0.6875rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  padding: 2px 7px;
  border-radius: 9999px;
}

/* Role Preview Card */
.pa-role-preview-card {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

[data-theme='dark'] .pa-role-preview-card {
  background: #1E293B;
  border-color: #334155;
}

.pa-role-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pa-role-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.pa-role-kicker {
  font-size: 0.625rem;
  font-weight: 800;
  color: #10B981;
  letter-spacing: 0.04em;
}

.pa-role-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-role-name {
  color: #F8FAFC;
}

.pa-role-meta {
  font-size: 0.75rem;
  color: var(--md-text-secondary, #64748B);
}

.pa-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}

/* Preset Grid for Daily Minutes */
.pa-preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .pa-preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pa-preset-card {
  position: relative;
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 12px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

[data-theme='dark'] .pa-preset-card {
  background: #1E293B;
  border-color: #334155;
}

.pa-preset-card:hover {
  border-color: var(--md-primary, #123C69);
}

.pa-preset-card.selected {
  background: var(--md-primary-container, rgba(18, 60, 105, 0.12));
  border-color: var(--md-primary, #123C69);
  box-shadow: 0 0 0 1px var(--md-primary, #123C69);
}

[data-theme='dark'] .pa-preset-card.selected {
  background: rgba(18, 60, 105, 0.18);
  border-color: var(--md-primary, #123C69);
}

.pa-preset-val {
  font-size: 1.0625rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-preset-val {
  color: #F8FAFC;
}

.pa-preset-lbl {
  font-size: 0.6875rem;
  color: var(--md-text-secondary, #64748B);
}

.pa-preset-sub {
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--md-primary, #123C69);
  margin-top: 4px;
}

.pa-preset-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--md-primary, #123C69);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pa-slider-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 12px;
}

[data-theme='dark'] .pa-slider-box {
  background: #1E293B;
  border-color: #334155;
}

.pa-slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
}

.pa-range-slider {
  width: 100%;
  accent-color: var(--md-primary, #123C69);
  cursor: pointer;
}

/* Learning Style Cards */
.pa-learning-style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .pa-learning-style-grid {
    grid-template-columns: 1fr;
  }
}

.pa-style-card {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 12px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

[data-theme='dark'] .pa-style-card {
  background: #1E293B;
  border-color: #334155;
}

.pa-style-card:hover {
  border-color: var(--md-primary, #123C69);
}

.pa-style-card.active {
  background: var(--md-primary-container, rgba(18, 60, 105, 0.12));
  border-color: var(--md-primary, #123C69);
  box-shadow: 0 0 0 1px var(--md-primary, #123C69);
}

[data-theme='dark'] .pa-style-card.active {
  background: rgba(18, 60, 105, 0.18);
  border-color: var(--md-primary, #123C69);
}

.pa-style-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.pa-style-title {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-style-title {
  color: #F8FAFC;
}

.pa-style-tag {
  font-size: 0.625rem;
  font-weight: 700;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  color: var(--md-on-primary-container, #3E521C);
  padding: 1px 6px;
  border-radius: 9999px;
}

.pa-style-desc {
  font-size: 0.6875rem;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.4;
  margin: 0;
}

.pa-level-pill-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pa-level-pill {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.15s ease;
}

[data-theme='dark'] .pa-level-pill {
  background: #1E293B;
  border-color: #334155;
}

.pa-level-pill:hover {
  color: var(--md-text-primary, #0f172a);
  border-color: var(--md-primary, #123C69);
}

.pa-level-pill.active {
  background: var(--md-primary, #123C69);
  color: #FFFFFF;
  border-color: var(--md-primary, #123C69);
}

/* Quota Meter */
.pa-quota-highlight {
  background: var(--md-surface-variant, #F8FAFC);
  border-color: var(--md-outline, #E2E8F0);
}

[data-theme='dark'] .pa-quota-highlight {
  background: var(--md-surface-variant, #1E293B);
  border-color: var(--md-outline, #334155);
}

.pa-quota-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.pa-quota-kicker {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--md-primary, #123C69);
  letter-spacing: 0.04em;
}

.pa-quota-title {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 4px 0 6px 0;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-quota-title {
  color: #F8FAFC;
}

.pa-quota-desc {
  font-size: 0.8125rem;
  color: var(--md-text-secondary, #64748B);
  margin: 0;
  max-width: 600px;
}

.pa-quota-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--md-surface, #FFFFFF);
  border: 3px solid var(--md-primary, #123C69);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-theme='dark'] .pa-quota-ring {
  background: #1E293B;
}

.pa-quota-pct {
  font-size: 0.9375rem;
  font-weight: 900;
  color: var(--md-primary, #123C69);
  line-height: 1;
}

.pa-quota-sub {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--md-text-secondary, #64748B);
  text-transform: uppercase;
}

.pa-quota-track {
  width: 100%;
  height: 8px;
  background: var(--outline-variant, #E2E8F0);
  border-radius: 9999px;
  overflow: hidden;
}

[data-theme='dark'] .pa-quota-track {
  background: #334155;
}

.pa-quota-fill {
  height: 100%;
  background: var(--md-primary, #123C69);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* Plan Comparison Grid */
.pa-plan-duo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 800px) {
  .pa-plan-duo-grid {
    grid-template-columns: 1fr;
  }
}

.pa-plan-card {
  position: relative;
  background: var(--surface-container, #FFFFFF);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 18px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 18px rgba(0,0,0,0.03);
}

[data-theme='dark'] .pa-plan-card {
  background: #111827;
  border-color: #1F2937;
}

.pa-plan-card.featured {
  border-color: var(--md-primary, #123C69);
}

[data-theme='dark'] .pa-plan-card.featured {
  background: var(--md-surface, #111827);
  border-color: var(--md-primary, #123C69);
}

.pa-popular-badge {
  position: absolute;
  top: -10px;
  left: 24px;
  background: var(--md-primary, #123C69);
  color: #FFFFFF;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 3px 10px;
  border-radius: 9999px;
}

.pa-plan-name {
  font-size: 1.125rem;
  font-weight: 900;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-plan-name {
  color: #F8FAFC;
}

.pa-plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 10px 0 6px 0;
}

.pa-plan-price .price-num {
  font-size: 2rem;
  font-weight: 900;
  color: var(--md-text-primary, #0f172a);
  line-height: 1;
}

[data-theme='dark'] .pa-plan-price .price-num {
  color: #F8FAFC;
}

.pa-plan-price .price-period {
  font-size: 0.8125rem;
  color: var(--md-text-secondary, #64748B);
}

.pa-plan-tagline {
  font-size: 0.8125rem;
  color: var(--md-text-secondary, #64748B);
  margin: 0 0 18px 0;
}

.pa-plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pa-plan-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-plan-features li {
  color: #E2E8F0;
}

.pa-plan-features li.dimmed {
  color: var(--md-text-secondary, #64748B);
  opacity: 0.6;
}

.pa-btn-plan {
  width: 100%;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  color: var(--md-text-primary, #0f172a);
  transition: all 0.15s ease;
}

[data-theme='dark'] .pa-btn-plan {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}

.pa-btn-plan.current {
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  border-color: var(--md-primary, #123C69);
  color: var(--md-on-primary-container, #3E521C);
  cursor: default;
}

.pa-btn-plan.primary {
  background: var(--md-primary, #123C69);
  border-color: var(--md-primary, #123C69);
  color: #FFFFFF;
}

.pa-btn-plan.primary:hover:not(.current) {
  opacity: 0.92;
}

/* Badges Grid */
.pa-badge-counter {
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--md-surface-variant, #F1F5F9);
  color: var(--md-text-secondary, #64748B);
  padding: 4px 10px;
  border-radius: 9999px;
}

.pa-badges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (max-width: 800px) {
  .pa-badges-grid {
    grid-template-columns: 1fr;
  }
}

.pa-badge-item {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  transition: transform 0.15s ease;
}

[data-theme='dark'] .pa-badge-item {
  background: #1E293B;
  border-color: #334155;
}

.pa-badge-item.unlocked {
  border-color: rgba(245, 158, 11, 0.3);
}

[data-theme='dark'] .pa-badge-item.unlocked {
  background: #192233;
  border-color: rgba(245, 158, 11, 0.35);
}

.pa-badge-glyph-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--surface-container, #FFFFFF);
  border: 1px solid var(--outline-variant, #E2E8F0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

[data-theme='dark'] .pa-badge-glyph-wrap {
  background: #0F172A;
  border-color: #334155;
}

.pa-badge-check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #10B981;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pa-badge-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.pa-badge-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pa-badge-name {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-badge-name {
  color: #F8FAFC;
}

.pa-badge-status {
  font-size: 0.625rem;
  font-weight: 800;
  color: var(--md-text-secondary, #64748B);
  background: var(--surface-container, #FFFFFF);
  padding: 1px 6px;
  border-radius: 9999px;
}

.pa-badge-status.active {
  color: #D97706;
  background: rgba(245, 158, 11, 0.15);
}

.pa-badge-desc {
  font-size: 0.75rem;
  color: var(--md-text-secondary, #64748B);
  line-height: 1.35;
  margin: 0;
}

.pa-badge-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.pa-badge-track {
  flex: 1;
  height: 5px;
  background: var(--outline-variant, #E2E8F0);
  border-radius: 9999px;
  overflow: hidden;
}

[data-theme='dark'] .pa-badge-track {
  background: #334155;
}

.pa-badge-fill {
  height: 100%;
  border-radius: 9999px;
}

.pa-badge-fill.gold { background: var(--md-primary, #123C69); }
.pa-badge-fill.blue { background: var(--md-text-secondary, #64748B); }

.pa-badge-date {
  font-size: 0.6875rem;
  color: var(--md-text-secondary, #64748B);
  white-space: nowrap;
}

/* Toggles in Security & System */
.pa-toggle-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pa-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 12px;
}

[data-theme='dark'] .pa-toggle-item {
  background: #1E293B;
  border-color: #334155;
}

.pa-toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pa-toggle-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-toggle-title {
  color: #F8FAFC;
}

.pa-toggle-desc {
  font-size: 0.75rem;
  color: var(--md-text-secondary, #64748B);
}

.pa-switch-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  padding: 2px;
}

.pa-switch-btn.off {
  background: #94A3B8;
}

.pa-switch-btn.on {
  background: var(--md-primary, #123C69);
}

.pa-switch-handle {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}

.pa-switch-btn.on .pa-switch-handle {
  transform: translateX(20px);
}

.pa-session-active-tag {
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--md-primary-container, rgba(18, 60, 105, 0.14));
  color: var(--md-on-primary-container, #3E521C);
  padding: 2px 8px;
  border-radius: 9999px;
}

/* Theme Selector Row */
.pa-theme-selector-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (max-width: 600px) {
  .pa-theme-selector-row {
    grid-template-columns: 1fr;
  }
}

.pa-theme-card {
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

[data-theme='dark'] .pa-theme-card {
  background: #1E293B;
  border-color: #334155;
}

.pa-theme-card:hover {
  border-color: var(--md-primary, #123C69);
}

.pa-theme-card.active {
  background: var(--md-primary-container, rgba(18, 60, 105, 0.12));
  border-color: var(--md-primary, #123C69);
  box-shadow: 0 0 0 1px var(--md-primary, #123C69);
}

[data-theme='dark'] .pa-theme-card.active {
  background: rgba(18, 60, 105, 0.18);
  border-color: var(--md-primary, #123C69);
}

.pa-theme-name {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--md-text-primary, #0f172a);
}

[data-theme='dark'] .pa-theme-name {
  color: #F8FAFC;
}

.pa-theme-desc {
  font-size: 0.75rem;
  color: var(--md-text-secondary, #64748B);
}

/* Danger Zone */
.pa-danger-card {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.02);
}

[data-theme='dark'] .pa-danger-card {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.04);
}

.pa-danger-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pa-btn-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-container-high, #F8FAFC);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--md-text-primary, #0f172a);
  cursor: pointer;
  transition: all 0.15s ease;
}

[data-theme='dark'] .pa-btn-export {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}

.pa-btn-export:hover {
  background: var(--surface-container-highest, #E2E8F0);
}

.pa-btn-signout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-btn-signout:hover {
  background: rgba(239, 68, 68, 0.2);
}

.pa-btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #DC2626;
  border: 1px solid #B91C1C;
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
}

.pa-btn-delete:disabled,
.pa-btn-export:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Keyframes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
`;
