import React, { useState } from 'react';
import { ArrowLeft, BarChart2, Star, ChevronDown } from 'lucide-react';
import { sounds } from '../lib/sound';

interface Props {
  onBack?: () => void;
  isDesktopEmbedded?: boolean;
}

export const AnalyticsView: React.FC<Props> = ({ onBack, isDesktopEmbedded = false }) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'month'>('weekly');

  // Exact bar colors and heights matching Screen 2 in reference image
  const days = [
    { day: 'Sun', height: 52, color: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' }, // Golden yellow
    { day: 'Mon', height: 35, color: 'linear-gradient(180deg, #d97706 0%, #b45309 100%)' }, // Dark caramel brown
    { day: 'Tue', height: 68, color: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' }, // Golden yellow
    { day: 'Wed', height: 100, color: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)' }, // Tallest caramel brown
    { day: 'Thr', height: 82, color: 'linear-gradient(180deg, #d97706 0%, #b45309 100%)' }, // Tall caramel brown
    { day: 'Fri', height: 42, color: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' }, // Golden yellow
    { day: 'Sat', height: 58, color: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' }, // Golden yellow
  ];

  return (
    <div style={{ padding: isDesktopEmbedded ? '0' : '20px 16px 36px 16px' }}>
      {/* Top Header Pill Group (Only on mobile or when not embedded) */}
      {!isDesktopEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <button
            className="btn-wood btn-wood-round"
            style={{ width: '40px', height: '40px' }}
            onClick={() => { sounds.playWoodClick(); onBack?.(); }}
          >
            <ArrowLeft size={18} />
          </button>

          <div
            style={{
              background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #d97706',
              borderRadius: '9999px',
              padding: '6px 22px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '13px',
              color: '#78350f',
              boxShadow: '0 2px 0 #b45309',
            }}
          >
            Analytics
          </div>

          <button
            className="btn-wood btn-wood-round"
            style={{ width: '40px', height: '40px' }}
            onClick={() => sounds.playWoodClick()}
          >
            <BarChart2 size={18} />
          </button>
        </div>
      )}

      {/* Title & Filter Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
          Progress
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(180deg, #fed7aa 0%, #fdba74 100%)',
            border: '2px solid #ea580c',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#7c2d12',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #c2410c',
          }}
          onClick={() => sounds.playWoodClick()}
        >
          <span>All Subject</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Main Analytics Floating White Card (Exact match to reference Screen 2) */}
      <div
        className="analytics-card"
        style={{
          background: '#ffffff',
          borderRadius: '32px',
          padding: '20px 18px',
          border: '3px solid #fef3c7',
          boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.12), 0 4px 0 #fde68a',
          marginBottom: '18px',
        }}
      >
        {/* Card Header Row: Bar icon on left, Toggle pill on right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 100%)',
              border: '2px solid #d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 0 #b45309',
            }}
          >
            <BarChart2 size={18} color="#78350f" />
          </div>

          {/* Weekly / Month Toggle Pill */}
          <div
            style={{
              background: '#f1f5f9',
              borderRadius: '9999px',
              padding: '3px',
              display: 'flex',
              border: '1.5px solid #e2e8f0',
            }}
          >
            <button
              onClick={() => { sounds.playWoodClick(); setTimeframe('weekly'); }}
              style={{
                border: 'none',
                background: timeframe === 'weekly' ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: timeframe === 'weekly' ? '#ffffff' : '#64748b',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: timeframe === 'weekly' ? '0 2px 0 #78350f' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Weekly
            </button>
            <button
              onClick={() => { sounds.playWoodClick(); setTimeframe('month'); }}
              style={{
                border: 'none',
                background: timeframe === 'month' ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: timeframe === 'month' ? '#ffffff' : '#64748b',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: timeframe === 'month' ? '0 2px 0 #78350f' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Month
            </button>
          </div>
        </div>

        {/* Big Metric Numbers: 48 Lessons & 12 Hours */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              48 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Lessons</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              12 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>Hours</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization with 7 alternating bars */}
        <div className="chart-bars-container" style={{ display: 'flex', alignItems: 'flex-end', height: '170px', gap: '8px', paddingTop: '16px' }}>
          {days.map((item) => (
            <div key={item.day} className="bar-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '30px',
                  height: `${item.height}%`,
                  borderRadius: '16px',
                  background: item.color,
                  boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.4)',
                  transition: 'height 0.4s ease',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof / Student Rating Card (Matching Screen 2) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '16px 18px',
          border: '2.5px solid #fef3c7',
          boxShadow: '0 4px 0 #fde68a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 100%)',
              border: '2px solid #d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 0 #b45309',
            }}
          >
            <Star size={20} color="#78350f" fill="#78350f" />
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              Rating of students
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
              55k+ trusted student
            </span>
          </div>
        </div>

        {/* 3 Overlapping Cute Student Avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60',
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=60',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60',
          ].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="student"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                marginLeft: i > 0 ? '-8px' : '0',
                objectFit: 'cover',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
