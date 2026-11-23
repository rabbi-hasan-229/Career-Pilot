import React, { useEffect, useState } from 'react';
import {
  X,
  Bell,
  Sparkles,
  CheckCheck,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  Award,
  Send,
  Save,
} from 'lucide-react';
import { notificationService, type DetailedNotificationSettings } from './notificationService';
import type { Task, Profile } from '../../types';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import { ListSkeleton } from '../../components/SkeletonScreen';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  profile: Profile;
  onToast: (msg: string) => void;
}

function extractNotificationError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks,
  profile,
  onToast,
}) => {
  type Notifications = Awaited<ReturnType<typeof notificationService.listNotifications>>;
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
  const [loadedResult, setLoadedResult] = useState<{ key: string; notifications: Notifications; error: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [pushStatus, setPushStatus] = useState<'loading' | 'unsupported' | 'disabled' | 'enabled'>('loading');
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Granular Settings State
  const [settings, setSettings] = useState<DetailedNotificationSettings>(() =>
    notificationService.getNotificationSettings(profile.id, profile)
  );

  const dialogRef = useAccessibleDialog(isOpen, onClose);
  const userKey = `${profile.id}:${Boolean(profile.is_demo)}`;

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    notificationService.listNotifications(profile.id, Boolean(profile.is_demo))
      .then((items) => { if (active) setLoadedResult({ key: userKey, notifications: items, error: '' }); })
      .catch((e: unknown) => {
        if (active) setLoadedResult({
          key: userKey,
          notifications: [],
          error: extractNotificationError(e, 'Could not load notifications.'),
        });
      });
    return () => { active = false; };
  }, [isOpen, profile.id, profile.is_demo, userKey]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    notificationService.getPushStatus(profile.id, Boolean(profile.is_demo))
      .then((status) => { if (active) setPushStatus(status); })
      .catch(() => { if (active) setPushStatus('disabled'); });
    return () => { active = false; };
  }, [isOpen, profile.id, profile.is_demo]);

  const currentResult = loadedResult?.key === userKey ? loadedResult : null;
  const notifications = currentResult?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isLoading = isOpen && currentResult === null;
  const error = currentResult?.error ?? '';

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const sent = await notificationService.triggerTestReminder(tasks, profile);
      if (sent) {
        setPushStatus('enabled');
        setSettings((prev) => ({ ...prev, push_enabled: true }));
      }
      setLoadedResult({ key: userKey, notifications: await notificationService.listNotifications(profile.id, Boolean(profile.is_demo)), error: '' });
      onToast(
        sent
          ? 'Sent test push notification and recorded in history.'
          : notificationService.getPermission() === 'denied'
            ? 'Recorded in history. Allow notifications in browser site settings to receive push popups.'
            : 'Recorded test notification in your history.'
      );
    } catch (e) {
      onToast(extractNotificationError(e, 'Could not send test notification.'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(profile.id, Boolean(profile.is_demo));
      setLoadedResult({ key: userKey, notifications: await notificationService.listNotifications(profile.id, Boolean(profile.is_demo)), error: '' });
      onToast('Marked all notifications as read.');
    } catch (e) {
      onToast(extractNotificationError(e, 'Could not update notifications.'));
    }
  };

  const handlePushToggle = async () => {
    setIsUpdatingPush(true);
    try {
      if (pushStatus === 'enabled') {
        await notificationService.disableSmartPush(profile.id, Boolean(profile.is_demo), settings);
        setPushStatus('disabled');
        setSettings((prev) => ({ ...prev, push_enabled: false }));
        onToast('Push reminders disabled for this browser.');
      } else {
        await notificationService.enableSmartPush(profile.id, Boolean(profile.is_demo), settings);
        setPushStatus('enabled');
        setSettings((prev) => ({ ...prev, push_enabled: true }));
        onToast('Push notifications enabled for this browser.');
      }
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not update push notifications.');
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await notificationService.saveNotificationSettings(profile.id, Boolean(profile.is_demo), settings);
      onToast('Notification settings saved.');
    } catch {
      onToast('Could not save notification settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Roadmap notifications"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--md-surface)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--md-outline)',
          color: 'var(--md-text-primary)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--md-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--md-text-primary)' }}>
                Notification Center
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                {pushStatus === 'enabled'
                  ? 'Web push active · Task reminders enabled'
                  : perm === 'granted'
                    ? 'Browser permission granted · In-app active'
                    : 'In-app history active'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            style={{
              background: 'var(--md-surface-variant)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--md-surface-variant)',
            borderRadius: '12px',
            padding: '3px',
            marginBottom: '16px',
            border: '1px solid var(--md-outline)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'inbox' ? 'var(--md-surface)' : 'transparent',
              color: activeTab === 'inbox' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'inbox' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Bell size={14} />
            Inbox & Activity
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--md-primary)',
                  color: '#ffffff',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'preferences' ? 'var(--md-surface)' : 'transparent',
              color: activeTab === 'preferences' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'preferences' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Settings size={14} />
            Detailed Settings
          </button>
        </div>

        {/* TAB 1: INBOX & ACTIVITY */}
        {activeTab === 'inbox' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Quick Actions Bar */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', display: 'block', color: 'var(--md-text-primary)' }}>
                  Test Push Reminder
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                  Send a test push notification & chime.
                </span>
              </div>

              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestNotification}
                style={{
                  background: 'var(--md-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: isTesting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} />
                {isTesting ? 'Sending…' : 'Send Test'}
              </button>
            </div>

            {/* List Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-secondary)', textTransform: 'uppercase' }}>
                Recent Alerts ({notifications.length})
              </span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: unreadCount > 0 ? 'var(--md-primary)' : 'var(--md-text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: unreadCount > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            </div>

            {/* Notification History List */}
            <div
              style={{
                flex: 1,
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
              }}
            >
              {isLoading && <ListSkeleton rows={3} compact label="Loading notifications" />}
              {error && <p role="alert" style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              {!isLoading && !error && notifications.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 10px',
                    color: 'var(--md-text-secondary)',
                  }}
                >
                  <Bell size={28} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>No notifications yet</p>
                  <span style={{ fontSize: '11.5px' }}>Task reminders and milestone achievements will appear here.</span>
                </div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: n.read ? 'var(--md-surface-variant)' : 'var(--md-primary-container)',
                    border: `1px solid ${n.read ? 'var(--md-outline)' : 'var(--md-primary)'}`,
                    fontSize: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>{n.title}</strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--md-text-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--md-text-secondary)', fontSize: '11.5px', lineHeight: 1.45 }}>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED SETTINGS */}
        {activeTab === 'preferences' && (
          <div
            style={{
              flex: 1,
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingRight: '4px',
            }}
          >
            {/* 1. Master Browser Web Push */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <Send size={14} color="var(--md-primary)" />
                  <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                    Browser Web Push
                  </strong>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                  {profile.is_demo
                    ? 'Available for signed-in accounts.'
                    : pushStatus === 'unsupported'
                      ? 'Push notifications are unsupported in this browser.'
                      : 'Receive alerts while Career Pilot is in the background.'}
                </span>
              </div>

              {pushStatus !== 'unsupported' && !profile.is_demo && (
                <button
                  type="button"
                  disabled={isUpdatingPush || pushStatus === 'loading'}
                  onClick={handlePushToggle}
                  style={{
                    background: pushStatus === 'enabled' ? 'var(--md-surface)' : 'var(--md-primary)',
                    color: pushStatus === 'enabled' ? 'var(--md-text-primary)' : '#ffffff',
                    border: '1px solid var(--md-outline)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: isUpdatingPush ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isUpdatingPush ? 'Updating…' : pushStatus === 'enabled' ? 'Disable Push' : 'Enable Push'}
                </button>
              )}
            </div>

            {/* 2. Daily Task Due Reminders & Time Picker */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--md-primary)" />
                  <div>
                    <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                      Daily Task Due Reminders
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)', display: 'block' }}>
                      Alert for today’s or overdue roadmap tasks.
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.daily_reminder}
                  onChange={(e) => setSettings((prev) => ({ ...prev, daily_reminder: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--md-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Reminder Time Picker */}
              {settings.daily_reminder && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--md-outline)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
                    Preferred Daily Alert Time
                  </span>
                  <select
                    value={settings.daily_reminder_time}
                    onChange={(e) => setSettings((prev) => ({ ...prev, daily_reminder_time: e.target.value }))}
                    style={{
                      background: 'var(--md-surface)',
                      border: '1px solid var(--md-outline)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--md-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="08:00">08:00 AM (Early Morning)</option>
                    <option value="09:00">09:00 AM (Morning Focus)</option>
                    <option value="12:00">12:00 PM (Midday Check)</option>
                    <option value="18:00">06:00 PM (Evening Review)</option>
                    <option value="20:00">08:00 PM (Night Catchup)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 3. Streak Loss Alert */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={14} color="var(--md-primary)" />
                <div>
                  <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                    Streak Protection Warnings
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)', display: 'block' }}>
                    Warn before midnight if a daily streak is at risk.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.streak_alerts}
                onChange={(e) => setSettings((prev) => ({ ...prev, streak_alerts: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--md-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* 4. Milestone Celebration Alerts */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={14} color="var(--md-primary)" />
                <div>
                  <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                    Milestone Stage Celebrations
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)', display: 'block' }}>
                    Notify when completing stages or unlocking skills.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.milestone_alerts}
                onChange={(e) => setSettings((prev) => ({ ...prev, milestone_alerts: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--md-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* 5. Weekly Digest Frequency */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)', display: 'block' }}>
                  Weekly Check-In Cadence
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)' }}>
                  How often to send progress check-ins.
                </span>
              </div>

              <select
                value={settings.weekly_frequency}
                onChange={(e) => setSettings((prev) => ({ ...prev, weekly_frequency: e.target.value as '2x' | '3x' | '4x' }))}
                style={{
                  background: 'var(--md-surface)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--md-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="2x">2x / week (Tue, Thu)</option>
                <option value="3x">3x / week (Mon, Wed, Fri)</option>
                <option value="4x">4x / week (Mon, Wed, Fri, Sun)</option>
              </select>
            </div>

            {/* 6. Sound Effects / Chime */}
            <div
              style={{
                background: 'var(--md-surface-variant)',
                border: '1px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {settings.sound_enabled ? <Volume2 size={16} color="var(--md-primary)" /> : <VolumeX size={16} color="var(--md-text-muted)" />}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '12.5px', color: 'var(--md-text-primary)' }}>
                      Notification Sound Effects
                    </strong>
                    <button
                      type="button"
                      onClick={() => notificationService.playChime()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Sample Chime
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--md-text-secondary)', display: 'block' }}>
                    Play a soft chime when new notifications arrive.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.sound_enabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, sound_enabled: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--md-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Save Preferences Button */}
            <button
              type="button"
              disabled={isSavingSettings}
              onClick={handleSaveSettings}
              style={{
                marginTop: '4px',
                background: 'var(--md-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSavingSettings ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Save size={15} />
              {isSavingSettings ? 'Saving preferences…' : 'Save Notification Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
