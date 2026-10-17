import React, { useState } from 'react';
import { X, Bell, Sparkles, CheckCheck } from 'lucide-react';
import { notificationService } from './notificationService';
import type { Task, Profile } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  profile: Profile;
  onToast: (msg: string) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks,
  profile,
  onToast,
}) => {
  const [notifications, setNotifications] = useState(() => notificationService.getInAppNotifications());
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    setIsTesting(true);
    const sent = await notificationService.triggerTestReminder(tasks, profile);
    setNotifications(notificationService.getInAppNotifications());
    setIsTesting(false);

    if (sent) {
      onToast('🔔 Sent test browser notification!');
    } else {
      onToast('Logged in-app notification reminder.');
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getInAppNotifications());
    onToast('Marked all notifications as read.');
  };

  const perm = notificationService.getPermission();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1600,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--md-surface, #FFFFFF)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--md-outline, #E2E8F0)',
          color: 'var(--md-text-primary, #1E293B)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#8EA95B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Roadmap Notifications
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Status: {perm === 'granted' ? '🟢 Push Enabled' : '🟡 In-App Only'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Browser Push Test Action */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong style={{ fontSize: '12px', display: 'block', color: '#1E293B' }}>
              Daily Progress Reminders
            </strong>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Triggers when roadmap tasks remain uncompleted.
            </span>
          </div>

          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestNotification}
            style={{
              background: '#8EA95B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} />
            Test Push
          </button>
        </div>

        {/* Notification History List */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Recent Activity
          </span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#8EA95B',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        </div>

        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                background: n.read ? '#F8FAFC' : 'rgba(142, 169, 91, 0.08)',
                border: `1px solid ${n.read ? '#E2E8F0' : 'rgba(142, 169, 91, 0.3)'}`,
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <strong style={{ fontSize: '12.5px', color: '#1E293B' }}>{n.title}</strong>
                <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{n.time}</span>
              </div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '11.5px', lineHeight: 1.4 }}>
                {n.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
