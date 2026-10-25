import React, { useState, useMemo, useRef } from 'react';
import {
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
  X,
} from 'lucide-react';
import { authService } from '../auth/authService';
import { notificationService } from '../notifications/notificationService';
import {
  comprehensiveCareerCatalog,
  getOrCreateCareerBlueprint,
} from '../roadmap/careerCatalog';
import type { CareerOption } from '../roadmap/careerCatalog';
import type { Profile } from '../../types';

interface Props {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

const PRESET_TIMELINES = [
  { label: '3 Mo', months: 3, fullLabel: '3 Months (Fast Track)' },
  { label: '6 Mo', months: 6, fullLabel: '6 Months (Recommended Standard)' },
  { label: '9 Mo', months: 9, fullLabel: '9 Months (Steady Pace)' },
  { label: '12 Mo', months: 12, fullLabel: '12 Months (1 Year Comprehensive)' },
  { label: '18+ Mo', months: 18, fullLabel: '18 Months (Extended Mastery)' },
];

function calculateTargetDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export const OnboardingGoalModal: React.FC<Props> = ({ profile, onComplete }) => {
  const [selectedSlug, setSelectedSlug] = useState(
    profile.target_role
      ? profile.target_role.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'serverless-application-engineer'
  );
  const [dailyMinutes, setDailyMinutes] = useState(profile.daily_minutes || 60);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Timeline preset: 3, 6, 9, 12, 18 months or 'custom'
  const [selectedTimelinePreset, setSelectedTimelinePreset] = useState<number | 'custom'>(() => {
    if (profile.target_timeline_months && [3, 6, 9, 12, 18].includes(profile.target_timeline_months)) {
      return profile.target_timeline_months;
    }
    return 6;
  });

  // Target completion date string (ISO 'YYYY-MM-DD')
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

  const selectedRole = useMemo(() => {
    return getOrCreateCareerBlueprint(selectedSlug);
  }, [selectedSlug]);

  const { totalDays, totalWeeks, totalEffortHours, isOverloaded, requiredDailyMinutes } = useMemo(() => {
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const days = Math.max(14, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const weeks = days / 7;
    const effort = selectedRole.effortHours;
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
  }, [targetDateStr, selectedRole.effortHours, dailyMinutes]);

  const handleFinish = async () => {
    try {
      await notificationService.requestPermission();
    } catch {}

    const calculatedMonths =
      typeof selectedTimelinePreset === 'number'
        ? selectedTimelinePreset
        : Math.max(1, Math.round(totalDays / 30));

    const updated = authService.saveOnboardingGoal(profile, {
      target_role: selectedRole.title,
      target_timeline_months: calculatedMonths,
      target_completion_date: targetDateStr,
      daily_minutes: dailyMinutes,
      experience_level: 'junior',
    });

    onComplete(updated);
  };

  const formatDisplayDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()] || 'Jan';
      const year = d.getFullYear();
      return `${day} - ${month} - ${year}`;
    } catch {
      return isoStr;
    }
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
        zIndex: 2000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="career-path-window"
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
      >
        {/* Left Mountain Panel (Desktop) */}
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
            alt="Career path mountains"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        </div>

        {/* Right Panel */}
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
            {/* Top Bar */}
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
                  Career Roadmaps
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
                  Browse 200+ tech roadmaps with zero-cost math engine
                </div>
              </div>

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
                  placeholder="Search 200+ careers (e.g. Next.js, DevOps, AI)..."
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

            {/* Role Cards Grid */}
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
                const isSelected = selectedRole.slug === role.slug;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedSlug(role.slug)}
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
                        {role.effortHours}h · {role.stages.length} stages
                      </span>
                      <ChevronRight size={14} color={isSelected ? '#2563EB' : '#94A3B8'} />
                    </div>
                  </div>
                );
              })}
            </div>

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
                    min={new Date().toISOString().split('T')[0]}
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
            onClick={handleFinish}
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
