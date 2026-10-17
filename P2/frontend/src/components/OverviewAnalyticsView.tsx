import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, BookOpen, Target, Flame } from 'lucide-react';

interface Props {
  onBack?: () => void;
  isDesktopEmbedded?: boolean;
}

export const OverviewAnalyticsView: React.FC<Props> = ({ onBack, isDesktopEmbedded = false }) => {
  const [timeTab, setTimeTab] = useState<'Day' | 'Week' | 'Month' | 'All Time'>('Week');

  return (
    <div>
      {/* 1. Header (When not embedded in desktop command view) */}
      {!isDesktopEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-primary)',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>Overview</h2>

          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-primary)',
            }}
          >
            <Calendar size={18} />
          </button>
        </div>
      )}

      {/* 2. Filter Pills: Day / Week / Month / All Time */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="m3-tab-pill-group">
          {(['Day', 'Week', 'Month', 'All Time'] as const).map((tab) => (
            <button
              key={tab}
              className={`m3-tab-pill ${timeTab === tab ? 'active' : ''}`}
              onClick={() => setTimeTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 4-Metrics Grid (Matching Image 2 Right Screen) */}
      <div className="m3-metrics-grid-4">
        {/* Metric 1 */}
        <div className="m3-stat-card">
          <div className="m3-stat-header">
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--md-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Clock size={15} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>+18%</span>
          </div>
          <span className="m3-stat-val">12h 45m</span>
          <span className="m3-stat-lbl">Study Time</span>
        </div>

        {/* Metric 2 */}
        <div className="m3-stat-card">
          <div className="m3-stat-header">
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <BookOpen size={15} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>+12%</span>
          </div>
          <span className="m3-stat-val">18</span>
          <span className="m3-stat-lbl">Sessions</span>
        </div>

        {/* Metric 3 */}
        <div className="m3-stat-card">
          <div className="m3-stat-header">
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Target size={15} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>+15%</span>
          </div>
          <span className="m3-stat-val">86</span>
          <span className="m3-stat-lbl">Focus Score</span>
        </div>

        {/* Metric 4 */}
        <div className="m3-stat-card">
          <div className="m3-stat-header">
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Flame size={15} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c' }}>Active</span>
          </div>
          <span className="m3-stat-val">7</span>
          <span className="m3-stat-lbl">Streak Days</span>
        </div>
      </div>

      {/* 4. Study Time (Hours) Smooth Area Chart Card */}
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
            Study Time (Hours)
          </h3>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>•••</span>
        </div>

        {/* Smooth SVG Area Chart */}
        <div style={{ width: '100%', height: '160px', position: 'relative' }}>
          {/* 2.5h Peak Badge */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '66%',
              transform: 'translateX(-50%)',
              background: '#6366f1',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            2.5 Hours
          </div>

          <svg viewBox="0 0 360 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="20" y1="20" x2="340" y2="20" stroke="var(--md-outline)" strokeWidth="1" />
            <line x1="20" y1="55" x2="340" y2="55" stroke="var(--md-outline)" strokeWidth="1" />
            <line x1="20" y1="90" x2="340" y2="90" stroke="var(--md-outline)" strokeWidth="1" />

            {/* Area Fill */}
            <path
              d="M 30 110 Q 75 90, 125 75 T 200 70 T 260 25 T 310 35 L 310 120 L 30 120 Z"
              fill="url(#chartGradient)"
            />

            {/* Smooth Line */}
            <path
              d="M 30 110 Q 75 90, 125 75 T 200 70 T 260 25 T 310 35"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {[
              { cx: 30, cy: 110 },
              { cx: 80, cy: 95 },
              { cx: 130, cy: 75 },
              { cx: 180, cy: 70 },
              { cx: 235, cy: 25 },
              { cx: 280, cy: 30 },
              { cx: 310, cy: 35 },
            ].map((pt, i) => (
              <circle
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                r={i === 4 ? 5 : 3.5}
                fill={i === 4 ? '#6366f1' : 'var(--md-surface)'}
                stroke="#6366f1"
                strokeWidth="2.5"
              />
            ))}
          </svg>

          {/* Days labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)', marginTop: '4px' }}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span style={{ color: '#6366f1', fontWeight: 800 }}>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
        </div>
      </div>

      {/* 5. Subject Breakdown Donut Ring Card */}
      <div className="m3-surface-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
            Subject Breakdown
          </h3>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>•••</span>
        </div>

        {/* Donut Chart with Center Label */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', margin: '14px 0' }}>
          <svg width="150" height="150" viewBox="0 0 100 100">
            {/* Segment 1: Data Structures (Purple) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#6366f1"
              strokeWidth="9"
              strokeDasharray="95 144"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Segment 2: Discrete Math (Pink/Magenta) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#d946ef"
              strokeWidth="9"
              strokeDasharray="65 174"
              strokeDashoffset="-100"
              strokeLinecap="round"
            />
            {/* Segment 3: Problem Solving (Emerald) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="9"
              strokeDasharray="55 184"
              strokeDashoffset="-170"
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', display: 'block' }}>
              12h 45m
            </span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--md-text-muted)' }}>
              Total
            </span>
          </div>
        </div>

        {/* Legend Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--md-outline)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Structura</span>
            </div>
            <strong style={{ fontSize: '12px', color: 'var(--md-text-primary)' }}>4h 30m</strong>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d946ef' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Discrete</span>
            </div>
            <strong style={{ fontSize: '12px', color: 'var(--md-text-primary)' }}>3h 00m</strong>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)' }}>Solvify</span>
            </div>
            <strong style={{ fontSize: '12px', color: 'var(--md-text-primary)' }}>2h 45m</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
