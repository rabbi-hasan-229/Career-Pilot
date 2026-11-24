import type { AppNotification, Task, Profile, Milestone } from '../../types';
import { supabase } from '../../lib/supabase';
import { getLocalDateOnly } from '../../lib/dateOnly';

const localKey = (userId: string) => `career_pilot_notifications:${userId}`;
const throttleKey = (userId: string) => `career_pilot_last_browser_alert:${userId}`;
const scheduledThrottleKey = (userId: string) => `career_pilot_last_scheduled_push:${userId}`;
const settingsKey = (userId: string) => `career_pilot_notification_settings:${userId}`;

export interface DetailedNotificationSettings {
  push_enabled: boolean;
  daily_reminder: boolean;
  daily_reminder_time: string; // e.g. "09:00", "12:00", "18:00", "20:00"
  selected_days: number[]; // 0=Sun .. 6=Sat
  lead_minutes: 0 | 15 | 30 | 60;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  streak_alerts: boolean;
  milestone_alerts: boolean;
  weekly_digest: boolean;
  weekly_frequency: '2x' | '3x' | '4x';
  sound_enabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: DetailedNotificationSettings = {
  push_enabled: false,
  daily_reminder: true,
  daily_reminder_time: '09:00',
  selected_days: [1, 2, 3, 4, 5],
  lead_minutes: 15,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:30',
  streak_alerts: true,
  milestone_alerts: true,
  weekly_digest: true,
  weekly_frequency: '3x',
  sound_enabled: true,
};

type NotificationCategory = 'task' | 'milestone' | 'streak' | 'system';

function categoryFor(type: AppNotification['type']): NotificationCategory {
  return type === 'reminder' ? 'task' : type;
}

function fromDatabase(row: any): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.body,
    time: new Date(row.created_at).toLocaleString(),
    type: row.category === 'task' ? 'reminder' : row.category,
    read: Boolean(row.read_at),
    actionLabel: row.metadata?.actionLabel,
    actionTab: row.metadata?.actionTab,
    bookingId: typeof row.metadata?.booking_id === 'string' ? row.metadata.booking_id : undefined,
    kind: typeof row.metadata?.kind === 'string' ? row.metadata.kind : undefined,
  };
}

function readLocal(userId: string): AppNotification[] {
  try {
    const stored = localStorage.getItem(localKey(userId));
    return stored ? JSON.parse(stored) as AppNotification[] : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, notifications: AppNotification[]): void {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(notifications.slice(0, 50)));
  } catch {
    // Local demo notifications are best-effort when browser storage is unavailable.
  }
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Audio playback blocked by browser or unsupported
  }
}

function parseMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '09:00').split(':').map((n) => Number.parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 9 * 60;
  return h * 60 + m;
}

function isWithinQuietHours(nowMins: number, startHHMM: string, endHHMM: string): boolean {
  const start = parseMinutes(startHHMM);
  const end = parseMinutes(endHHMM);
  if (start === end) return false;
  if (start < end) return nowMins >= start && nowMins < end;
  return nowMins >= start || nowMins < end;
}

function isNotificationRemoteFallbackError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; status?: number };
  const code = err.code || '';
  const msg = err.message || '';
  return (
    code === 'PGRST200' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    code === '42883' ||
    code === '42P01' ||
    code === '42501' ||
    err.status === 404 ||
    /does not exist|schema cache|could not find|permission denied|row-level security|failed to fetch|network/i.test(msg)
  );
}

function readLocalDedupeKeys(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${localKey(userId)}:dedupe`);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalDedupeKey(userId: string, key: string): void {
  try {
    const set = readLocalDedupeKeys(userId);
    set.add(key);
    localStorage.setItem(`${localKey(userId)}:dedupe`, JSON.stringify(Array.from(set).slice(-100)));
  } catch {
    // Ignore storage quota errors
  }
}

function appendLocalNotification(
  userId: string,
  title: string,
  message: string,
  type: AppNotification['type'],
  dedupeKey?: string
): boolean {
  if (dedupeKey) {
    const seen = readLocalDedupeKeys(userId);
    if (seen.has(dedupeKey)) return false;
    writeLocalDedupeKey(userId, dedupeKey);
  }
  const item: AppNotification = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    message,
    time: new Date().toLocaleString(),
    type,
    read: false,
  };
  writeLocal(userId, [item, ...readLocal(userId)]);
  return true;
}

async function getActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    if (reg?.active) return reg;

    const readyPromise = navigator.serviceWorker.ready.catch(() => undefined);
    const timeoutPromise = new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), 1200);
    });
    const readyReg = await Promise.race([readyPromise, timeoutPromise]);
    return readyReg?.active ? readyReg : undefined;
  } catch {
    return undefined;
  }
}

async function showBrowserNotification(
  title: string,
  message: string,
  tag?: string,
  targetUrl = '/?view=plan'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const effectiveTag = tag || `career-pilot-${Date.now()}`;
  const reg = await getActiveServiceWorkerRegistration();
  if (reg && typeof reg.showNotification === 'function') {
    try {
      await reg.showNotification(title, {
        body: message,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: effectiveTag,
        data: { url: targetUrl },
      });
      return true;
    } catch (swError) {
      console.warn('Service worker showNotification failed, falling back to Notification API:', swError);
    }
  }

  try {
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: effectiveTag,
    });
    notification.onclick = () => window.focus();
    return true;
  } catch (error) {
    console.warn('Browser notification failed:', error);
    return false;
  }
}

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  },

  async getPushStatus(userId: string, isDemo = false): Promise<'unsupported' | 'disabled' | 'enabled'> {
    if (!this.isSupported()) return 'unsupported';
    const settings = this.getNotificationSettings(userId);
    if (this.getPermission() === 'granted' && settings.push_enabled) {
      return 'enabled';
    }
    if (isDemo || !this.isPushSupported()) return 'disabled';
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return 'disabled';
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();
      if (error) return settings.push_enabled && this.getPermission() === 'granted' ? 'enabled' : 'disabled';
      return data ? 'enabled' : 'disabled';
    } catch {
      return 'disabled';
    }
  },

  isPushSupported(): boolean {
    return typeof window !== 'undefined'
      && 'Notification' in window
      && 'serviceWorker' in navigator
      && 'PushManager' in window;
  },

  async enablePush(userId: string, isDemo = false): Promise<void> {
    if (isDemo) throw new Error('Background notifications are available for signed-in accounts only.');
    if (!this.isPushSupported()) throw new Error('This browser does not support background notifications.');
    const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
    if (!publicKey) throw new Error('Background notifications are not configured for this app yet.');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== userId) throw new Error('Your session expired. Sign in again to enable reminders.');
    const permission = await this.requestPermission();
    if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to enable reminders.');

    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(publicKey),
    });
    const p256dh = subscription.getKey('p256dh');
    const authSecret = subscription.getKey('auth');
    if (!p256dh || !authSecret) throw new Error('The browser returned an incomplete push subscription.');

    const { error } = await supabase.from('user_push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: this.arrayBufferToBase64Url(p256dh),
      auth_secret: this.arrayBufferToBase64Url(authSecret),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }, { onConflict: 'endpoint' });
    if (error) {
      await subscription.unsubscribe();
      throw error;
    }
  },

  async disablePush(userId: string, isDemo = false): Promise<void> {
    if (isDemo || !this.isPushSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== userId) throw new Error('Your session expired. Sign in again to update reminders.');
    const { error } = await supabase.from('user_push_subscriptions')
      .delete().eq('user_id', userId).eq('endpoint', subscription.endpoint);
    if (error) throw error;
    await subscription.unsubscribe();
  },

  urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
    const padded = `${value}${'='.repeat((4 - value.length % 4) % 4)}`;
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes;
  },

  arrayBufferToBase64Url(value: ArrayBuffer): string {
    const bytes = new Uint8Array(value);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  },

  async listNotifications(userId: string, isDemo = false): Promise<AppNotification[]> {
    const localItems = readLocal(userId);
    if (isDemo) return localItems;
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id,category,title,body,metadata,read_at,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        if (isNotificationRemoteFallbackError(error)) return localItems;
        throw error;
      }
      const remoteItems = (data ?? []).map(fromDatabase);
      if (localItems.length === 0) return remoteItems;
      const seen = new Set(remoteItems.map((item) => item.id));
      return [...localItems.filter((item) => !seen.has(item.id)), ...remoteItems].slice(0, 50);
    } catch (error) {
      if (isNotificationRemoteFallbackError(error)) return localItems;
      throw error;
    }
  },

  async addInAppNotification(
    userId: string,
    isDemo: boolean,
    title: string,
    message: string,
    type: AppNotification['type'],
    dedupeKey?: string
  ): Promise<boolean> {
    if (isDemo) {
      return appendLocalNotification(userId, title, message, type, dedupeKey);
    }
    try {
      const { error } = await supabase.from('user_notifications').insert({
        user_id: userId,
        category: categoryFor(type),
        title,
        body: message,
        ...(dedupeKey ? { metadata: { dedupe_key: dedupeKey } } : {}),
      });
      if (error?.code === '23505' && dedupeKey) return false;
      if (error) {
        if (isNotificationRemoteFallbackError(error)) {
          return appendLocalNotification(userId, title, message, type, dedupeKey);
        }
        throw error;
      }
      return true;
    } catch (error) {
      if (isNotificationRemoteFallbackError(error)) {
        return appendLocalNotification(userId, title, message, type, dedupeKey);
      }
      throw error;
    }
  },

  async sendNotification(
    title: string,
    message: string,
    type: AppNotification['type'],
    profile: Profile,
    dedupeKey?: string
  ): Promise<boolean> {
    let recorded = true;
    try {
      recorded = await this.addInAppNotification(profile.id, Boolean(profile.is_demo), title, message, type, dedupeKey);
    } catch (err) {
      console.warn('Could not persist notification to remote history, falling back locally:', err);
      recorded = appendLocalNotification(profile.id, title, message, type, dedupeKey);
    }
    if (recorded) {
      await showBrowserNotification(
        title,
        message,
        dedupeKey || `career-pilot-${type}-${Date.now()}`
      );
    }
    return recorded;
  },

  async enableSmartPush(
    userId: string,
    isDemo: boolean,
    currentSettings?: DetailedNotificationSettings
  ): Promise<{ permission: NotificationPermission; mode: 'web-push' | 'browser-sw' }> {
    if (!this.isSupported()) {
      throw new Error('This browser does not support notifications.');
    }
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was denied. Enable notifications in browser site settings.');
    }

    let mode: 'web-push' | 'browser-sw' = 'browser-sw';

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
      if (!isDemo && registration && 'PushManager' in window && publicKey) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData.user && authData.user.id === userId) {
            const subscription =
              (await registration.pushManager.getSubscription()) ||
              (await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicKey),
              }));
            const p256dh = subscription.getKey('p256dh');
            const authSecret = subscription.getKey('auth');
            if (p256dh && authSecret) {
              await supabase.from('user_push_subscriptions').upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: this.arrayBufferToBase64Url(p256dh),
                auth_secret: this.arrayBufferToBase64Url(authSecret),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              }, { onConflict: 'endpoint' });
              mode = 'web-push';
            }
          }
        } catch (err) {
          console.warn('Web push remote subscription skipped, using browser/service-worker notifications:', err);
        }
      }
    }

    const base = currentSettings || this.getNotificationSettings(userId);
    await this.saveNotificationSettings(userId, isDemo, { ...base, push_enabled: true });
    return { permission, mode };
  },

  async disableSmartPush(userId: string, isDemo: boolean, currentSettings?: DetailedNotificationSettings): Promise<void> {
    if (!isDemo && this.isPushSupported()) {
      try {
        await this.disablePush(userId, false);
      } catch {
        // Non-fatal if remote subscription wasn't active
      }
    }
    const base = currentSettings || this.getNotificationSettings(userId);
    await this.saveNotificationSettings(userId, isDemo, { ...base, push_enabled: false });
  },

  async checkUnmarkedProgress(tasks: Task[], profile: Profile): Promise<boolean> {
    if (profile.notification_daily_reminder === false) return false;
    const pendingTasks = tasks.filter((task) => task.done_at == null);
    if (pendingTasks.length === 0) return false;

    const title = 'Career Pilot: Roadmap Reminder';
    const localDate = getLocalDateOnly();
    if (profile.is_demo) {
      if (localStorage.getItem(throttleKey(profile.id)) === localDate) return false;
      localStorage.setItem(throttleKey(profile.id), localDate);
    }

    return this.sendNotification(
      title,
      `You have ${pendingTasks.length} unfinished task${pendingTasks.length === 1 ? '' : 's'} for ${profile.target_role}.`,
      'reminder',
      profile,
      profile.is_demo ? undefined : `daily_reminder_${localDate}`
    );
  },

  async triggerTestReminder(tasks: Task[], profile: Profile): Promise<boolean> {
    let browserEnabled = this.getPermission() === 'granted';
    if (this.isSupported() && !browserEnabled) browserEnabled = (await this.requestPermission()) === 'granted';
    const pending = tasks.filter((task) => !task.done_at).length;
    const settings = this.getNotificationSettings(profile.id, profile);
    const title = 'Roadmap Progress Reminder';
    const body = pending > 0
      ? `You have ${pending} unfinished roadmap task${pending === 1 ? '' : 's'} for ${profile.target_role || 'your career goal'}.`
      : `All clear! You are on track for your ${profile.target_role || 'career'} goal.`;

    await this.sendNotification(title, body, 'reminder', profile);
    if (browserEnabled) {
      await this.saveNotificationSettings(profile.id, Boolean(profile.is_demo), {
        ...settings,
        push_enabled: true,
      });
    }
    if (settings.sound_enabled) {
      this.playChime();
    }
    return browserEnabled;
  },

  playChime(): void {
    playNotificationSound();
  },

  isSoundEnabled(userId: string): boolean {
    const settings = this.getNotificationSettings(userId);
    return settings.sound_enabled !== false;
  },

  getNotificationSettings(userId: string, profile?: Profile | null): DetailedNotificationSettings {
    let local: Partial<DetailedNotificationSettings> = {};
    try {
      const stored = localStorage.getItem(settingsKey(userId));
      if (stored) local = JSON.parse(stored);
    } catch { /* ignore */ }

    return {
      push_enabled: local.push_enabled ?? (this.getPermission() === 'granted' ? true : DEFAULT_NOTIFICATION_SETTINGS.push_enabled),
      daily_reminder: profile?.notification_daily_reminder ?? local.daily_reminder ?? DEFAULT_NOTIFICATION_SETTINGS.daily_reminder,
      daily_reminder_time: profile?.notification_daily_reminder_time ?? local.daily_reminder_time ?? DEFAULT_NOTIFICATION_SETTINGS.daily_reminder_time,
      selected_days: Array.isArray(local.selected_days) && local.selected_days.length > 0
        ? local.selected_days
        : DEFAULT_NOTIFICATION_SETTINGS.selected_days,
      lead_minutes: local.lead_minutes ?? DEFAULT_NOTIFICATION_SETTINGS.lead_minutes,
      quiet_hours_enabled: local.quiet_hours_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.quiet_hours_enabled,
      quiet_hours_start: local.quiet_hours_start ?? DEFAULT_NOTIFICATION_SETTINGS.quiet_hours_start,
      quiet_hours_end: local.quiet_hours_end ?? DEFAULT_NOTIFICATION_SETTINGS.quiet_hours_end,
      streak_alerts: profile?.notification_streak_alerts ?? local.streak_alerts ?? DEFAULT_NOTIFICATION_SETTINGS.streak_alerts,
      milestone_alerts: profile?.notification_milestone_alerts ?? local.milestone_alerts ?? DEFAULT_NOTIFICATION_SETTINGS.milestone_alerts,
      weekly_digest: profile?.notification_weekly_digest ?? local.weekly_digest ?? DEFAULT_NOTIFICATION_SETTINGS.weekly_digest,
      weekly_frequency: profile?.weekly_reminder_frequency ?? local.weekly_frequency ?? DEFAULT_NOTIFICATION_SETTINGS.weekly_frequency,
      sound_enabled: profile?.notification_sound ?? local.sound_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.sound_enabled,
    };
  },

  async saveNotificationSettings(
    userId: string,
    isDemo: boolean,
    settings: DetailedNotificationSettings
  ): Promise<void> {
    try {
      localStorage.setItem(settingsKey(userId), JSON.stringify(settings));
    } catch { /* ignore */ }

    if (!isDemo) {
      try {
        await supabase.from('profiles').update({
          notification_daily_reminder: settings.daily_reminder,
          notification_milestone_alerts: settings.milestone_alerts,
          notification_weekly_digest: settings.weekly_digest,
          weekly_reminder_frequency: settings.weekly_frequency,
        }).eq('id', userId);
      } catch (err) {
        console.warn('Could not sync notification settings to remote profile:', err);
      }
    }
  },

  async evaluateScheduledNotifications(
    tasks: Task[],
    milestones: Milestone[],
    profile: Profile
  ): Promise<boolean> {
    const settings = this.getNotificationSettings(profile.id, profile);
    if (!settings.daily_reminder || !settings.push_enabled) return false;
    if (this.getPermission() !== 'granted') return false;

    const now = new Date();
    const today = getLocalDateOnly(now);
    const weekday = now.getDay();
    if (!settings.selected_days.includes(weekday)) return false;

    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (settings.quiet_hours_enabled && isWithinQuietHours(nowMins, settings.quiet_hours_start, settings.quiet_hours_end)) {
      return false;
    }

    const targetMins = Math.max(0, parseMinutes(settings.daily_reminder_time) - settings.lead_minutes);
    if (nowMins < targetMins) return false;

    try {
      if (localStorage.getItem(scheduledThrottleKey(profile.id)) === today) return false;
      localStorage.setItem(scheduledThrottleKey(profile.id), today);
    } catch { /* ignore */ }

    const nextTask = tasks.find((t) => t.done_at == null);
    if (!nextTask) return false;

    const currentStage = milestones.find((m) => m.id === nextTask.milestone_id);
    const prefix = settings.lead_minutes > 0 ? `Starts in ${settings.lead_minutes}m` : 'Study Block Ready';
    const title = `${prefix} · ${profile.target_role || 'Career Pilot'}`;
    const body = `${nextTask.title} (${nextTask.est_minutes || 45}m)${currentStage ? ` · ${currentStage.title}` : ''}`;

    const sent = await this.sendNotification(
      title,
      body,
      'reminder',
      profile,
      profile.is_demo ? undefined : `scheduled_study_${today}`
    );
    if (sent && settings.sound_enabled) {
      this.playChime();
    }
    return sent;
  },

  async checkTaskDueReminders(tasks: Task[], profile: Profile): Promise<boolean> {
    const settings = this.getNotificationSettings(profile.id, profile);
    if (!settings.daily_reminder) return false;

    const today = getLocalDateOnly();
    const pendingDueTasks = tasks.filter((task) => !task.done_at && task.due_date && task.due_date <= today);
    if (pendingDueTasks.length === 0) return false;

    const dueTodayCount = pendingDueTasks.length;
    const firstTitle = pendingDueTasks[0].title;
    const title = 'Career Pilot: Task Due Today';
    const message = dueTodayCount === 1
      ? `Task due today for ${profile.target_role}: "${firstTitle}".`
      : `You have ${dueTodayCount} tasks due today for ${profile.target_role}, starting with "${firstTitle}".`;

    if (profile.is_demo) {
      if (localStorage.getItem(throttleKey(profile.id)) === today) return false;
      localStorage.setItem(throttleKey(profile.id), today);
    }

    const sent = await this.sendNotification(
      title,
      message,
      'reminder',
      profile,
      profile.is_demo ? undefined : `task_due_${today}`
    );

    if (sent && settings.sound_enabled) {
      this.playChime();
    }
    return sent;
  },

  async checkStreakRiskReminder(streakDays: number, completedToday: number, profile: Profile): Promise<boolean> {
    const settings = this.getNotificationSettings(profile.id, profile);
    if (!settings.streak_alerts || streakDays <= 0 || completedToday > 0) return false;

    const today = getLocalDateOnly();
    const title = 'Streak Protection Alert 🔥';
    const message = `Your ${streakDays}-day learning streak is active! Complete one roadmap task before midnight to keep your momentum going.`;

    const sent = await this.sendNotification(
      title,
      message,
      'streak',
      profile,
      profile.is_demo ? undefined : `streak_risk_${today}`
    );

    if (sent && settings.sound_enabled) {
      this.playChime();
    }
    return sent;
  },

  getWeeklyReminderFrequency(profile?: Profile): '2x' | '3x' | '4x' {
    return profile?.weekly_reminder_frequency || '3x';
  },

  async setWeeklyReminderFrequency(profile: Profile, freq: '2x' | '3x' | '4x'): Promise<void> {
    if (profile.is_demo) return;
    const { error } = await supabase.from('profiles')
      .update({ weekly_reminder_frequency: freq })
      .eq('id', profile.id);
    if (error) throw error;
  },

  getWeeklyReminderDays(freq?: '2x' | '3x' | '4x'): string[] {
    const selected = freq || this.getWeeklyReminderFrequency();
    if (selected === '2x') return ['Tuesday 10:00 AM', 'Thursday 4:00 PM'];
    if (selected === '4x') return ['Monday 9:00 AM', 'Wednesday 2:00 PM', 'Friday 5:00 PM', 'Sunday 7:00 PM'];
    return ['Monday 9:00 AM', 'Wednesday 2:00 PM', 'Friday 5:00 PM'];
  },

  async triggerWeeklyReminder(
    tasks: Task[],
    activeMilestone: Milestone | undefined,
    profile?: Profile | null
  ): Promise<boolean> {
    if (!profile || profile.notification_weekly_digest === false) return false;
    const pending = tasks.filter((task) => !task.done_at).length;
    const milestoneTitle = activeMilestone?.title || 'Current Milestone';
    const title = pending > 0 ? `Weekly Check-In: ${pending} Unfinished Goals` : 'Weekly Milestone On Track';
    const body = pending > 0
      ? `You have ${pending} unfinished goals for ${milestoneTitle} and your ${profile.target_role} goal.`
      : `All goals for ${milestoneTitle} are complete. Keep building toward ${profile.target_role}.`;
    await this.sendNotification(title, body, 'reminder', profile);
    return true;
  },

  async showBrowserPopup(title: string, message: string, tag?: string, targetUrl?: string): Promise<boolean> {
    return showBrowserNotification(title, message, tag, targetUrl);
  },

  async getUnreadSummary(userId: string, isDemo = false): Promise<{ totalUnread: number; unreadSessionMessages: number }> {
    const localUnread = readLocal(userId).filter((n) => !n.read);
    const localSummary = {
      totalUnread: localUnread.length,
      unreadSessionMessages: localUnread.filter((n) => n.kind === 'session_message').length,
    };
    if (isDemo) return localSummary;
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id,metadata')
        .eq('user_id', userId)
        .is('read_at', null)
        .limit(100);
      if (error) {
        if (isNotificationRemoteFallbackError(error)) return localSummary;
        throw error;
      }
      const rows = (data ?? []) as Array<{ id: string; metadata?: { kind?: string } | null }>;
      const remoteUnreadSessionMessages = rows.filter((r) => r.metadata?.kind === 'session_message').length;
      return {
        totalUnread: rows.length + localSummary.totalUnread,
        unreadSessionMessages: remoteUnreadSessionMessages + localSummary.unreadSessionMessages,
      };
    } catch (error) {
      if (isNotificationRemoteFallbackError(error)) return localSummary;
      return localSummary;
    }
  },

  async markAsRead(userId: string, notificationId: string, isDemo = false): Promise<void> {
    writeLocal(
      userId,
      readLocal(userId).map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    if (isDemo || notificationId.startsWith('local_')) return;
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', notificationId)
        .is('read_at', null);
      if (error && !isNotificationRemoteFallbackError(error)) throw error;
    } catch (error) {
      if (!isNotificationRemoteFallbackError(error)) throw error;
    }
  },

  async markBookingMessageNotificationsRead(userId: string, bookingId: string, isDemo = false): Promise<void> {
    if (!bookingId) return;
    writeLocal(
      userId,
      readLocal(userId).map((n) =>
        n.kind === 'session_message' && n.bookingId === bookingId ? { ...n, read: true } : n
      )
    );
    if (isDemo) return;
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('metadata->>kind', 'session_message')
        .eq('metadata->>booking_id', bookingId)
        .is('read_at', null);
      if (error && !isNotificationRemoteFallbackError(error)) throw error;
    } catch {
      // Non-blocking read sync
    }
  },

  async markAllAsRead(userId: string, isDemo = false): Promise<void> {
    writeLocal(userId, readLocal(userId).map((notification) => ({ ...notification, read: true })));
    if (isDemo) {
      return;
    }
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error && !isNotificationRemoteFallbackError(error)) throw error;
    } catch (error) {
      if (!isNotificationRemoteFallbackError(error)) throw error;
    }
  },
};
