import {
  Compass,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import type { ActiveNavTab, Profile } from '../types';
import type { ThemeMode } from '../lib/theme';
import type { AIQuotaSummary } from '../features/ai/aiGateway';
import { LEARNER_CORE_NAV_ITEMS, LEARNER_TOOL_NAV_ITEMS } from './learnerNavItems';

interface Props {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  profile: Profile;
  aiQuota?: AIQuotaSummary | null;
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
  aiQuota = null,
  onOpenRoleModal,
  theme,
  onToggleTheme,
  onOpenSettings: _onOpenSettings,
  onSignOut,
}) => {
  const coreNavItems = LEARNER_CORE_NAV_ITEMS;
  const careerAccelerators = LEARNER_TOOL_NAV_ITEMS;

  return (
    <aside className="desktop-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--md-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-text-primary)', margin: 0, lineHeight: 1.2 }}>
              Career Pilot
            </h2>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--md-text-muted)' }}>
              Workspace
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
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--md-text-primary)',
          }}
        >
          {theme === 'dark' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="var(--md-text-secondary)" />}
        </button>
      </div>

      {/* Core Navigation Links */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            paddingLeft: '10px',
            marginBottom: '6px',
            display: 'block',
          }}
        >
          Navigation
        </span>
        <nav aria-label="Primary navigation" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChangeTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--md-primary-container)' : 'transparent',
                  color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--md-primary)' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Career Accelerators */}
      <div style={{ marginBottom: '16px', flex: 1 }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--md-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            paddingLeft: '10px',
            marginBottom: '6px',
            display: 'block',
          }}
        >
          Tools
        </span>
        <nav aria-label="Career tools" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {careerAccelerators.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChangeTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--md-primary-container)' : 'transparent',
                  color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? 'var(--md-primary)' : 'var(--md-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Goal Path Card */}
      <button
        type="button"
        onClick={onOpenRoleModal}
        title="Change Target Role"
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'var(--md-surface-variant)',
          border: '1px solid var(--md-outline)',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '10px',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--md-primary)', textTransform: 'uppercase' }}>
            Target Role
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--md-text-secondary)',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline-variant)',
              borderRadius: '5px',
              padding: '1px 6px',
            }}
          >
            Switch
          </span>
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--md-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile.target_role || 'Career Goal'}
        </div>
      </button>

      {/* User Session Footer & Sign Out */}
      <div
        style={{
          background: 'var(--md-surface-variant)',
          border: '1px solid var(--md-outline)',
          borderRadius: '10px',
          padding: '8px 10px',
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
            borderRadius: '6px',
          }}
          title="View Account & Profile"
        >
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={profile.full_name}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              flexShrink: 0,
              border: '1px solid var(--md-outline)',
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--md-text-muted)' }}>
              {aiQuota ? `${aiQuota.coach.remaining} AI credits` : 'Active'}
            </div>
          </div>
        </div>

        <button
          onClick={onSignOut}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--md-text-muted)',
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
