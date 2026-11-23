import React from 'react';
import { Home, CalendarDays, LayoutGrid, PieChart, Bot } from 'lucide-react';
import type { ActiveNavTab } from '../types';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChangeTab, onOpenQuickAction }) => {
  const isToolsActive =
    activeTab === 'interview' || activeTab === 'cv' || activeTab === 'skills' || activeTab === 'experts' || activeTab === 'profile';

  return (
    <nav className="mobile-bottom-nav" aria-label="Workspace navigation">
      {/* 1. Daily Roadmap */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        aria-current={activeTab === 'home' ? 'page' : undefined}
        onClick={() => onChangeTab('home')}
      >
        <Home size={19} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span>Roadmap</span>
      </button>

      {/* 2. Schedule */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'plan' ? 'active' : ''}`}
        aria-current={activeTab === 'plan' ? 'page' : undefined}
        onClick={() => onChangeTab('plan')}
      >
        <CalendarDays size={19} strokeWidth={activeTab === 'plan' ? 2.5 : 2} />
        <span>Schedule</span>
      </button>

      {/* 3. Tools & All Feature Pages */}
      <button
        type="button"
        className={`mobile-nav-btn mobile-nav-tools-btn ${isToolsActive ? 'active' : ''}`}
        onClick={onOpenQuickAction}
        title="Open Career Tools & Feature Pages"
        aria-label="Open career tools and feature pages"
      >
        <LayoutGrid size={19} strokeWidth={isToolsActive ? 2.5 : 2} />
        <span>Tools</span>
      </button>

      {/* 4. Stats */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        aria-current={activeTab === 'overview' ? 'page' : undefined}
        onClick={() => onChangeTab('overview')}
      >
        <PieChart size={19} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
        <span>Analytics</span>
      </button>

      {/* 5. Coach */}
      <button
        type="button"
        className={`mobile-nav-btn ${activeTab === 'coach' ? 'active' : ''}`}
        aria-current={activeTab === 'coach' ? 'page' : undefined}
        onClick={() => onChangeTab('coach')}
      >
        <Bot size={19} strokeWidth={activeTab === 'coach' ? 2.5 : 2} />
        <span>AI Coach</span>
      </button>
    </nav>
  );
};
