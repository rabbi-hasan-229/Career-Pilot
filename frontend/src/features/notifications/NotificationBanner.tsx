import React from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
import type { Task, Profile } from '../../types';

interface Props {
  tasks: Task[];
  profile: Profile;
  onOpenNotifications: () => void;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<Props> = ({
  tasks,
  profile,
  onOpenNotifications,
  onDismiss,
}) => {
  const pendingCount = tasks.filter((t) => t.done_at == null).length;
  if (pendingCount === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(249, 115, 22, 0.08)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        borderRadius: '14px',
        padding: '10px 14px',
        marginBottom: '16px',
        fontSize: '12.5px',
        color: 'var(--md-text-primary, #1E293B)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#F97316',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={13} />
        </div>
        <span>
          <strong>{pendingCount} roadmap task{pendingCount > 1 ? 's' : ''}</strong> pending today. Complete to keep your <strong>{profile.streak_days}d streak</strong>!
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            background: 'none',
            border: 'none',
            color: '#F97316',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: 0,
          }}
        >
          Alerts
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
          }}
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
