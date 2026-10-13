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
    <nav className="mobile-bottom-nav" aria-label="Bottom Navigation">
      {/* 1. Home */}
      <button
        className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onChangeTab('home')}
      >
        <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span>Home</span>
      </button>

      {/* 2. Plan / Roadmap */}
      <button
        className={`mobile-nav-btn ${activeTab === 'plan' ? 'active' : ''}`}
        onClick={() => onChangeTab('plan')}
      >
        <CalendarDays size={22} strokeWidth={activeTab === 'plan' ? 2.5 : 2} />
        <span>Plan</span>
      </button>

      {/* 3. Center FAB: Plus Quick Action (Matching Image 2 Left Screen) */}
      <button
        className="mobile-fab-center"
        onClick={onOpenQuickAction}
        title="Quick Action / Reschedule"
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

      {/* 4. Progress / Overview */}
      <button
        className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => onChangeTab('overview')}
      >
        <PieChart size={22} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
        <span>Progress</span>
      </button>

      {/* 5. AI Assistant / Coach */}
      <button
        className={`mobile-nav-btn ${activeTab === 'coach' ? 'active' : ''}`}
        onClick={() => onChangeTab('coach')}
      >
        <Bot size={22} strokeWidth={activeTab === 'coach' ? 2.5 : 2} />
        <span>Coach</span>
      </button>
    </nav>
  );
};
