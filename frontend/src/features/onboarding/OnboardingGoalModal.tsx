import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  AlertTriangle,
  Sparkles,
  Search,
  Code2,
  Cloud,
  Database,
  Monitor,
  Shield,
  Smartphone,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
  Compass,
  X,
} from 'lucide-react';
import { notificationService } from '../notifications/notificationService';
import {
  comprehensiveCareerCatalog,
  careerCategories,
  createCustomCareerBlueprint,
  getOrCreateCareerBlueprint,
} from '../roadmap/careerCatalog';
import type { CareerOption, CareerCategory, RolePlanOutline } from '../roadmap/careerCatalog';
import { isRolePlanOutline, requestAI, type AIQuotaSummary } from '../ai/aiGateway';
import type { Profile } from '../../types';
import { addMonthsToDateOnly, daysBetweenDateOnly, getLocalDateOnly } from '../../lib/dateOnly';

interface Props {
  profile: Profile;
  aiQuota?: AIQuotaSummary | null;
  onAIUsageChanged?: () => Promise<void> | void;
  onComplete: (updatedProfile: Profile, roleOutline?: RolePlanOutline) => Promise<void> | void;
}

const PRESET_TIMELINES = [
  { label: '3 Mo', months: 3, fullLabel: '3 Months (Fast Track)' },
  { label: '6 Mo', months: 6, fullLabel: '6 Months (Recommended Standard)' },
  { label: '9 Mo', months: 9, fullLabel: '9 Months (Steady Pace)' },
  { label: '12 Mo', months: 12, fullLabel: '12 Months (1 Year Comprehensive)' },
  { label: '18+ Mo', months: 18, fullLabel: '18 Months (Extended Mastery)' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner' as const, label: 'Beginner', detail: 'Starting from foundations' },
  { id: 'switcher' as const, label: 'Career switcher', detail: 'From another field' },
  { id: 'junior' as const, label: 'Junior', detail: 'Some hands-on work' },
  { id: 'mid' as const, label: 'Mid-level', detail: 'Deeper specialization' },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All (200+)' },
  { id: 'Software & Web', label: 'Software & Web' },
  { id: 'AI & Data Science', label: 'AI & Data' },
  { id: 'Cloud & DevOps', label: 'Cloud & DevOps' },
  { id: 'Cybersecurity', label: 'Cybersecurity' },
  { id: 'Mobile & Multiplatform', label: 'Mobile App' },
  { id: 'Game Dev & 3D', label: 'Game Dev' },
];

function calculateTargetDate(months: number): string {
  return addMonthsToDateOnly(getLocalDateOnly(), months);
}

function getCategoryIcon(role: CareerOption, isSelected: boolean) {
  const title = role.title.toLowerCase();
  const category = role.category.toLowerCase();
  const color = isSelected ? '#FFFFFF' : '#475569';

  if (title.includes('serverless') || title.includes('cloud') || category.includes('cloud')) {
    return <Cloud size={15} strokeWidth={2} color={color} />;
  }
  if (title.includes('backend') || title.includes('database')) {
    return <Database size={15} strokeWidth={2} color={color} />;
  }
  if (title.includes('frontend') || title.includes('web') || category.includes('web')) {
    return <Monitor size={15} strokeWidth={2} color={color} />;
  }
  if (category.includes('ai') || category.includes('data')) {
    return <Sparkles size={15} strokeWidth={2} color={color} />;
  }
  if (category.includes('cyber') || category.includes('security')) {
    return <Shield size={15} strokeWidth={2} color={color} />;
  }
  if (category.includes('mobile')) {
    return <Smartphone size={15} strokeWidth={2} color={color} />;
  }
  if (category.includes('game')) {
    return <Gamepad2 size={15} strokeWidth={2} color={color} />;
  }
  return <Code2 size={15} strokeWidth={2} color={color} />;
}

export const OnboardingGoalModal: React.FC<Props> = ({ profile, aiQuota, onAIUsageChanged, onComplete }) => {
  const [today] = useState(() => getLocalDateOnly());
  const [selectedSlug, setSelectedSlug] = useState(
    profile.target_role
      ? profile.target_role.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'serverless-application-engineer'
  );
  const [dailyMinutes, setDailyMinutes] = useState(profile.daily_minutes || 60);
  const [experienceLevel, setExperienceLevel] = useState<NonNullable<Profile['experience_level']>>(
    profile.experience_level || 'beginner'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [customRoleCategory, setCustomRoleCategory] = useState<CareerCategory>(
    profile.target_role_category || 'Software & Web'
  );
  const [roleOutline, setRoleOutline] = useState<RolePlanOutline | null>(null);
  const [isDraftingRole, setIsDraftingRole] = useState(false);
  const [roleDraftError, setRoleDraftError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [selectedTimelinePreset, setSelectedTimelinePreset] = useState<number | 'custom'>(() => {
    if (profile.target_timeline_months && [3, 6, 9, 12, 18].includes(profile.target_timeline_months)) {
      return profile.target_timeline_months;
    }
    return 6;
  });

  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    if (profile.target_completion_date) {
      return profile.target_completion_date;
    }
    const initialMonths =
      profile.target_timeline_months && [3, 6, 9, 12, 18].includes(profile.target_timeline_months)
        ? profile.target_timeline_months
        : 6;
    return calculateTargetDate(initialMonths);
  });

  const handleSelectPreset = (months: number) => {
    setSelectedTimelinePreset(months);
    setTargetDateStr(calculateTargetDate(months));
  };

  const handleCustomDateChange = (newDate: string) => {
    if (!newDate) return;
    setTargetDateStr(newDate);
    setSelectedTimelinePreset('custom');
  };

  const filteredCareers = useMemo(() => {
    let list: CareerOption[] = comprehensiveCareerCatalog;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const selectedRole = useMemo(() => {
    return customRoleTitle
      ? createCustomCareerBlueprint(customRoleTitle, customRoleCategory)
      : getOrCreateCareerBlueprint(selectedSlug, profile.target_role_category);
  }, [customRoleCategory, customRoleTitle, profile.target_role_category, selectedSlug]);

  const { totalDays, totalWeeks, totalEffortHours, isOverloaded, requiredDailyMinutes } = useMemo(() => {
    const days = Math.max(14, daysBetweenDateOnly(today, targetDateStr));
    const weeks = days / 7;
    const effort = roleOutline?.total_hours ?? selectedRole.effortHours;
    const available = (days * (5 / 7) * dailyMinutes) / 60;
    const overloaded = available < effort;
    const reqMins = Math.ceil((effort * 60) / (days * (5 / 7)));
    return {
      totalDays: days,
      totalWeeks: weeks,
      totalEffortHours: effort,
      isOverloaded: overloaded,
      requiredDailyMinutes: reqMins,
    };
  }, [targetDateStr, selectedRole.effortHours, roleOutline?.total_hours, dailyMinutes, today]);

  const selectCustomRole = () => {
    const title = searchQuery.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!title) return;
    setCustomRoleTitle(title);
    setRoleOutline(null);
    setRoleDraftError(null);
    setSelectedSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    setSelectedCategory('all');
  };

  const handleDraftRoleOutline = async () => {
    if (!customRoleTitle || isDraftingRole || profile.is_demo) return;
    setIsDraftingRole(true);
    setRoleDraftError(null);
    try {
      const result = await requestAI<RolePlanOutline>('role', {
        role_title: customRoleTitle,
        experience_level: experienceLevel,
        category: customRoleCategory,
        skills: selectedRole.skills.join(', '),
      });
      if (!isRolePlanOutline(result.response, customRoleTitle)) {
        throw new Error('The generated outline did not pass validation. You can still use the category playbook.');
      }
      setRoleOutline(result.response);
    } catch (error) {
      setRoleOutline(null);
      setRoleDraftError(
        error instanceof Error ? error.message : 'Could not draft the role outline. You can still use the category playbook.'
      );
    } finally {
      setIsDraftingRole(false);
      await onAIUsageChanged?.();
    }
  };

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      try {
        const perm = await notificationService.requestPermission();
        if (perm === 'granted') {
          await notificationService.enableSmartPush(profile.id, Boolean(profile.is_demo)).catch(() => undefined);
        }
      } catch {
        // Notification permission is optional during onboarding.
      }

      const calculatedMonths =
        typeof selectedTimelinePreset === 'number'
          ? selectedTimelinePreset
          : Math.max(1, Math.round(totalDays / 30));

      const updated: Profile = {
        ...profile,
        target_role: selectedRole.title,
        target_role_category: selectedRole.category,
        target_timeline_months: calculatedMonths,
        target_completion_date: targetDateStr,
        daily_minutes: dailyMinutes,
        experience_level: experienceLevel,
        has_completed_onboarding: true,
      };
      await onComplete(updated, roleOutline ?? undefined);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your career goal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDisplayDate = (isoStr: string) => {
    const [year, monthNumber, dayNumber] = isoStr.split('-').map(Number);
    if (!year || !monthNumber || !dayNumber) return isoStr;
    const d = new Date(year, monthNumber - 1, dayNumber);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()] || 'Jan';
    return `${day} ${month} ${d.getFullYear()}`;
  };

  const experienceLabel = EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label || 'Beginner';

  return (
    <div className="onboarding-page">
      <header className="onboarding-topbar">
        <div className="onboarding-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#123C69',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Compass size={16} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Career Pilot
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Goal Setup</span>
        </div>
      </header>

      <main className="onboarding-main" aria-label="Set up your career goal">
        <div className="onboarding-header-row">
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                margin: '0 0 4px',
              }}
            >
              Choose your career path
            </h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748B' }}>
              Select a target role, timeline, and daily study pace to build your roadmap.
            </p>
          </div>

          <div className="onboarding-search-box">
            <Search size={14} color="#64748B" aria-hidden="true" />
            <input
              type="text"
              aria-label="Search career roles"
              placeholder="Search 200+ roles or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: '#0F172A',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear role search"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0, display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="onboarding-layout">
          {/* Main Configuration Column */}
          <div className="onboarding-config-col">
            <section aria-label="Target role selection">
              <div className="onboarding-category-bar">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`onboarding-category-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Target role · <span style={{ color: '#64748B', fontWeight: 500 }}>{filteredCareers.length} available</span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#123C69' }}>{selectedRole.title}</span>
              </div>

              <div className="onboarding-role-grid">
                {filteredCareers.map((role) => {
                  const isSelected = !customRoleTitle && selectedRole.slug === role.slug;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      className={`onboarding-role-btn ${isSelected ? 'is-selected' : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setCustomRoleTitle('');
                        setRoleOutline(null);
                        setRoleDraftError(null);
                        setSelectedSlug(role.slug);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '7px',
                            background: isSelected ? '#123C69' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIcon(role, isSelected)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#0F172A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {role.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>{role.category}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 500,
                          color: isSelected ? '#123C69' : '#64748B',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {role.effortHours}h
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredCareers.length === 0 && searchQuery.trim() && !customRoleTitle && (
                <section
                  aria-label="Create a custom career roadmap"
                  className="career-custom-role-create"
                  style={{
                    display: 'grid',
                    alignItems: 'end',
                    gap: '12px',
                    padding: '16px',
                    marginTop: '10px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Create a custom role</div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                      Use a category playbook or draft a tailored outline for{' '}
                      <strong style={{ color: '#0F172A' }}>{searchQuery.trim().replace(/\s+/g, ' ').slice(0, 80)}</strong>.
                    </p>
                  </div>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                    Category
                    <select
                      value={customRoleCategory}
                      onChange={(event) => setCustomRoleCategory(event.target.value as CareerCategory)}
                      style={{
                        height: '36px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '0 10px',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '12.5px',
                      }}
                    >
                      {careerCategories
                        .filter((category) => category.id !== 'all')
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="auth-primary-btn"
                    onClick={selectCustomRole}
                    style={{ height: '36px', padding: '0 16px', fontSize: '12.5px' }}
                  >
                    Use role
                  </button>
                </section>
              )}

              {customRoleTitle && (
                <section
                  aria-label="Custom role learning plan"
                  style={{
                    marginTop: '12px',
                    padding: '16px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 260px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        Custom role: {customRoleTitle}
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45, margin: '4px 0 0' }}>
                        Uses the {customRoleCategory} playbook by default. You can optionally generate a role-specific outline
                        {aiQuota?.role ? ` (${aiQuota.role.remaining} of ${aiQuota.role.limit} weekly requests remaining).` : '.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        aria-label="Custom role category"
                        value={customRoleCategory}
                        onChange={(event) => {
                          setCustomRoleCategory(event.target.value as CareerCategory);
                          setRoleOutline(null);
                          setRoleDraftError(null);
                        }}
                        style={{
                          height: '36px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '0 10px',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '12.5px',
                        }}
                      >
                        {careerCategories
                          .filter((category) => category.id !== 'all')
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleDraftRoleOutline()}
                        disabled={Boolean(profile.is_demo) || isDraftingRole || (aiQuota?.role?.remaining ?? 1) <= 0}
                        style={{
                          height: '36px',
                          padding: '0 14px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                          color: '#0F172A',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: isDraftingRole ? 'wait' : 'pointer',
                        }}
                      >
                        {isDraftingRole ? 'Drafting…' : roleOutline ? 'Redraft AI outline' : 'Draft AI outline'}
                      </button>
                    </div>
                  </div>
                  {profile.is_demo && (
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: '8px 0 0' }}>
                      AI outlines require signing in. Demo mode uses the category playbook.
                    </p>
                  )}
                  {roleDraftError && (
                    <p role="alert" style={{ fontSize: '12px', color: '#B91C1C', margin: '8px 0 0' }}>
                      {roleDraftError}
                    </p>
                  )}
                  {roleOutline && (
                    <div aria-live="polite" style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#123C69' }}>
                        AI draft · {roleOutline.total_hours} estimated hours
                      </div>
                      {roleOutline.milestones.map((milestone) => (
                        <article
                          key={milestone.position}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                            Stage {milestone.position}: {milestone.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>{milestone.focus}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                            {milestone.skills.join(' · ')} · {milestone.effort_hours}h
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </section>

            {/* Experience Baseline */}
            <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <legend style={{ marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Experience level
              </legend>
              <div className="onboarding-exp-grid">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = experienceLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setExperienceLevel(level.id);
                        setRoleOutline(null);
                        setRoleDraftError(null);
                      }}
                      style={{
                        minHeight: '58px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #123C69' : '1px solid #E2E8F0',
                        boxShadow: isSelected ? 'inset 0 0 0 1px #123C69' : 'none',
                        background: isSelected ? '#F4F7FB' : '#FFFFFF',
                        color: '#0F172A',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600 }}>{level.label}</span>
                      <span style={{ display: 'block', marginTop: '2px', fontSize: '11px', color: '#64748B' }}>
                        {level.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Timeline & Daily Pace */}
            <div className="onboarding-pacing-grid">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Target timeline</label>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
                    {selectedTimelinePreset === 'custom' ? 'Custom date' : `${selectedTimelinePreset} months (${totalDays}d)`}
                  </span>
                </div>

                <div className="onboarding-timeline-presets" style={{ marginBottom: '8px' }}>
                  {PRESET_TIMELINES.map((preset) => {
                    const isSelected = selectedTimelinePreset === preset.months;
                    return (
                      <button
                        key={preset.months}
                        type="button"
                        className={`onboarding-segment-btn ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectPreset(preset.months)}
                        title={preset.fullLabel}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={`onboarding-segment-btn ${selectedTimelinePreset === 'custom' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedTimelinePreset('custom');
                      dateInputRef.current?.showPicker?.();
                    }}
                    title="Choose custom calendar deadline"
                  >
                    Custom
                  </button>
                </div>

                <div
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="#64748B" aria-hidden="true" />
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                      {formatDisplayDate(targetDateStr)}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>({totalWeeks.toFixed(1)} wks)</span>
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#123C69' }}>Change date</span>

                  <input
                    ref={dateInputRef}
                    type="date"
                    aria-label="Target completion date"
                    min={today}
                    value={targetDateStr}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      left: 0,
                      top: 0,
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Daily study pace</label>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>{dailyMinutes} mins / day</span>
                </div>

                <div className="onboarding-pace-presets" style={{ marginBottom: '8px' }}>
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`onboarding-segment-btn ${dailyMinutes === mins ? 'is-selected' : ''}`}
                      onClick={() => setDailyMinutes(mins)}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '9px 12px',
                  }}
                >
                  <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
                    <strong style={{ color: '#0F172A' }}>{((dailyMinutes * 5) / 60).toFixed(1)} hrs</strong> / week
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>5 weekdays/wk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Plan Summary Column */}
          <aside className="onboarding-summary-card" aria-label="Plan summary">
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '12px',
              }}
            >
              Plan summary
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                {selectedRole.title}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                {selectedRole.category} · {totalEffortHours}h
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#64748B' }}>Experience</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{experienceLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#64748B' }}>Target date</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatDisplayDate(targetDateStr)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#64748B' }}>Weekday commitment</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{dailyMinutes} mins / day</span>
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: isOverloaded ? '1px solid #FECACA' : '1px solid #E2E8F0',
                background: isOverloaded ? '#FEF2F2' : '#F8FAFC',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                {isOverloaded ? (
                  <>
                    <AlertTriangle size={14} color="#B91C1C" aria-hidden="true" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#B91C1C' }}>Schedule overload</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#15803D" aria-hidden="true" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Feasible pace</span>
                  </>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
                {isOverloaded ? (
                  <>
                    Needs about <strong style={{ color: '#B91C1C' }}>{requiredDailyMinutes} mins/day</strong> over{' '}
                    {totalDays} days. Consider extending your deadline.
                  </>
                ) : (
                  <>
                    Fits cleanly into <strong>{totalWeeks.toFixed(1)} weeks</strong> at {dailyMinutes} mins per weekday.
                  </>
                )}
              </p>
            </div>

            {saveError && (
              <div role="alert" style={{ marginBottom: '12px', color: '#B91C1C', fontSize: '12.5px', fontWeight: 600 }}>
                {saveError}
              </div>
            )}

            <button
              type="button"
              className="auth-primary-btn"
              onClick={handleFinish}
              disabled={isSaving}
              style={{
                width: '100%',
                height: '44px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{isSaving ? 'Saving your goal…' : 'Apply This Career Roadmap'}</span>
              {!isSaving && <ArrowRight size={15} />}
            </button>
          </aside>
        </div>
      </main>

      <div className="onboarding-mobile-bar">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedRole.title}
          </div>
          <div style={{ fontSize: '11px', color: isOverloaded ? '#B91C1C' : '#64748B', fontWeight: 500 }}>
            {totalWeeks.toFixed(1)} wks · {dailyMinutes}m/day
          </div>
        </div>
        <button
          type="button"
          className="auth-primary-btn"
          onClick={handleFinish}
          disabled={isSaving}
          style={{
            height: '42px',
            padding: '0 16px',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <span>{isSaving ? 'Saving…' : 'Apply Roadmap'}</span>
          {!isSaving && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
};
