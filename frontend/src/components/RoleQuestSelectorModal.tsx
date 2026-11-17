import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Sparkles,
  Search,
  ChevronRight,
  Code2,
  Cloud,
  Database,
  Monitor,
  Shield,
  Smartphone,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  comprehensiveCareerCatalog,
  careerCategories,
  createCustomCareerBlueprint,
  getOrCreateCareerBlueprint,
} from '../features/roadmap/careerCatalog';
import type { CareerCategory, CareerOption } from '../features/roadmap/careerCatalog';
import type { RolePlanOutline } from '../features/roadmap/careerCatalog';
import { isRolePlanOutline, requestAI, type AIQuotaSummary } from '../features/ai/aiGateway';
import { generateRoadmapForRole } from '../features/roadmap/plannerEngine';
import type { Milestone, Profile } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { addMonthsToDateOnly, daysBetweenDateOnly, getLocalDateOnly } from '../lib/dateOnly';

interface Props {
  currentRoleSlug: string;
  experienceLevel: Profile['experience_level'];
  isDemo?: boolean;
  aiQuota?: AIQuotaSummary | null;
  onAIUsageChanged?: () => Promise<void> | void;
  onClose: () => void;
  onSelectNewPlan: (
    roleTitle: string,
    roleCategory: CareerCategory,
    targetDate: string,
    dailyMinutes: number,
    milestones: Milestone[],
    roleOutline?: RolePlanOutline
  ) => void;
}

const PRESET_TIMELINES = [
  { label: '3 Mo', months: 3, fullLabel: '3 Months (Fast Track)' },
  { label: '6 Mo', months: 6, fullLabel: '6 Months (Recommended Standard)' },
  { label: '9 Mo', months: 9, fullLabel: '9 Months (Steady Pace)' },
  { label: '12 Mo', months: 12, fullLabel: '12 Months (1 Year Comprehensive)' },
  { label: '18+ Mo', months: 18, fullLabel: '18 Months (Extended Mastery)' },
];

function calculateTargetDate(months: number): string {
  return addMonthsToDateOnly(getLocalDateOnly(), months);
}

export const RoleQuestSelectorModal: React.FC<Props> = ({
  currentRoleSlug,
  experienceLevel,
  isDemo = false,
  aiQuota,
  onAIUsageChanged,
  onClose,
  onSelectNewPlan,
}) => {
  const dialogRef = useAccessibleDialog(true, onClose);
  const [today] = useState(() => getLocalDateOnly());
  const [selectedSlug, setSelectedSlug] = useState(
    currentRoleSlug || 'serverless-application-engineer'
  );
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [customRoleCategory, setCustomRoleCategory] = useState<CareerCategory>('Software & Web');
  const [roleOutline, setRoleOutline] = useState<RolePlanOutline | null>(null);
  const [isDraftingRole, setIsDraftingRole] = useState(false);
  const [roleDraftError, setRoleDraftError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Timeline preset: 3, 6, 9, 12, 18 months or 'custom'
  const [selectedTimelinePreset, setSelectedTimelinePreset] = useState<number | 'custom'>(6);

  // Default target date: 6 months from now
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return calculateTargetDate(6);
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

  // Filter 200+ careers
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

  // Proportional math calculation
  const selectedRole = useMemo(() => {
    if (customRoleTitle) return createCustomCareerBlueprint(customRoleTitle, customRoleCategory);
    return getOrCreateCareerBlueprint(selectedSlug);
  }, [customRoleCategory, customRoleTitle, selectedSlug]);

  const selectCustomRole = () => {
    const title = searchQuery.trim().replace(/\s+/g, ' ');
    if (!title) return;
    setCustomRoleTitle(title);
    setRoleOutline(null);
    setRoleDraftError(null);
    setSelectedSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    setSelectedCategory('all');
  };

  const handleDraftRoleOutline = async () => {
    if (!customRoleTitle || isDraftingRole || isDemo) return;
    setIsDraftingRole(true);
    setRoleDraftError(null);
    try {
      const result = await requestAI<RolePlanOutline>('role', {
        role_title: customRoleTitle,
        experience_level: experienceLevel || 'beginner',
        category: customRoleCategory,
        skills: selectedRole.skills.join(', '),
      });
      const outline = result.response;
      if (!isRolePlanOutline(outline, customRoleTitle)) {
        throw new Error('The generated outline did not pass validation. You can still use the category playbook.');
      }
      setRoleOutline(outline);
    } catch (error) {
      setRoleOutline(null);
      setRoleDraftError(error instanceof Error ? error.message : 'Could not draft the role outline. You can still use the category playbook.');
    } finally {
      setIsDraftingRole(false);
      await onAIUsageChanged?.();
    }
  };

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

  const handleConfirm = () => {
    const months =
      typeof selectedTimelinePreset === 'number'
        ? selectedTimelinePreset
        : Math.max(1, Math.round(totalDays / 30));
    const milestones = generateRoadmapForRole(
      selectedRole.title,
      months,
      dailyMinutes,
      targetDateStr,
      experienceLevel || 'beginner',
      selectedRole.category,
      roleOutline ?? undefined
    );
    onSelectNewPlan(selectedRole.title, selectedRole.category, targetDateStr, dailyMinutes, milestones, roleOutline ?? undefined);
  };

  const formatDisplayDate = (isoStr: string) => {
    const [year, monthNumber, dayNumber] = isoStr.split('-').map(Number);
    if (!year || !monthNumber || !dayNumber) return isoStr;
    const d = new Date(year, monthNumber - 1, dayNumber);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()] || 'Jan';
    return `${day} - ${month} - ${d.getFullYear()}`;
  };

  const getRoleIcon = (role: CareerOption) => {
    const t = role.title.toLowerCase();
    const c = role.category.toLowerCase();
    if (t.includes('next')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          N
        </div>
      );
    }
    if (t.includes('vue') || t.includes('nuxt')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#E6F9F0',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#10B981' }}>▲</span>
        </div>
      );
    }
    if (t.includes('serverless') || t.includes('cloud') || c.includes('cloud')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Cloud size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (t.includes('backend') || t.includes('database')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Database size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (t.includes('frontend') || t.includes('web') || c.includes('web')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Monitor size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (c.includes('ai') || c.includes('data')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (c.includes('cyber') || c.includes('security')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Shield size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (c.includes('mobile')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Smartphone size={18} strokeWidth={2.2} />
        </div>
      );
    }
    if (c.includes('game')) {
      return (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <Gamepad2 size={18} strokeWidth={2.2} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563EB',
          flexShrink: 0,
        }}
      >
        <Code2 size={18} strokeWidth={2.2} />
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={onClose}
    >
      {/* Modal Dialog Window */}
      <div
        ref={dialogRef}
        className="career-path-window"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a career goal"
        tabIndex={-1}
        style={{
          maxWidth: '1060px',
          width: '100%',
          height: '92vh',
          maxHeight: '680px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* LEFT PANEL: MOUNTAIN SCENIC & EXPLORE/LEARN/GROW PILLS   */}
        {/* ======================================================== */}
        <div
          className="career-path-left-panel"
          style={{
            width: '240px',
            position: 'relative',
            background: '#0B1E38',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Background Mountain Image from Reference */}
          <img
            src="/assets/career-mountain-desktop.png"
            alt="Career road scenic"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: ROADMAP SEARCH, SELECTION, AND CONTROLS      */}
        {/* ======================================================== */}
        <div
          className="career-path-right-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 28px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            background: '#FFFFFF',
          }}
        >
          <div>
            {/* Top Bar: Title & Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#64748B',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Career Pilot
                </div>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#0F172A',
                    letterSpacing: '-0.02em',
                    margin: '0 0 4px 0',
                  }}
                >
                  Choose your career path
                </h2>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Explore curated roles or create a custom path shaped to your goals.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Search Bar Input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    width: '260px',
                  }}
                >
                  <Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    aria-label="Search career roles"
                    placeholder="Search 200+ careers (e.g. Next.js, DevOps, AI)..."
                    data-dialog-initial-focus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '11.5px',
                      color: '#0F172A',
                      width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '9999px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '16px',
                scrollbarWidth: 'none',
              }}
            >
              {[
                { id: 'all', label: 'All (200+)' },
                { id: 'Software & Web', label: 'Software & Web' },
                { id: 'AI & Data Science', label: 'AI & Data' },
                { id: 'Cloud & DevOps', label: 'Cloud & DevOps' },
                { id: 'Cybersecurity', label: 'Cybersecurity' },
                { id: 'Mobile & Multiplatform', label: 'Mobile App' },
                { id: 'Game Dev & 3D', label: 'Game Dev' },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: 'none',
                      background: isActive ? '#0F2744' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Target Role Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Target Role ({filteredCareers.length} available)
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563EB' }}>
                Selected: {selectedRole.title}
              </div>
            </div>

            {/* Role Cards Grid (2 columns on desktop) */}
            <div
              className="career-role-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                maxHeight: '190px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '4px',
                marginBottom: '18px',
              }}
            >
              {filteredCareers.map((role) => {
                const isSelected = !customRoleTitle && selectedRole.slug === role.slug;
                return (
                  <div
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => { setCustomRoleTitle(''); setRoleOutline(null); setRoleDraftError(null); setSelectedSlug(role.slug); }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCustomRoleTitle('');
                        setRoleOutline(null);
                        setRoleDraftError(null);
                        setSelectedSlug(role.slug);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      {getRoleIcon(role)}
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: isSelected ? '#1D4ED8' : '#0F172A',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {role.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>{role.category}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span
                        style={{
                          background: isSelected ? '#DBEAFE' : '#EFF6FF',
                          color: '#2563EB',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {role.effortHours}h
                      </span>
                      <ChevronRight size={14} color={isSelected ? '#2563EB' : '#94A3B8'} />
                    </div>
                  </div>
                );
              })}
            </div>

            {customRoleTitle && (
              <section
                aria-label="Custom role learning plan"
                style={{ margin: '-6px 0 18px', padding: '14px', border: '1px solid #C7D2FE', borderRadius: '12px', background: '#F8FAFF' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F2744' }}>Personalize this custom role</div>
                    <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.45, margin: '4px 0 0' }}>
                      The category playbook is the default. You can request a role-specific outline; its four reviewed stages and skills will shape your saved milestones and tasks.
                    </p>
                    <p style={{ fontSize: '10.5px', color: '#64748B', margin: '5px 0 0' }}>
                      Only the role title, experience level, category, and baseline skills are sent when you request an outline.
                      {aiQuota?.role ? ` ${aiQuota.role.remaining} of ${aiQuota.role.limit} weekly requests remain.` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDraftRoleOutline()}
                    disabled={isDemo || isDraftingRole || (aiQuota?.role?.remaining ?? 1) <= 0}
                    style={{ minHeight: '38px', padding: '0 13px', border: '1px solid #A5B4FC', borderRadius: '9px', background: '#FFFFFF', color: '#3730A3', fontWeight: 800, cursor: isDemo || isDraftingRole ? 'wait' : 'pointer' }}
                  >
                    {isDraftingRole ? 'Drafting outline…' : roleOutline ? 'Draft a new outline' : 'Draft AI outline'}
                  </button>
                </div>
                {isDemo && <p style={{ fontSize: '11px', color: '#64748B', margin: '9px 0 0' }}>AI outlines are available after you sign in. The category playbook works in demo mode.</p>}
                {roleDraftError && <p role="alert" style={{ fontSize: '11px', color: '#B91C1C', margin: '9px 0 0' }}>{roleDraftError}</p>}
                {roleOutline && (
                  <div aria-live="polite" style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#3730A3' }}>
                      AI draft · {roleOutline.total_hours} estimated hours · included in the roadmap if applied
                    </div>
                    {roleOutline.milestones.map((milestone) => (
                      <article key={milestone.position} style={{ padding: '9px 10px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E0E7FF' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>Stage {milestone.position}: {milestone.title}</div>
                        <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '3px' }}>{milestone.focus}</div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>{milestone.skills.join(' · ')} · {milestone.effort_hours}h</div>
                      </article>
                    ))}
                    <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>Review this AI-generated draft before applying it. It is a learning suggestion, not verified labor-market research.</p>
                  </div>
                )}
              </section>
            )}

            {filteredCareers.length === 0 && searchQuery.trim() && (
              <section
                aria-label="Create a custom career roadmap"
                className="career-custom-role-create"
                style={{
                  display: 'grid',
                  alignItems: 'end',
                  gap: '12px',
                  padding: '14px',
                  marginBottom: '18px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE',
                  background: '#F8FBFF',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F2744' }}>Create a custom role</div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
                    Starts from a category playbook. After selecting the role, you can optionally request a role-specific AI outline.
                  </p>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', marginTop: '6px' }}>
                    {searchQuery.trim().replace(/\s+/g, ' ').slice(0, 80)}
                  </div>
                </div>
                <label style={{ display: 'grid', gap: '5px', fontSize: '10px', fontWeight: 800, color: '#475569' }}>
                  CAREER CATEGORY
                  <select
                    value={customRoleCategory}
                    onChange={(event) => {
                      setCustomRoleCategory(event.target.value as CareerCategory);
                      setRoleOutline(null);
                      setRoleDraftError(null);
                    }}
                    style={{ minHeight: '38px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 10px', background: '#FFFFFF', color: '#0F172A' }}
                  >
                    {careerCategories.filter((category) => category.id !== 'all').map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={selectCustomRole}
                  style={{ minHeight: '38px', padding: '0 14px', border: 0, borderRadius: '8px', background: '#1D4ED8', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Use role
                </button>
              </section>
            )}

            {/* Target Deadline & Study Commitment Inputs */}
            <div
              className="career-controls-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Target Completion (Presets + Custom Deadline) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Target Completion Deadline
                  </label>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: selectedTimelinePreset === 'custom' ? '#D97706' : '#2563EB',
                      background: selectedTimelinePreset === 'custom' ? '#FEF3C7' : '#EFF6FF',
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {selectedTimelinePreset === 'custom'
                      ? 'Custom Deadline'
                      : `${selectedTimelinePreset} Months (${totalDays}d)`}
                  </span>
                </div>

                {/* Preset Time Buttons (3, 6, 9, 12, 18+ Months & Custom) */}
                <div
                  className="career-timeline-presets"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '4px',
                    marginBottom: '8px',
                  }}
                >
                  {PRESET_TIMELINES.map((preset) => {
                    const isSelected = selectedTimelinePreset === preset.months;
                    return (
                      <button
                        key={preset.months}
                        type="button"
                        onClick={() => handleSelectPreset(preset.months)}
                        title={preset.fullLabel}
                        style={{
                          padding: '7px 0',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
                          background: isSelected ? '#0F2744' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: isSelected ? 800 : 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  {/* Custom Date Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimelinePreset('custom');
                      dateInputRef.current?.showPicker?.();
                    }}
                    title="Choose custom calendar deadline"
                    style={{
                      padding: '7px 0',
                      borderRadius: '8px',
                      border:
                        selectedTimelinePreset === 'custom' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                      background: selectedTimelinePreset === 'custom' ? '#D97706' : '#F8FAFC',
                      color: selectedTimelinePreset === 'custom' ? '#FFFFFF' : '#334155',
                      fontWeight: selectedTimelinePreset === 'custom' ? 800 : 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    Custom
                  </button>
                </div>

                {/* Date Display and Picker Card */}
                <div
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    background: '#FFFFFF',
                    border: `1.5px solid ${selectedTimelinePreset === 'custom' ? '#F59E0B' : '#E2E8F0'}`,
                    borderRadius: '10px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow:
                      selectedTimelinePreset === 'custom' ? '0 0 0 2px rgba(245, 158, 11, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar
                      size={15}
                      color={selectedTimelinePreset === 'custom' ? '#D97706' : '#2563EB'}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                      {formatDisplayDate(targetDateStr)}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                      ({totalWeeks.toFixed(1)} wks · {totalDays} days)
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Change date
                  </span>

                  <input
                    ref={dateInputRef}
                    type="date"
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

              {/* Daily Study Commitment */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Daily Study Commitment
                  </label>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#166534',
                      background: '#F0FDF4',
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {dailyMinutes} mins / day
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  {[30, 60, 90, 120].map((mins) => {
                    const isSelected = dailyMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDailyMinutes(mins)}
                        style={{
                          padding: '7px 0',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
                          background: isSelected ? '#0F2744' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: isSelected ? 800 : 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>

                {/* Commitment Summary Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#2563EB" />
                    <span style={{ fontSize: '11.5px', color: '#334155', fontWeight: 600 }}>
                      Study Pace: <strong>{((dailyMinutes * 5) / 60).toFixed(1)} hrs</strong> / weekday
                    </span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#64748B' }}>5 days/week</span>
                </div>
              </div>
            </div>

            {/* Overload Warning / Feasible Banner */}
            <div
              style={{
                background: isOverloaded ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${isOverloaded ? '#FECACA' : '#BBF7D0'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                {isOverloaded ? (
                  <>
                    <AlertTriangle size={15} color="#DC2626" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626' }}>
                      Schedule Overload Warning
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} color="#166534" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                      Feasible Study Plan
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                {isOverloaded ? (
                  <>
                    Total effort is {totalEffortHours}h across {totalDays} days. You need at least{' '}
                    <strong style={{ color: '#DC2626' }}>{requiredDailyMinutes} mins/day</strong>. Consider
                    extending the deadline.
                  </>
                ) : (
                  <>
                    Total effort is {totalEffortHours}h across {totalDays} days. Feasible allocation of{' '}
                    <strong>{totalWeeks.toFixed(1)} weeks</strong> across {selectedRole.stages.length} stages at{' '}
                    {dailyMinutes} mins/weekday.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: '#0F2744',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(15, 39, 68, 0.35)',
              transition: 'background 0.15s ease',
            }}
          >
            <span>Apply This Career Roadmap</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
