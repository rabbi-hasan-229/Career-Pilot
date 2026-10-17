import type { AppNotification, Task, Profile, Milestone } from '../../types';

const NOTIFS_STORAGE_KEY = 'career_pilot_in_app_notifications';
const LAST_ALERT_TIMESTAMP_KEY = 'career_pilot_last_push_alert';

export const notificationService = {
  /**
   * Check if browser supports Web Notifications API
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Current notification permission
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  /**
   * Dispatch a browser push notification and record in-app
   */
  sendNotification(title: string, message: string, type: AppNotification['type'] = 'reminder'): void {
    // 1. Dispatch Web Push Notification if permission granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'career-pilot-daily-reminder',
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }

    // 2. Always record in-app notification
    const appNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };
    this.addInAppNotification(appNotif);
  },

  /**
   * Check for unmarked tasks and dispatch alert if progress is pending
   */
  checkUnmarkedProgress(tasks: Task[], profile: Profile): boolean {
    const pendingTasks = tasks.filter((t) => t.done_at == null);
    if (pendingTasks.length === 0) return false;

    // Throttle duplicate push notifications within 30 minutes
    const lastAlert = localStorage.getItem(LAST_ALERT_TIMESTAMP_KEY);
    const now = Date.now();
    if (lastAlert && now - Number(lastAlert) < 30 * 60 * 1000) {
      return false;
    }

    localStorage.setItem(LAST_ALERT_TIMESTAMP_KEY, String(now));

    this.sendNotification(
      '⏰ Career Pilot: Roadmap Reminder',
      `You have ${pendingTasks.length} task(s) pending today. Complete them to maintain your ${profile.streak_days}-day streak for ${profile.target_role}!`,
      'reminder'
    );

    return true;
  },

  /**
   * Manual trigger for user to test browser push notifications
   */
  async triggerTestReminder(tasks: Task[], profile: Profile): Promise<boolean> {
    if (this.isSupported() && Notification.permission !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') {
        // Still add in-app notification
        this.addInAppNotification({
          id: `notif_${Date.now()}`,
          title: 'Roadmap Progress Reminder',
          message: `Browser push blocked. You have ${tasks.filter((t) => !t.done_at).length} pending roadmap tasks today.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'reminder',
          read: false,
        });
        return false;
      }
    }

    const pending = tasks.filter((t) => !t.done_at).length;
    this.sendNotification(
      '⏰ Roadmap Reminder Active',
      pending > 0
        ? `You have ${pending} tasks pending today. Complete them to protect your streak!`
        : `All clear! You are 100% on track for your ${profile.target_role} goal.`,
      'reminder'
    );
    return true;
  },

  /**
   * Weekly Reminders Schedule & Frequency Configuration
   */
  getWeeklyReminderFrequency(): '2x' | '3x' | '4x' {
    return (localStorage.getItem('career_pilot_weekly_reminder_freq') as '2x' | '3x' | '4x') || '3x';
  },

  setWeeklyReminderFrequency(freq: '2x' | '3x' | '4x'): void {
    localStorage.setItem('career_pilot_weekly_reminder_freq', freq);
  },

  getWeeklyReminderDays(freq?: '2x' | '3x' | '4x'): string[] {
    const f = freq || this.getWeeklyReminderFrequency();
    if (f === '2x') return ['Tuesday 10:00 AM', 'Thursday 4:00 PM'];
    if (f === '4x') return ['Monday 9:00 AM', 'Wednesday 2:00 PM', 'Friday 5:00 PM', 'Sunday 7:00 PM'];
    return ['Monday 9:00 AM', 'Wednesday 2:00 PM', 'Friday 5:00 PM'];
  },

  /**
   * Trigger Multiple-times-a-week Reminder for Unfinished Goals
   */
  async triggerWeeklyReminder(
    tasks: Task[],
    activeMilestone: Milestone | undefined,
    profile?: Profile | null
  ): Promise<boolean> {
    const pendingTasks = tasks.filter((t) => !t.done_at);
    const milestoneTitle = activeMilestone?.title || 'Current Milestone';
    const targetRole = profile?.target_role || 'your career goal';

    if (this.isSupported() && Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    const title = pendingTasks.length > 0
      ? `📅 Weekly Check-In: ${pendingTasks.length} Unfinished Goals`
      : `✨ Weekly Milestone On Track!`;

    const body = pendingTasks.length > 0
      ? `You have ${pendingTasks.length} unfinished goals for ${milestoneTitle}. Knock them out to protect your progress for ${targetRole}!`
      : `Outstanding work! All goals for ${milestoneTitle} are completed. You are on track for job readiness.`;

    this.sendNotification(title, body, 'reminder');
    return true;
  },

  /**
   * In-App Notifications Storage
   */
  getInAppNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'notif_welcome',
        title: '🎯 Roadmap Quest Active',
        message: 'Your career milestone schedule is calibrated. Complete daily tasks to hit your target date.',
        time: 'Just now',
        type: 'system',
        read: false,
      },
    ];
  },

  addInAppNotification(notif: AppNotification): void {
    const list = this.getInAppNotifications();
    list.unshift(notif);
    const trimmed = list.slice(0, 20); // Keep max 20
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  },

  markAllAsRead(): void {
    const list = this.getInAppNotifications().map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  },
};
