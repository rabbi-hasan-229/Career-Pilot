import React from 'react';
import { Home, CalendarDays, Plus, PieChart, Bot } from 'lucide-react';
import type { ActiveNavTab } from '../types';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChangeTab, onOpenQuickAction }) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Workspace navigation">
      {/* 1. Daily Roadmap */}
      <button
        className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        aria-current={activeTab === 'home' ? 'page' : undefined}
        onClick={() => onChangeTab('home')}
      >
        <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span>Roadmap</span>
      </button>

      {/* 2. Schedule */}
      <button
        className={`mobile-nav-btn ${activeTab === 'plan' ? 'active' : ''}`}
        aria-current={activeTab === 'plan' ? 'page' : undefined}
        onClick={() => onChangeTab('plan')}
      >
        <CalendarDays size={20} strokeWidth={activeTab === 'plan' ? 2.5 : 2} />
        <span>Schedule</span>
      </button>

      {/* 3. Center Action Button */}
      <button
        className="mobile-fab-center"
        onClick={onOpenQuickAction}
        title="Quick Actions & Re-plan"
        aria-label="Open quick actions and re-plan"
        style={{
          background: 'var(--md-primary)',
          boxShadow: '0 4px 14px rgba(18, 60, 105, 0.35)',
        }}
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>

      {/* 4. Stats */}
      <button
        className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        aria-current={activeTab === 'overview' ? 'page' : undefined}
        onClick={() => onChangeTab('overview')}
      >
        <PieChart size={20} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
        <span>Pacing</span>
      </button>

      {/* 5. Coach */}
      <button
        className={`mobile-nav-btn ${activeTab === 'coach' ? 'active' : ''}`}
        aria-current={activeTab === 'coach' ? 'page' : undefined}
        onClick={() => onChangeTab('coach')}
      >
        <Bot size={20} strokeWidth={activeTab === 'coach' ? 2.5 : 2} />
        <span>Coach</span>
      </button>
    </nav>
  );
};
