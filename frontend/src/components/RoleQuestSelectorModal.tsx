import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Sparkles,
  Search,
  Check,
  CheckCircle2,
  Code2,
  Cloud,
  Database,
  Monitor,
  Shield,
  Smartphone,
  Gamepad2,
  Layers,
  Briefcase,
  Cpu,
  FlaskConical,
  Coins,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  comprehensiveCareerCatalog,
  careerCategories,
  createCustomCareerBlueprint,
  getOrCreateCareerBlueprint,
} from '../features/roadmap/careerCatalog';
import type { CareerCategory, CareerOption, RolePlanOutline } from '../features/roadmap/careerCatalog';
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
  { label: '6 Mo', months: 6, fullLabel: '6 Months (Recommended)' },
  { label: '9 Mo', months: 9, fullLabel: '9 Months (Steady Pace)' },
  { label: '12 Mo', months: 12, fullLabel: '12 Months (Comprehensive)' },
  { label: '18+ Mo', months: 18, fullLabel: '18 Months (Extended Mastery)' },
];

function calculateTargetDate(months: number): string {
  return addMonthsToDateOnly(getLocalDateOnly(), months);
}

function getCategoryIcon(role: CareerOption) {
  const title = role.title.toLowerCase();
  const category = role.category;

  if (title.includes('next')) {
    return (
      <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '-0.02em' }}>
        N
      </span>
    );
  }
  if (title.includes('backend') || title.includes('database') || title.includes('sql')) {
    return <Database size={16} strokeWidth={2} />;
  }
  if (title.includes('frontend') || title.includes('react') || title.includes('vue') || title.includes('angular')) {
    return <Monitor size={16} strokeWidth={2} />;
  }

  const iconByCategory: Record<CareerCategory, React.ReactNode> = {
    'Software & Web': <Code2 size={16} strokeWidth={2} />,
    'AI & Data Science': <Sparkles size={16} strokeWidth={2} />,
    'Cloud & DevOps': <Cloud size={16} strokeWidth={2} />,
    Cybersecurity: <Shield size={16} strokeWidth={2} />,
    'Mobile & Multiplatform': <Smartphone size={16} strokeWidth={2} />,
    'Game Dev & 3D': <Gamepad2 size={16} strokeWidth={2} />,
    'UI/UX & Product Design': <Layers size={16} strokeWidth={2} />,
    'Product & Agile Leadership': <Briefcase size={16} strokeWidth={2} />,
    'QA & Reliability': <FlaskConical size={16} strokeWidth={2} />,
    'FinTech & Web3': <Coins size={16} strokeWidth={2} />,
    'Hardware & Robotics': <Cpu size={16} strokeWidth={2} />,
    'Enterprise & Applied Tech': <Briefcase size={16} strokeWidth={2} />,
  };

  return iconByCategory[category] ?? <Code2 size={16} strokeWidth={2} />;
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

  const [selectedTimelinePreset, setSelectedTimelinePreset] = useState<number | 'custom'>(6);
  const [targetDateStr, setTargetDateStr] = useState<string>(() => calculateTargetDate(6));

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
      setRoleDraftError(
        error instanceof Error
          ? error.message
          : 'Could not draft the role outline. You can still use the category playbook.'
      );
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
    onSelectNewPlan(
      selectedRole.title,
      selectedRole.category,
      targetDateStr,
      dailyMinutes,
      milestones,
      roleOutline ?? undefined
    );
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(15, 23, 42, 0.56)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.16s ease-out',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="career-path-window"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a career goal"
        tabIndex={-1}
        style={{
          maxWidth: '1040px',
          width: '100%',
          maxHeight: '88vh',
          background: 'var(--md-surface)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px -16px rgba(15, 23, 42, 0.28)',
          border: '1px solid var(--md-outline)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Workspace Modal Header */}
        <header
          style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid var(--md-outline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--md-surface)',
            flexShrink: 0,
          }}
        >
          <div
            className="career-modal-header-top"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--md-primary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '2px',
                }}
              >
                Career Track &amp; Pace
              </div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--md-text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Choose your career path
              </h2>
            </div>

            <div className="career-modal-search-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 1 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  width: '290px',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Search size={14} color="var(--md-text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  aria-label="Search career roles"
                  placeholder="Search 200+ roles or skills..."
                  data-dialog-initial-focus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    color: 'var(--md-text-primary)',
                    width: '100%',
                    minWidth: 0,
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-text-muted)', padding: 0, display: 'inline-flex' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                style={{
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  color: 'var(--md-text-secondary)',
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

          {/* Scrollable Domain Filter Pills */}
          <div
            role="tablist"
            aria-label="Career categories"
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
            }}
          >
            {careerCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 600,
                    whiteSpace: 'nowrap',
                    border: isActive ? '1px solid var(--md-primary)' : '1px solid var(--md-outline)',
                    background: isActive ? 'var(--md-primary)' : 'var(--md-surface)',
                    color: isActive ? '#FFFFFF' : 'var(--md-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {cat.id === 'all' ? `All (${comprehensiveCareerCatalog.length})` : cat.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main 2-Pane Body: Directory (Left) + Pace & Schedule Configurator (Right) */}
        <div
          className="career-path-body"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 0.95fr)',
            overflow: 'hidden',
          }}
        >
          {/* LEFT PANE: Role Directory */}
          <div
            className="career-path-directory"
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              padding: '16px 20px',
              borderRight: '1px solid var(--md-outline)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--md-text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Available Roles ({filteredCareers.length})
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                Click a role to preview &amp; calibrate
              </span>
            </div>

            {filteredCareers.length > 0 ? (
              <div
                className="career-role-cards-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px',
                }}
              >
                {filteredCareers.map((role) => {
                  const isSelected = !customRoleTitle && selectedRole.slug === role.slug;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setCustomRoleTitle('');
                        setRoleOutline(null);
                        setRoleDraftError(null);
                        setSelectedSlug(role.slug);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        minWidth: 0,
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 12px',
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                        background: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                            color: isSelected ? '#FFFFFF' : 'var(--md-primary)',
                            border: isSelected ? 'none' : '1px solid var(--md-outline)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIcon(role)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--md-primary)' : 'var(--md-text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {role.title}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--md-text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {role.category}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                          style={{
                            background: isSelected ? 'var(--md-surface)' : 'var(--md-surface-variant)',
                            color: isSelected ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                            border: '1px solid var(--md-outline)',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                          }}
                        >
                          {role.effortHours}h
                        </span>
                        {isSelected && <Check size={14} color="var(--md-primary)" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              searchQuery.trim() && (
                <section
                  aria-label="Create a custom career roadmap"
                  className="career-custom-role-create"
                  style={{
                    display: 'grid',
                    alignItems: 'end',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-primary)',
                    background: 'var(--md-surface-variant)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                      Create a custom role
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)', margin: '4px 0 0', lineHeight: 1.45 }}>
                      Starts from a category playbook. Once selected, you can optionally draft a role-specific outline.
                    </p>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-primary)', marginTop: '6px' }}>
                      {searchQuery.trim().replace(/\s+/g, ' ').slice(0, 80)}
                    </div>
                  </div>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '10.5px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>
                    CAREER CATEGORY
                    <select
                      value={customRoleCategory}
                      onChange={(event) => {
                        setCustomRoleCategory(event.target.value as CareerCategory);
                        setRoleOutline(null);
                        setRoleDraftError(null);
                      }}
                      style={{
                        minHeight: '38px',
                        border: '1px solid var(--md-outline)',
                        borderRadius: '8px',
                        padding: '0 10px',
                        background: 'var(--md-surface)',
                        color: 'var(--md-text-primary)',
                      }}
                    >
                      {careerCategories.filter((category) => category.id !== 'all').map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={selectCustomRole}
                    className="btn-m3-primary"
                    style={{ minHeight: '38px', padding: '0 16px' }}
                  >
                    Use role
                  </button>
                </section>
              )
            )}
          </div>

          {/* RIGHT PANE: Selected Plan Preview & Pace Configurator */}
          <div
            className="career-path-config"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '18px 22px',
              background: 'var(--md-surface-variant)',
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {/* Selected Role Summary Card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'var(--md-surface)',
                border: '1px solid var(--md-outline)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--md-primary)',
                    }}
                  >
                    Selected Track
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                    {selectedRole.title}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--md-primary)',
                    background: 'var(--md-primary-container)',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    flexShrink: 0,
                  }}
                >
                  {totalEffortHours}h total
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', lineHeight: 1.4 }}>
                {selectedRole.shortDesc}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                {selectedRole.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--md-surface-variant)',
                      border: '1px solid var(--md-outline)',
                      color: 'var(--md-text-secondary)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {customRoleTitle && (
              <section
                aria-label="Custom role learning plan"
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--md-primary)',
                  borderRadius: '12px',
                  background: 'var(--md-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                      Personalize custom role
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--md-text-secondary)', marginTop: '2px' }}>
                      {aiQuota?.role ? `${aiQuota.role.remaining} of ${aiQuota.role.limit} AI drafts left.` : 'Optional AI stage draft.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDraftRoleOutline()}
                    disabled={isDemo || isDraftingRole || (aiQuota?.role?.remaining ?? 1) <= 0}
                    style={{
                      minHeight: '34px',
                      padding: '0 12px',
                      border: '1px solid var(--md-primary)',
                      borderRadius: '8px',
                      background: 'var(--md-surface)',
                      color: 'var(--md-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isDemo || isDraftingRole ? 'wait' : 'pointer',
                    }}
                  >
                    {isDraftingRole ? 'Drafting…' : roleOutline ? 'Regenerate AI outline' : 'Draft AI outline'}
                  </button>
                </div>
                {roleDraftError && (
                  <p role="alert" style={{ fontSize: '11px', color: '#DC2626', margin: '8px 0 0' }}>
                    {roleDraftError}
                  </p>
                )}
                {roleOutline && (
                  <div aria-live="polite" style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                    {roleOutline.milestones.map((milestone) => (
                      <article
                        key={milestone.position}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'var(--md-surface-variant)',
                          border: '1px solid var(--md-outline)',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                          Stage {milestone.position}: {milestone.title} ({milestone.effort_hours}h)
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--md-text-secondary)', marginTop: '2px' }}>
                          {milestone.skills.join(' · ')}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Target Completion Deadline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--md-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Target Completion
                </label>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-primary)' }}>
                  {selectedTimelinePreset === 'custom' ? 'Custom date' : `${selectedTimelinePreset} Months · ${totalDays}d`}
                </span>
              </div>

              <div
                className="career-timeline-presets"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                  gap: '5px',
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
                        padding: '7px 2px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid var(--md-primary)' : '1px solid var(--md-outline)',
                        background: isSelected ? 'var(--md-primary)' : 'var(--md-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--md-text-primary)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTimelinePreset('custom');
                    dateInputRef.current?.showPicker?.();
                  }}
                  style={{
                    padding: '7px 2px',
                    borderRadius: '8px',
                    border: selectedTimelinePreset === 'custom' ? '1.5px solid #D97706' : '1px solid var(--md-outline)',
                    background: selectedTimelinePreset === 'custom' ? '#D97706' : 'var(--md-surface)',
                    color: selectedTimelinePreset === 'custom' ? '#FFFFFF' : 'var(--md-text-primary)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                  }}
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
                  gap: '8px',
                  background: 'var(--md-surface)',
                  border: `1px solid ${selectedTimelinePreset === 'custom' ? '#D97706' : 'var(--md-outline)'}`,
                  borderRadius: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Calendar size={14} color={selectedTimelinePreset === 'custom' ? '#D97706' : 'var(--md-primary)'} />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)' }}>
                    {formatDisplayDate(targetDateStr)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                    ({totalWeeks.toFixed(1)} wks)
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-primary)', flexShrink: 0 }}>
                  Change
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  min={today}
                  value={targetDateStr}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Daily Study Commitment */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--md-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Daily Commitment
                </label>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>
                  {((dailyMinutes * 5) / 60).toFixed(1)} hrs / weekday
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
                {[30, 60, 90, 120].map((mins) => {
                  const isSelected = dailyMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDailyMinutes(mins)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid var(--md-primary)' : '1px solid var(--md-outline)',
                        background: isSelected ? 'var(--md-primary)' : 'var(--md-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--md-text-primary)',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={12} />
                      <span>{mins}m</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feasibility Card */}
            <div
              style={{
                background: isOverloaded ? 'rgba(220, 38, 38, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                border: `1px solid ${isOverloaded ? 'rgba(220, 38, 38, 0.3)' : 'rgba(5, 150, 105, 0.3)'}`,
                borderRadius: '12px',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                {isOverloaded ? (
                  <AlertTriangle size={14} color="#DC2626" />
                ) : (
                  <CheckCircle2 size={14} color="#059669" />
                )}
                <span style={{ fontSize: '12px', fontWeight: 700, color: isOverloaded ? '#DC2626' : '#047857' }}>
                  {isOverloaded ? 'Schedule Overload Warning' : 'Feasible Study Plan'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--md-text-secondary)', lineHeight: 1.45 }}>
                {isOverloaded ? (
                  <>
                    Requires ~<strong>{requiredDailyMinutes} mins/weekday</strong> across {totalDays} days. Extend your deadline or increase daily pace.
                  </>
                ) : (
                  <>
                    {totalEffortHours}h across {selectedRole.stages.length} stages in{' '}
                    <strong>{totalWeeks.toFixed(1)} weeks</strong> at {dailyMinutes} mins/weekday.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Clean Action Footer */}
        <footer
          className="career-modal-footer"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--md-outline)',
            background: 'var(--md-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--md-text-secondary)', fontWeight: 500 }}>
            Plan: <strong style={{ color: 'var(--md-text-primary)' }}>{selectedRole.title}</strong> · {totalEffortHours}h · {dailyMinutes}m/day
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '9999px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface)',
                color: 'var(--md-text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-m3-primary"
              style={{ padding: '9px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              <span>Apply Career Roadmap</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
