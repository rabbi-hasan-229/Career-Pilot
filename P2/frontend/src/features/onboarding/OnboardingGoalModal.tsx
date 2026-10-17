import React, { useState, useMemo } from 'react';
import { Compass, Calendar, Clock, Award, ArrowRight, Check, Bell, Search, X } from 'lucide-react';
import { authService } from '../auth/authService';
import { notificationService } from '../notifications/notificationService';
import { comprehensiveCareerCatalog, careerCategories } from '../roadmap/careerCatalog';
import type { CareerOption } from '../roadmap/careerCatalog';
import type { Profile } from '../../types';

interface Props {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

const timelineOptions = [
  { months: 3, label: '3 Months', sub: 'Fast Track (12 wks)' },
  { months: 6, label: '6 Months', sub: 'Balanced (26 wks)' },
  { months: 9, label: '9 Months', sub: 'Deep Dive (38 wks)' },
  { months: 12, label: '12 Months', sub: 'Steady Shift (52 wks)' },
];

const commitmentOptions = [
  { mins: 30, label: '30m / day', sub: '3.5 hrs/wk' },
  { mins: 60, label: '60m / day', sub: '7 hrs/wk' },
  { mins: 90, label: '90m / day', sub: '10.5 hrs/wk' },
  { mins: 120, label: '2h / day', sub: '14 hrs/wk' },
];

const levelOptions: { id: 'beginner' | 'switcher' | 'junior' | 'mid'; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Starting from fundamentals' },
  { id: 'switcher', label: 'Career Switcher', desc: 'Transitioning from non-tech' },
  { id: 'junior', label: 'Junior', desc: 'Advancing toward mid-level' },
];

export const OnboardingGoalModal: React.FC<Props> = ({ profile, onComplete }) => {
  const [selectedRole, setSelectedRole] = useState(profile.target_role || 'Full Stack Engineer');
  const [customRole, setCustomRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timelineMonths, setTimelineMonths] = useState(profile.target_timeline_months || 6);
  const [dailyMinutes, setDailyMinutes] = useState(profile.daily_minutes || 60);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'switcher' | 'junior' | 'mid'>('junior');
  const [enableNotifications, setEnableNotifications] = useState(true);

  const activeRoleTitle = customRole.trim() || selectedRole;

  // Filter careers across 200+ options
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

  const handleFinish = async () => {
    if (enableNotifications) {
      await notificationService.requestPermission();
    }

    const updated = authService.saveOnboardingGoal(profile, {
      target_role: activeRoleTitle,
      target_timeline_months: timelineMonths,
      daily_minutes: dailyMinutes,
      experience_level: experienceLevel,
    });

    onComplete(updated);
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
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--md-surface, #FFFFFF)',
          borderRadius: '28px',
          padding: '24px 22px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--md-outline, #E2E8F0)',
          color: 'var(--md-text-primary, #1E293B)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#8EA95B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto',
              boxShadow: '0 6px 16px rgba(142, 169, 91, 0.35)',
            }}
          >
            <Compass size={22} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Set Your Career Goal
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
            Choose from 200+ curated tech careers. We customize your daily roadmap.
          </p>
        </div>

        {/* Section 1: Career Role Quest */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Choose Target Career ({filteredCareers.length} available)
            </label>
            {activeRoleTitle && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#5C7433', background: 'rgba(142, 169, 91, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                Selected: {activeRoleTitle}
              </span>
            )}
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '8px',
            }}
          >
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search 200+ careers (e.g. Rust, Cloud, AI, iOS, Quant, Design)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                width: '100%',
                color: '#1E293B',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Horizontal Scroll */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '6px',
              marginBottom: '10px',
              scrollbarWidth: 'none',
            }}
          >
            {careerCategories.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isCatActive ? '#8EA95B' : '#E2E8F0'}`,
                    background: isCatActive ? '#8EA95B' : '#FFFFFF',
                    color: isCatActive ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Career Cards Scrollable Grid */}
          <div
            style={{
              maxHeight: '185px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              paddingRight: '4px',
              marginBottom: '8px',
            }}
          >
            {filteredCareers.map((role) => {
              const isSelected = selectedRole === role.title && !customRole;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.title);
                    setCustomRole('');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: `1.5px solid ${isSelected ? '#8EA95B' : '#E2E8F0'}`,
                    background: isSelected ? 'rgba(142, 169, 91, 0.1)' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
                    <strong style={{ fontSize: '12px', color: isSelected ? '#5C7433' : '#1E293B', lineHeight: 1.25 }}>
                      {role.title}
                    </strong>
                    {isSelected && <Check size={14} color="#8EA95B" strokeWidth={3} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748B' }}>
                      {role.category}
                    </span>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#8EA95B', background: 'rgba(142, 169, 91, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                      {role.effortHours}h
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredCareers.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '16px', color: '#64748B', fontSize: '12px' }}>
                No careers matched "{searchQuery}". Type a custom title below!
              </div>
            )}
          </div>

          {/* Custom Role Input Fallback */}
          <input
            type="text"
            placeholder="Or type any custom career role (e.g. Quantum Algorithm Engineer)..."
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '12px',
              border: `1px solid ${customRole ? '#8EA95B' : '#E2E8F0'}`,
              background: '#FFFFFF',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Section 2: Time to Achieve It */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Calendar size={13} color="#8EA95B" />
            2. Time to Achieve It
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {timelineOptions.map((opt) => {
              const isSelected = timelineMonths === opt.months;
              return (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setTimelineMonths(opt.months)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? '#8EA95B' : '#E2E8F0'}`,
                    background: isSelected ? '#8EA95B' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#1E293B',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ fontSize: '12px', display: 'block' }}>{opt.label}</strong>
                  <span style={{ fontSize: '9.5px', opacity: isSelected ? 0.9 : 0.7 }}>{opt.sub.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Daily Commitment */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Clock size={13} color="#8EA95B" />
            3. Daily Commitment
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {commitmentOptions.map((opt) => {
              const isSelected = dailyMinutes === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setDailyMinutes(opt.mins)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? '#8EA95B' : '#E2E8F0'}`,
                    background: isSelected ? '#8EA95B' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#1E293B',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ fontSize: '12px', display: 'block' }}>{opt.label}</strong>
                  <span style={{ fontSize: '9.5px', opacity: isSelected ? 0.9 : 0.7 }}>{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Experience Level */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Award size={13} color="#8EA95B" />
            4. Current Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {levelOptions.map((lvl) => {
              const isSelected = experienceLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperienceLevel(lvl.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isSelected ? '#8EA95B' : '#E2E8F0'}`,
                    background: isSelected ? 'rgba(142, 169, 91, 0.1)' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ fontSize: '11.5px', color: isSelected ? '#5C7433' : '#1E293B', display: 'block' }}>
                    {lvl.label}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Push Notification Opt-in */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={18} color="#F97316" />
            <div>
              <strong style={{ fontSize: '12px', display: 'block', color: '#1E293B' }}>
                Daily Reminder Push
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Notify me if I have uncompleted roadmap tasks today.
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enableNotifications}
            onClick={() => setEnableNotifications(!enableNotifications)}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '9999px',
              background: enableNotifications ? '#FED7AA' : '#E2E8F0',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: enableNotifications ? '20px' : '2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: enableNotifications ? '#F97316' : '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleFinish}
          style={{
            width: '100%',
            background: '#8EA95B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '14.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(142, 169, 91, 0.35)',
            transition: 'background 0.15s ease',
          }}
        >
          Launch My Career Roadmap
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};
