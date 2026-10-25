import React, { useState } from 'react';
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
  theme: ThemeMode;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  onToggleTheme: () => void;
  onOpenRoleModal: () => void;
  onSignOut: () => void;
  onNavigateToTab: (tab: ActiveNavTab) => void;
  onToast: (msg: string) => void;
}

type ProfileTab = 'identity' | 'career' | 'plan' | 'badges' | 'security';

export const ProfileAccountView: React.FC<Props> = ({
  profile,
  milestones = [],
  tasks = [],
  theme,
  onUpdateProfile,
  onToggleTheme,
  onOpenRoleModal,
  onSignOut,
  onNavigateToTab,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');

  // Form state
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || 'alex.rivera');
  const [bio, setBio] = useState(
    profile.bio ||
      'Senior-focused product designer crafting systems, token architectures, and responsive digital experiences.'
  );
  const [email] = useState(profile.email || 'alex.rivera@careerpilot.io');
  const [phone, setPhone] = useState(profile.phone || '+1 (555) 019-2834');
  const [location, setLocation] = useState(profile.location || 'San Francisco, CA (PST)');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || 'https://alexrivera.design');
  const [githubUrl, setGithubUrl] = useState(profile.github_url || 'https://github.com/alexrivera-ux');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || 'https://linkedin.com/in/alexrivera-product');
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
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>(profile.plan || 'free');

  // Notifications & Security
  const [dailyReminder, setDailyReminder] = useState(profile.notification_daily_reminder ?? true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(profile.notification_milestone_alerts ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(profile.notification_weekly_digest ?? true);
  const [twoFactor, setTwoFactor] = useState(profile.two_factor_enabled ?? false);

  // UI State
  const [isSaving, setIsSaving] = useState(false);

  // Detect dirty state
  const isDirty =
    fullName !== (profile.full_name || '') ||
    username !== (profile.username || 'alex.rivera') ||
    bio !== (profile.bio || 'Senior-focused product designer crafting systems, token architectures, and responsive digital experiences.') ||
    phone !== (profile.phone || '+1 (555) 019-2834') ||
    location !== (profile.location || 'San Francisco, CA (PST)') ||
    portfolioUrl !== (profile.portfolio_url || 'https://alexrivera.design') ||
    githubUrl !== (profile.github_url || 'https://github.com/alexrivera-ux') ||
    linkedinUrl !== (profile.linkedin_url || 'https://linkedin.com/in/alexrivera-product') ||
    avatarUrl !== (profile.avatar_url || '/avatars/career_navigator.jpg') ||
    dailyMinutes !== (profile.daily_minutes || 60) ||
    experienceLevel !== (profile.experience_level || 'junior') ||
    learningStyle !== (profile.learning_style || 'hands_on') ||
    selectedPlan !== (profile.plan || 'free') ||
    dailyReminder !== (profile.notification_daily_reminder ?? true) ||
    milestoneAlerts !== (profile.notification_milestone_alerts ?? true) ||
    weeklyDigest !== (profile.notification_weekly_digest ?? true) ||
    twoFactor !== (profile.two_factor_enabled ?? false);

  // Save handler
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateProfile({
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
        plan: selectedPlan,
        ai_prompts_left:
          selectedPlan === 'premium'
            ? Math.max(100, profile.ai_prompts_left)
            : Math.min(20, profile.ai_prompts_left),
        notification_daily_reminder: dailyReminder,
        notification_milestone_alerts: milestoneAlerts,
        notification_weekly_digest: weeklyDigest,
        two_factor_enabled: twoFactor,
      });
      setIsSaving(false);
      onToast('✅ Account & Profile successfully updated!');
    }, 350);
  };

  // Revert handler
  const handleRevert = () => {
    setFullName(profile.full_name || '');
    setUsername(profile.username || 'alex.rivera');
    setBio(profile.bio || '');
    setPhone(profile.phone || '+1 (555) 019-2834');
    setLocation(profile.location || 'San Francisco, CA (PST)');
    setPortfolioUrl(profile.portfolio_url || '');
    setGithubUrl(profile.github_url || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setAvatarUrl(profile.avatar_url || '/avatars/career_navigator.jpg');
    setDailyMinutes(profile.daily_minutes || 60);
    setExperienceLevel(profile.experience_level || 'junior');
    setLearningStyle(profile.learning_style || 'hands_on');
    setSelectedPlan(profile.plan || 'free');
    setDailyReminder(profile.notification_daily_reminder ?? true);
    setMilestoneAlerts(profile.notification_milestone_alerts ?? true);
    setWeeklyDigest(profile.notification_weekly_digest ?? true);
    setTwoFactor(profile.two_factor_enabled ?? false);
    onToast('🔄 Unsaved changes reverted.');
  };

  // Export JSON handler
  const handleExportData = () => {
    const exportPayload = {
      profile,
      milestones,
      tasks,
      exported_at: new Date().toISOString(),
      platform: 'Career Pilot Telemetry System',
      version: '2.5.0',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `career_pilot_telemetry_${profile.target_role.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onToast('📥 Career telemetry and milestone progress exported!');
  };

  // Badges data
  const badgesList = [
    {
      id: 'highway-pioneer',
      name: 'Highway Pioneer',
      desc: 'Configured your custom career roadmap and initialized first sprint stoppage',
      icon: '🛣️',
      unlocked: true,
      date: 'Unlocked Oct 2026',
      progress: '100%',
    },
    {
      id: 'consistency-master',
      name: 'Consistency Master',
      desc: 'Maintained a 7-day continuous deep work momentum streak',
      icon: '🔥',
      unlocked: profile.streak_days >= 7,
      date: profile.streak_days >= 7 ? 'Unlocked Oct 2026' : `${profile.streak_days}/7 days logged`,
      progress: `${Math.min(100, Math.round((profile.streak_days / 7) * 100))}%`,
    },
    {
      id: 'cadence-overdrive',
      name: 'Cadence Overdrive',
      desc: 'Achieved an executive sprint velocity exceeding 1.1x target pace',
      icon: '⚡',
      unlocked: true,
      date: 'Unlocked Oct 2026',
      progress: '100%',
    },
    {
      id: 'checkpoint-ace',
      name: 'Checkpoint Ace',
      desc: 'Passed 10 engineering audit verification quizzes on first attempt',
      icon: '🎯',
      unlocked: false,
      date: '6 of 10 passed',
      progress: '60%',
    },
    {
      id: 'artifact-builder',
      name: 'Artifact Builder',
      desc: 'Shipped 3 production-grade portfolio project deliverables',
      icon: '🛠️',
      unlocked: false,
      date: '2 of 3 deliverables completed',
      progress: '66%',
    },
    {
      id: 'interview-arena-star',
      name: 'Interview Arena Star',
      desc: 'Successfully scored >85% in 5 simulated behavioral & technical rounds',
      icon: '🎙️',
      unlocked: false,
      date: '1 of 5 rounds completed',
      progress: '20%',
    },
  ];

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
              <span className="pa-plan-kicker-pill">{selectedPlan === 'premium' ? '⚡ Pro Accelerator' : 'Free Tier'}</span>
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
                <span>{profile.target_role || 'UI/UX Designer'}</span>
                <ChevronRight size={12} />
              </button>
              <span className="pa-meta-text-pill">
                <MapPin size={12} /> {location}
              </span>
              <span className="pa-meta-text-pill">
                <Clock size={12} /> Member since Oct 2026
              </span>
            </div>
          </div>

          {/* 4 Quick Telemetry Indicators */}
          <div className="pa-hero-stats-panel">
            <div className="pa-stat-box">
              <div className="pa-stat-icon amber">
                <Flame size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{profile.streak_days || 7} Days</span>
                <span className="pa-stat-lbl">Continuous Streak</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon emerald">
                <Zap size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">1.18x Cadence</span>
                <span className="pa-stat-lbl">Sprint Velocity</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon blue">
                <Bot size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{profile.ai_prompts_left || 16} calls</span>
                <span className="pa-stat-lbl">AI Quota Available</span>
              </div>
            </div>

            <div className="pa-stat-box">
              <div className="pa-stat-icon purple">
                <Clock size={15} />
              </div>
              <div className="pa-stat-content">
                <span className="pa-stat-val">{profile.target_timeline_months || 6} Months</span>
                <span className="pa-stat-lbl">Graduation Goal</span>
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
                <User size={18} className="text-blue-500" />
                <span>Personal Information</span>
              </h2>
              <p className="pa-panel-desc">
                Your public professional profile, contact credentials, and verified presence.
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
                <Globe size={18} className="text-emerald-500" />
                <span>Professional Links & Portfolios</span>
              </h2>
              <p className="pa-panel-desc">
                Connected accounts used for portfolio audits and CV builder exports.
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
                    <Compass size={18} className="text-blue-500" />
                    <span>Target Career Trajectory</span>
                  </h2>
                  <p className="pa-panel-desc">
                    The active career role dictating your winding highway stages and checkpoints.
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
                  <div className="pa-role-name">{profile.target_role || 'UI/UX Designer'}</div>
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
                  <span className="pa-quota-kicker">WEEKLY AI TELEMETRY QUOTA</span>
                  <h2 className="pa-quota-title">
                    {profile.ai_prompts_left || 16} Calls Remaining
                  </h2>
                  <p className="pa-quota-desc">
                    Refills every Monday at 00:00 UTC. Used for AI Career Coach, CV ATS scans, and Mock Interview evaluations.
                  </p>
                </div>
                <div className="pa-quota-ring">
                  <span className="pa-quota-pct">
                    {Math.round(((profile.ai_prompts_left || 16) / 20) * 100)}%
                  </span>
                  <span className="pa-quota-sub">Available</span>
                </div>
              </div>

              <div className="pa-quota-track">
                <div
                  className="pa-quota-fill"
                  style={{ width: `${Math.min(100, ((profile.ai_prompts_left || 16) / 20) * 100)}%` }}
                />
              </div>
            </div>

            {/* Plan Comparison Cards */}
            <div className="pa-plan-duo-grid">
              {/* Free Plan */}
              <div className={`pa-plan-card ${selectedPlan === 'free' ? 'active-plan' : ''}`}>
                <div className="pa-plan-header">
                  <span className="pa-plan-name">Free Tier</span>
                  <div className="pa-plan-price">
                    <span className="price-num">$0</span>
                    <span className="price-period">/ forever</span>
                  </div>
                  <p className="pa-plan-tagline">Essential tools to build self-paced career roadmaps.</p>
                </div>

                <ul className="pa-plan-features">
                  <li><Check size={14} className="text-emerald-500" /> Winding Highway dynamic roadmap</li>
                  <li><Check size={14} className="text-emerald-500" /> Weekly Schedule task planner</li>
                  <li><Check size={14} className="text-emerald-500" /> Pacing & Stats velocity telemetry</li>
                  <li><Check size={14} className="text-emerald-500" /> 20 AI prompts per week</li>
                  <li className="dimmed"><Check size={14} className="text-slate-500" /> Unlimited AI Coach & Interview Arena</li>
                  <li className="dimmed"><Check size={14} className="text-slate-500" /> Recruiter Skill-Gap Radar</li>
                </ul>

                <button
                  type="button"
                  className={`pa-btn-plan ${selectedPlan === 'free' ? 'current' : ''}`}
                  onClick={() => setSelectedPlan('free')}
                >
                  {selectedPlan === 'free' ? 'Current Active Plan' : 'Downgrade to Free'}
                </button>
              </div>

              {/* Pro Accelerator Plan */}
              <div className={`pa-plan-card featured ${selectedPlan === 'premium' ? 'active-plan' : ''}`}>
                <div className="pa-popular-badge">RECOMMENDED FOR CAREER SWITCHERS</div>
                <div className="pa-plan-header">
                  <span className="pa-plan-name">Pro Career Accelerator</span>
                  <div className="pa-plan-price">
                    <span className="price-num">$19</span>
                    <span className="price-period">/ month</span>
                  </div>
                  <p className="pa-plan-tagline">Full AI suite for accelerated job-readiness & recruiter matching.</p>
                </div>

                <ul className="pa-plan-features">
                  <li><Check size={14} className="text-emerald-500" /> <strong>Unlimited</strong> AI Career Coach prompts</li>
                  <li><Check size={14} className="text-emerald-500" /> Interactive Mock Interview Arena with audio analysis</li>
                  <li><Check size={14} className="text-emerald-500" /> CV Builder with AI ATS keyword optimization</li>
                  <li><Check size={14} className="text-emerald-500" /> Live Skill-Gap recruiter vacancy radar</li>
                  <li><Check size={14} className="text-emerald-500" /> Priority road rebalancing & checkpoint verifications</li>
                  <li><Check size={14} className="text-emerald-500" /> Direct JSON telemetry export & GitHub sync</li>
                </ul>

                <button
                  type="button"
                  className={`pa-btn-plan primary ${selectedPlan === 'premium' ? 'current' : ''}`}
                  onClick={() => {
                    setSelectedPlan('premium');
                    onToast('🎉 Switched to Pro Career Accelerator!');
                  }}
                >
                  {selectedPlan === 'premium' ? 'Current Active Plan' : 'Upgrade to Pro ($19/mo)'}
                </button>
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
                <Shield size={18} className="text-blue-500" />
                <span>Security & Authentication</span>
              </h2>
              <p className="pa-panel-desc">
                Authentication methods, two-factor verification, and active session telemetry.
              </p>

              <div className="pa-toggle-list">
                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Two-Factor Authentication (2FA)</span>
                    <span className="pa-toggle-desc">Require one-time email OTP or authenticator app code on login</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${twoFactor ? 'on' : 'off'}`}
                    onClick={() => {
                      setTwoFactor(!twoFactor);
                      onToast(twoFactor ? '2FA disabled' : '🔒 2FA successfully enabled!');
                    }}
                    aria-label="Toggle 2FA"
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Active Browser Session</span>
                    <span className="pa-toggle-desc">Chrome on Windows · 127.0.0.1 (Current session · Active now)</span>
                  </div>
                  <span className="pa-session-active-tag">Active</span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <Bell size={18} className="text-amber-500" />
                <span>Notification Preferences</span>
              </h2>
              <p className="pa-panel-desc">
                Tune the frequency of smart alerts, sprint focus reminders, and milestone digests.
              </p>

              <div className="pa-toggle-list">
                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Daily Deep Work Focus Reminder</span>
                    <span className="pa-toggle-desc">Receive a reminder at your scheduled sprint time (09:00 AM)</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${dailyReminder ? 'on' : 'off'}`}
                    onClick={() => setDailyReminder(!dailyReminder)}
                    aria-label="Toggle daily reminder"
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Milestone & Checkpoint Alerts</span>
                    <span className="pa-toggle-desc">Celebrate completions and receive automated rebalancing suggestions</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${milestoneAlerts ? 'on' : 'off'}`}
                    onClick={() => setMilestoneAlerts(!milestoneAlerts)}
                    aria-label="Toggle milestone alerts"
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>

                <div className="pa-toggle-item">
                  <div className="pa-toggle-info">
                    <span className="pa-toggle-title">Weekly Performance Telemetry Digest</span>
                    <span className="pa-toggle-desc">Sunday email summarizing velocity multiplier and predicted graduation date</span>
                  </div>
                  <button
                    type="button"
                    className={`pa-switch-btn ${weeklyDigest ? 'on' : 'off'}`}
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    aria-label="Toggle weekly digest"
                  >
                    <span className="pa-switch-handle" />
                  </button>
                </div>
              </div>
            </div>

            {/* System Theme & Density */}
            <div className="pa-panel-card">
              <h2 className="pa-panel-title">
                <SettingsIcon size={18} className="text-purple-500" />
                <span>System Appearance</span>
              </h2>
              <p className="pa-panel-desc">Choose between high-contrast Dark Mode and crisp Light Mode.</p>

              <div className="pa-theme-selector-row">
                <button
                  type="button"
                  className={`pa-theme-card ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    if (theme !== 'dark') onToggleTheme();
                  }}
                >
                  <Moon size={20} className="text-blue-400" />
                  <span className="pa-theme-name">Dark Mode</span>
                  <span className="pa-theme-desc">OLED contrast & neon accents</span>
                </button>

                <button
                  type="button"
                  className={`pa-theme-card ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => {
                    if (theme !== 'light') onToggleTheme();
                  }}
                >
                  <Sun size={20} className="text-amber-500" />
                  <span className="pa-theme-name">Light Mode</span>
                  <span className="pa-theme-desc">High readability Material 3</span>
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
                Export your full telemetry data or manage your session authentication.
              </p>

              <div className="pa-danger-actions-row">
                <button
                  type="button"
                  className="pa-btn-export"
                  onClick={handleExportData}
                  title="Download telemetry JSON"
                >
                  <Download size={14} />
                  <span>Export Career Telemetry (JSON)</span>
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
              </div>
            </div>
          </div>
        )}
      </main>

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
  background: #2563EB;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
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
  background: #10B981;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  animation: pulseGlow 1.8s infinite;
}

/* 2. Hero Profile Card */
.pa-hero-card {
  background: var(--surface-container, #FFFFFF);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

[data-theme='dark'] .pa-hero-card {
  background: #111827;
  border-color: #1F2937;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
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
  width: 92px;
  height: 92px;
  border-radius: 24px;
  padding: 4px;
  background: linear-gradient(135deg, #38BDF8, #2563EB);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
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
  transform: scale(1.1);
  background: #2563EB;
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
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
  padding: 2px 8px;
  border-radius: 9999px;
}

.pa-plan-kicker-pill {
  font-size: 0.6875rem;
  font-weight: 800;
  background: rgba(37, 99, 235, 0.12);
  color: #2563EB;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 9999px;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pa-meta-role-btn:hover {
  background: rgba(16, 185, 129, 0.2);
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
}

.pa-stat-icon.amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
.pa-stat-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.pa-stat-icon.blue { background: rgba(37, 99, 235, 0.15); color: #2563EB; }
.pa-stat-icon.purple { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }

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
  color: #2563EB;
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
  background: #2563EB;
  color: #FFFFFF;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

/* 4. Tab Section Layout */
.pa-tab-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pa-panel-card {
  background: var(--surface-container, #FFFFFF);
  border: 1px solid var(--outline-variant, #E2E8F0);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.03);
}

[data-theme='dark'] .pa-panel-card {
  background: #111827;
  border-color: #1F2937;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
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
  background: linear-gradient(135deg, #10B981, #059669);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.pa-btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
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
  border-color: #2563EB;
}

.pa-preset-card.selected {
  background: rgba(37, 99, 235, 0.08);
  border-color: #2563EB;
  box-shadow: 0 0 0 1px #2563EB;
}

[data-theme='dark'] .pa-preset-card.selected {
  background: rgba(37, 99, 235, 0.2);
  border-color: #38BDF8;
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
  color: #2563EB;
  margin-top: 4px;
}

.pa-preset-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2563EB;
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
  accent-color: #2563EB;
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
  border-color: #2563EB;
}

.pa-style-card.active {
  background: rgba(37, 99, 235, 0.08);
  border-color: #2563EB;
  box-shadow: 0 0 0 1px #2563EB;
}

[data-theme='dark'] .pa-style-card.active {
  background: rgba(37, 99, 235, 0.2);
  border-color: #38BDF8;
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
  font-weight: 800;
  background: rgba(37, 99, 235, 0.15);
  color: #2563EB;
  padding: 1px 6px;
  border-radius: 9999px;
  text-transform: uppercase;
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
  border-color: #2563EB;
}

.pa-level-pill.active {
  background: #2563EB;
  color: #FFFFFF;
  border-color: #2563EB;
}

/* Quota Meter */
.pa-quota-highlight {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(56, 189, 248, 0.04));
  border-color: rgba(37, 99, 235, 0.25);
}

[data-theme='dark'] .pa-quota-highlight {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(15, 23, 42, 0.9));
  border-color: rgba(56, 189, 248, 0.3);
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
  font-weight: 800;
  color: #2563EB;
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
  background: var(--surface-container, #FFFFFF);
  border: 3px solid #2563EB;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
}

[data-theme='dark'] .pa-quota-ring {
  background: #1E293B;
}

.pa-quota-pct {
  font-size: 0.9375rem;
  font-weight: 900;
  color: #2563EB;
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
  background: linear-gradient(90deg, #38BDF8, #2563EB);
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
  border-color: #2563EB;
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.12);
}

[data-theme='dark'] .pa-plan-card.featured {
  background: #151E33;
  border-color: #3B82F6;
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.25);
}

.pa-popular-badge {
  position: absolute;
  top: -10px;
  left: 24px;
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  color: #FFFFFF;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 3px 10px;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
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
  background: rgba(16, 185, 129, 0.12);
  border-color: #10B981;
  color: #059669;
  cursor: default;
}

.pa-btn-plan.primary {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.pa-btn-plan.primary:hover:not(.current) {
  background: #1D4ED8;
}

/* Badges Grid */
.pa-badge-counter {
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(245, 158, 11, 0.15);
  color: #D97706;
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

.pa-badge-fill.gold { background: linear-gradient(90deg, #F59E0B, #D97706); }
.pa-badge-fill.blue { background: linear-gradient(90deg, #38BDF8, #2563EB); }

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
  background: #10B981;
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
  font-weight: 800;
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
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
  border-color: #2563EB;
}

.pa-theme-card.active {
  background: rgba(37, 99, 235, 0.08);
  border-color: #2563EB;
  box-shadow: 0 0 0 1px #2563EB;
}

[data-theme='dark'] .pa-theme-card.active {
  background: rgba(37, 99, 235, 0.2);
  border-color: #38BDF8;
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
