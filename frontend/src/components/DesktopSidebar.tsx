import {
  Home,
  Calendar,
  PieChart,
  Bot,
  Compass,
  Mic2,
  FileText,
  TrendingUp,
  Moon,
  Sun,
  Settings,
  LogOut,
  ShieldCheck,
  User,
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
  onSignOut?: () => void;
}

export const DesktopSidebar: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  profile,
  onOpenRoleModal,
  theme,
  onToggleTheme,
  onOpenSettings,
  onSignOut,
}) => {
  const coreNavItems = [
    { id: 'home' as ActiveNavTab, label: "Career Roadmap", icon: Home },
    { id: 'plan' as ActiveNavTab, label: 'Weekly Schedule', icon: Calendar },
    { id: 'overview' as ActiveNavTab, label: 'Pacing & Stats', icon: PieChart },
    { id: 'coach' as ActiveNavTab, label: 'AI Career Coach', icon: Bot },
  ];

  const careerAccelerators = [
    { id: 'interview' as ActiveNavTab, label: 'Interview Simulator', icon: Mic2 },
    { id: 'cv' as ActiveNavTab, label: 'CV & Resume Builder', icon: FileText },
    { id: 'skills' as ActiveNavTab, label: 'Skill Gap & Matching', icon: TrendingUp },
    { id: 'profile' as ActiveNavTab, label: 'Account & Profile', icon: User },
  ];

  return (
    <aside className="desktop-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#8EA95B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 3px 10px rgba(142, 169, 91, 0.3)',
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0, lineHeight: 1.1 }}>
              Career Pilot
            </h2>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
              Roadmap Workspace
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
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--md-text-primary)',
          }}
        >
          {theme === 'dark' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#6366F1" />}
        </button>
      </div>

      {/* Core Navigation Links */}
      <div style={{ marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '12px',
            marginBottom: '4px',
            display: 'block',
          }}
        >
          Roadmap Core
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(142, 169, 91, 0.15)' : 'transparent',
                  color: isActive ? '#5C7433' : 'var(--md-text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#8EA95B' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Career Accelerators */}
      <div style={{ marginBottom: '14px', flex: 1 }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '12px',
            marginBottom: '4px',
            display: 'block',
          }}
        >
          Career Tools
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(142, 169, 91, 0.15)' : 'transparent',
                  color: isActive ? '#5C7433' : 'var(--md-text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#8EA95B' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Goal Path Card */}
      <div
        style={{
          background: 'var(--md-surface-variant)',
          border: '1px solid var(--md-outline)',
          borderRadius: '14px',
          padding: '12px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#8EA95B', textTransform: 'uppercase' }}>
            Active Goal
          </span>
          <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ShieldCheck size={11} /> Verified
          </span>
        </div>
        <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--md-text-primary)', margin: '0 0 6px 0' }}>
          {profile.target_role || 'Full Stack Engineer'}
        </h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onOpenRoleModal}
            style={{
              flex: 1,
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--md-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Adjust Goal
          </button>
          <button
            onClick={onOpenSettings}
            title="Account Settings"
            style={{
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '8px',
              padding: '5px 8px',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* User Session Footer & Sign Out */}
      <div
        style={{
          background: 'var(--md-surface-variant)',
          border: '1px solid var(--md-outline)',
          borderRadius: '12px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={() => onChangeTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
            flex: 1,
            padding: '2px',
            borderRadius: '8px',
          }}
          title="View Account & Profile"
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              flexShrink: 0,
              border: activeTab === 'profile' ? '2px solid #2563EB' : '1px solid var(--md-outline)',
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--md-text-secondary)' }}>
              {profile.ai_prompts_left} AI calls
            </div>
          </div>
        </div>

        <button
          onClick={onSignOut}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#EF4444',
            padding: '4px',
            display: 'flex',
          }}
          title="Sign Out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};
