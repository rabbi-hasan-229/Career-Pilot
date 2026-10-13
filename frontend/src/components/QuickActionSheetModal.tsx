import React from 'react';
import {
  X,
  Mic2,
  FileText,
  TrendingUp,
  Compass,
  ArrowRight,
} from 'lucide-react';
import type { ActiveNavTab } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenRoleModal: () => void;
  onQuickReplan: (action: 'behind' | 'early' | 'pause') => void;
}

export const QuickActionSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenRoleModal,
  onQuickReplan,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--md-surface)',
          borderTop: '1px solid var(--md-outline)',
          borderLeft: '1px solid var(--md-outline)',
          borderRight: '1px solid var(--md-outline)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
          boxSizing: 'border-box',
          maxHeight: '85vh',
          overflowY: 'auto',
          color: 'var(--md-text-primary)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle pill */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--md-outline-variant)',
            borderRadius: '9999px',
            margin: '0 auto 16px auto',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0 }}>
              Quick Accelerators & Actions
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              Instant zero-cost planner & career tools
            </span>
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

        {/* Section: Career Accelerators */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Career Accelerator Tools
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button
              onClick={() => {
                onSelectTab('interview');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--md-primary-container)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
                  <Mic2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                    Mock Interview Simulator
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                    Keyword & STAR rubric check ($0 cost)
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--md-text-muted)" />
            </button>

            <button
              onClick={() => {
                onSelectTab('cv');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--md-primary-container)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                    CV & Resume Builder
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                    Step-by-step wizard & live PDF export
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--md-text-muted)" />
            </button>

            <button
              onClick={() => {
                onSelectTab('skills');
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--md-primary-container)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                    Skill-Gap & Job Matches
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--md-text-secondary)' }}>
                    Compare against live industry vacancies in SQL
                  </div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--md-text-muted)" />
            </button>
          </div>
        </div>

        {/* Section: One-Touch Planner Rescheduling */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--md-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Instant Planner Adjustments (Docx Section 6)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => {
                onQuickReplan('behind');
                onClose();
              }}
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '10px',
                padding: '10px 8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              "I'm Behind" (+3d)
            </button>
            <button
              onClick={() => {
                onQuickReplan('early');
                onClose();
              }}
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '10px',
                padding: '10px 8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              "Finished Early"
            </button>
            <button
              onClick={() => {
                onQuickReplan('pause');
                onClose();
              }}
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '10px',
                padding: '10px 8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--md-text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              "Pause a Week"
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenRoleModal();
            }}
            style={{
              width: '100%',
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--md-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Compass size={16} /> Change Career Goal or Target Date
          </button>
        </div>
      </div>
    </div>
  );
};
