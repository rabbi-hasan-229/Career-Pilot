import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Sparkles,
  Compass,
  Search,
  ChevronRight,
  Code2,
  Cloud,
  Database,
  Monitor,
  Shield,
  Smartphone,
  Gamepad2,
  BookOpen,
  BarChart3,
  Trophy,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  comprehensiveCareerCatalog,
  getOrCreateCareerBlueprint,
} from '../features/roadmap/careerCatalog';
import type { CareerOption } from '../features/roadmap/careerCatalog';
import { generateRoadmapForRole } from '../features/roadmap/plannerEngine';
import type { Milestone } from '../types';

interface Props {
  currentRoleSlug: string;
  onClose: () => void;
  onSelectNewPlan: (
    roleTitle: string,
    targetDate: string,
    dailyMinutes: number,
    milestones: Milestone[]
  ) => void;
}

export const RoleQuestSelectorModal: React.FC<Props> = ({
  currentRoleSlug,
  onClose,
  onSelectNewPlan,
}) => {
  const [selectedSlug, setSelectedSlug] = useState(
    currentRoleSlug || 'serverless-application-engineer'
  );
  const [dailyMinutes, setDailyMinutes] = useState(60);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Default target date: 90 days from now (lazy initialized)
  const [targetDateStr, setTargetDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

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

  const handleConfirm = () => {
    const months = Math.max(1, Math.round(totalDays / 30));
    const milestones = generateRoadmapForRole(selectedRole.title, months, dailyMinutes);
    onSelectNewPlan(selectedRole.title, targetDateStr, dailyMinutes, milestones);
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* LEFT PANEL: MOUNTAIN SCENIC & EXPLORE/LEARN/GROW PILLS   */}
        {/* ======================================================== */}
        <div
          className="career-path-left-panel"
          style={{
            width: '260px',
            position: 'relative',
            background: '#0B1E38',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px 22px',
            boxSizing: 'border-box',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Background Mountain Image */}
          <img
            src="/assets/career-mountain-desktop.png"
            alt="Career road scenic"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1,
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(11, 30, 56, 0.5) 0%, rgba(11, 30, 56, 0.1) 40%, rgba(11, 30, 56, 0.8) 100%)',
              zIndex: 2,
            }}
          />

          {/* Top Branding */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: '#0F2744',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Compass size={18} strokeWidth={2.4} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Career Roadmaps</div>
            </div>
            <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
              Plan today,
              <br />
              build tomorrow.
            </div>
          </div>

          {/* Middle: Floating White Pills along Road (Explore, Learn, Grow) */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingLeft: '14px',
            }}
          >
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                borderRadius: '9999px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0F172A',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
              }}
            >
              <BookOpen size={14} color="#1D68F2" />
              <span>Explore</span>
            </div>

            <div
              style={{
                alignSelf: 'flex-start',
                marginLeft: '18px',
                background: '#FFFFFF',
                borderRadius: '9999px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0F172A',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
              }}
            >
              <BarChart3 size={14} color="#1D68F2" />
              <span>Learn</span>
            </div>

            <div
              style={{
                alignSelf: 'flex-start',
                marginLeft: '36px',
                background: '#FFFFFF',
                borderRadius: '9999px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#0F172A',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
              }}
            >
              <Trophy size={14} color="#1D68F2" />
              <span>Grow</span>
            </div>
          </div>

          {/* Bottom Slogan */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              200+ Tech Careers
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>
              One Learning Path
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>
              A Brighter Future
            </div>
          </div>
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
                gridTemplateColumns: '1.1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Target Completion Deadline */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Target Completion Deadline
                </label>
                <div
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Calendar size={16} color="#2563EB" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                    {formatDisplayDate(targetDateStr)}
                  </span>
                  <Calendar size={16} color="#94A3B8" />

                  {/* Hidden Native Date Input */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={targetDateStr}
                    onChange={(e) => setTargetDateStr(e.target.value)}
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
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Daily Study Commitment
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                          border: 'none',
                          background: isSelected ? '#0F2744' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {mins}m
                      </button>
                    );
                  })}
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
