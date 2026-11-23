import React from 'react';
import { X, Compass, LogOut } from 'lucide-react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

export interface MobileNavItem {
  id: string;
  label: string;
  badge?: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export interface MobileNavGroup {
  title: string;
  items: MobileNavItem[];
}

interface StripProps {
  items: MobileNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

export const MobileSectionStrip: React.FC<StripProps> = ({
  items,
  activeId,
  onSelect,
  ariaLabel,
}) => (
  <nav className="mobile-section-strip" aria-label={ariaLabel}>
    {items.map((item) => {
      const Icon = item.icon;
      const isActive = activeId === item.id;
      return (
        <button
          key={item.id}
          type="button"
          className={`mobile-section-pill${isActive ? ' active' : ''}`}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => onSelect(item.id)}
        >
          <Icon size={13} color={isActive ? '#FFFFFF' : 'var(--md-text-secondary)'} />
          <span>{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="mobile-section-pill-badge">{item.badge}</span>
          )}
        </button>
      );
    })}
  </nav>
);

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  groups: MobileNavGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  roleLabel?: string;
  onChangeRole?: () => void;
  onSignOut?: () => void;
}

export const MobileNavDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  groups,
  activeId,
  onSelect,
  roleLabel,
  onChangeRole,
  onSignOut,
}) => {
  const dialogRef = useAccessibleDialog(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      className="mobile-drawer-backdrop"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} navigation menu`}
        tabIndex={-1}
        className="mobile-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--md-outline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'var(--md-primary)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Compass size={17} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                {title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--md-text-muted)', fontWeight: 600 }}>
                {subtitle}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '16px', padding: '14px 0' }}>
          {groups.map((group) => (
            <div key={group.title} style={{ display: 'grid', gap: '4px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--md-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingLeft: '8px',
                  marginBottom: '2px',
                }}
              >
                {group.title}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? 'var(--md-primary-container)' : 'transparent',
                      color: isActive ? 'var(--md-on-primary-container)' : 'var(--md-text-primary)',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 700 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} color={isActive ? 'var(--md-primary)' : 'var(--md-text-muted)'} />
                      <span>{item.label}</span>
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          background: 'var(--md-primary)',
                          color: '#FFFFFF',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {(onChangeRole || onSignOut) && (
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--md-outline)',
              display: 'grid',
              gap: '8px',
            }}
          >
            {onChangeRole && (
              <button
                type="button"
                className="btn-m3-white"
                onClick={() => {
                  onClose();
                  onChangeRole();
                }}
                style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Compass size={14} />
                <span>{roleLabel ? `Switch Role (${roleLabel})` : 'Switch Career Role'}</span>
              </button>
            )}
            {onSignOut && (
              <button
                type="button"
                className="btn-m3-white"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', color: 'var(--md-error)', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
