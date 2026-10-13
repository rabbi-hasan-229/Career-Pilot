import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, Sparkles, Compass } from 'lucide-react';
import { availableRoles, calculateProportionalPlan } from '../lib/plannerEngine';
import type { Milestone } from '../types';

interface Props {
  currentRoleSlug: string;
  onClose: () => void;
  onSelectNewPlan: (roleTitle: string, targetDate: string, dailyMinutes: number, milestones: Milestone[]) => void;
}

export const RoleQuestSelectorModal: React.FC<Props> = ({ currentRoleSlug, onClose, onSelectNewPlan }) => {
  const [selectedSlug, setSelectedSlug] = useState(currentRoleSlug);
  const [dailyMinutes, setDailyMinutes] = useState(60);

  // Default target date: 60 days from now
  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 60);
  const [targetDateStr, setTargetDateStr] = useState(defaultTargetDate.toISOString().split('T')[0]);

  // Real-time deterministic calculation using mathematical formulas
  const planResult = calculateProportionalPlan(selectedSlug, targetDateStr, dailyMinutes);
  const selectedRole = availableRoles.find((r) => r.slug === selectedSlug) || availableRoles[0];

  const handleConfirm = () => {
    onSelectNewPlan(selectedRole.title, targetDateStr, dailyMinutes, planResult.milestones);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="m3-surface-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline)',
          color: 'var(--md-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--md-violet-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--md-text-primary)' }}>
                Select Career Roadmap
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                Proportional math engine ($0 AI cost)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--md-surface-variant)',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Cards */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            SELECT TARGET ROLE
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableRoles.map((role) => {
              const isSelected = selectedSlug === role.slug;
              return (
                <div
                  key={role.slug}
                  onClick={() => setSelectedSlug(role.slug)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--md-outline)'}`,
                    background: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)' }}>
                      {role.title}
                    </h4>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
                      {role.effortHours} Hours Effort · {role.zones.length} Milestones
                    </span>
                  </div>
                  {isSelected && <CheckCircle size={18} color="#6366f1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Deadline Input */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            TARGET COMPLETION DEADLINE
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '12px',
              padding: '10px 14px',
            }}
          >
            <Calendar size={18} color="var(--md-text-secondary)" />
            <input
              type="date"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '13.5px',
                color: 'var(--md-text-primary)',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Daily Minutes Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            DAILY STUDY COMMITMENT
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[30, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                style={{
                  padding: '9px 0',
                  borderRadius: '10px',
                  border: `1.5px solid ${dailyMinutes === mins ? '#6366f1' : 'var(--md-outline)'}`,
                  background: dailyMinutes === mins ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: dailyMinutes === mins ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Display */}
        <div
          style={{
            background: planResult.isOverloaded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1.5px solid ${planResult.isOverloaded ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {planResult.isOverloaded ? (
              <>
                <AlertTriangle size={16} color="#ef4444" />
                <strong style={{ fontSize: '13px', color: '#ef4444' }}>Schedule Overload Warning</strong>
              </>
            ) : (
              <>
                <Sparkles size={16} color="#10b981" />
                <strong style={{ fontSize: '13px', color: '#10b981' }}>Feasible Study Plan</strong>
              </>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--md-text-primary)', lineHeight: 1.4, margin: 0 }}>
            {planResult.isOverloaded ? (
              <>
                Total effort is {planResult.totalEffortHours}h across {planResult.totalDays} days. You need at least{' '}
                <strong>{planResult.requiredDailyMinutes} mins/day</strong>. Consider pushing the deadline back.
              </>
            ) : (
              <>
                Proportional math allocates <strong>{planResult.totalWeeks.toFixed(1)} weeks</strong> across{' '}
                {planResult.milestones.length} milestones at {dailyMinutes} mins/weekday. Zero AI cost!
              </>
            )}
          </p>
        </div>

        {/* Embark Button */}
        <button
          className="btn-m3-primary"
          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          onClick={handleConfirm}
        >
          Apply This Career Roadmap
        </button>
      </div>
    </div>
  );
};
