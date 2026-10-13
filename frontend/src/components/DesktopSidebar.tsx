import React from 'react';
import {
  Home,
  Calendar,
  PieChart,
  Bot,
  Sparkles,
  Compass,
  Mic2,
  FileText,
  TrendingUp,
  Moon,
  Sun,
  Settings,
} from 'lucide-react';
import type { ActiveNavTab, Profile } from '../types';
import type { ThemeMode } from '../lib/theme';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  profile: Profile;
  onOpenRoleModal: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const DesktopSidebar: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  profile,
  onOpenRoleModal,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const coreNavItems = [
    { id: 'home' as ActiveNavTab, label: "Today's Plan", icon: Home },
    { id: 'plan' as ActiveNavTab, label: 'Roadmap & Schedule', icon: Calendar },
    { id: 'overview' as ActiveNavTab, label: 'Overview & Stats', icon: PieChart },
    { id: 'coach' as ActiveNavTab, label: 'StudyZen AI Coach', icon: Bot },
  ];

  const careerAccelerators = [
    { id: 'interview' as ActiveNavTab, label: 'Interview Simulator', icon: Mic2 },
    { id: 'cv' as ActiveNavTab, label: 'CV & Resume Builder', icon: FileText },
    { id: 'skills' as ActiveNavTab, label: 'Skill Gap & Vacancies', icon: TrendingUp },
  ];

  return (
    <aside className="desktop-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: '22px' }}>
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
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            <Compass size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--md-text-primary)', lineHeight: 1.1 }}>
              Career Pilot
            </h2>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
              Material 3 Dashboard
            </span>
          </div>
        </div>

        {/* Quick Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--md-text-primary)',
            transition: 'all 0.15s ease',
          }}
        >
          {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
        </button>
      </div>

      {/* Core Navigation Links */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '16px',
            marginBottom: '6px',
            display: 'block',
          }}
        >
          Core Workspace
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--md-primary-container)' : 'transparent',
                  color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  fontFamily: 'var(--font-main)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={19} color={isActive ? '#6366f1' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Career Accelerators (Phase 4 Tools) */}
      <div style={{ marginBottom: '16px', flex: 1 }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '16px',
            marginBottom: '6px',
            display: 'block',
          }}
        >
          Career Accelerators
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {careerAccelerators.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--md-primary-container)' : 'transparent',
                  color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  fontFamily: 'var(--font-main)',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={19} color={isActive ? '#6366f1' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Role Card */}
      <div
        style={{
          background: 'var(--md-surface-variant)',
          border: '1px solid var(--md-outline)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
          Active Career Path
        </span>
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--md-text-primary)', margin: '4px 0 8px 0' }}>
          {profile.target_role}
        </h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onOpenRoleModal}
            style={{
              flex: 1,
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '9999px',
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--md-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Change Path
          </button>
          <button
            onClick={onOpenSettings}
            title="Account Settings"
            style={{
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Low-AI Cost Quota Footer */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: '16px',
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Sparkles size={15} color="#818cf8" />
          <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
            {profile.ai_prompts_left} AI Prompts Left
          </strong>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--md-text-secondary)', margin: 0, lineHeight: 1.35 }}>
          Supabase Low-AI Architecture: Rules first, AI metered & cached.
        </p>
      </div>
    </aside>
  );
};
