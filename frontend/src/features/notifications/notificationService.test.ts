import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { notificationService, DEFAULT_NOTIFICATION_SETTINGS } from './notificationService';
import type { Task, Profile } from '../../types';

describe('Notification Service & Controls', () => {
  const store = new Map<string, string>();

  beforeAll(() => {
    const localStorageMock: Storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, String(value)); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() { return store.size; },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  const dummyProfile: Profile = {
    id: 'test-user-123',
    full_name: 'Alex Rivera',
    target_role: 'Full Stack Developer',
    plan: 'free',
    daily_minutes: 60,
    streak_days: 5,
    created_at: new Date().toISOString(),
    is_demo: true,
  };

  beforeEach(() => {
    store.clear();
  });

  it('provides default notification settings when none stored', () => {
    const settings = notificationService.getNotificationSettings('test-user-123', dummyProfile);
    expect(settings.daily_reminder).toBe(true);
    expect(settings.daily_reminder_time).toBe('09:00');
    expect(settings.streak_alerts).toBe(true);
    expect(settings.milestone_alerts).toBe(true);
    expect(settings.sound_enabled).toBe(true);
  });

  it('persists and retrieves updated notification settings', async () => {
    const newSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      daily_reminder_time: '18:00',
      weekly_frequency: '4x' as const,
      sound_enabled: false,
    };
    await notificationService.saveNotificationSettings('test-user-123', true, newSettings);

    const retrieved = notificationService.getNotificationSettings('test-user-123');
    expect(retrieved.daily_reminder_time).toBe('18:00');
    expect(retrieved.weekly_frequency).toBe('4x');
    expect(retrieved.sound_enabled).toBe(false);
  });

  it('triggers task due reminder when pending tasks are due today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks: Task[] = [
      {
        id: 't-1',
        milestone_id: 'm-1',
        user_id: 'test-user-123',
        title: 'Complete REST API Design',
        subject: 'Backend Architecture',
        type: 'Learn',
        est_minutes: 60,
        progress_pct: 0,
        due_date: today,
        done_at: null,
      },
    ];

    const sent = await notificationService.checkTaskDueReminders(tasks, dummyProfile);
    expect(sent).toBe(true);

    const list = await notificationService.listNotifications('test-user-123', true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].title).toContain('Task Due Today');
    expect(list[0].message).toContain('REST API Design');
  });

  it('persists custom push days, lead minutes, and quiet hours', async () => {
    const customSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      push_enabled: true,
      selected_days: [1, 3, 5],
      lead_minutes: 30 as const,
      quiet_hours_enabled: true,
      quiet_hours_start: '23:00',
      quiet_hours_end: '06:30',
    };
    await notificationService.saveNotificationSettings('test-user-123', true, customSettings);

    const loaded = notificationService.getNotificationSettings('test-user-123');
    expect(loaded.push_enabled).toBe(true);
    expect(loaded.selected_days).toEqual([1, 3, 5]);
    expect(loaded.lead_minutes).toBe(30);
    expect(loaded.quiet_hours_enabled).toBe(true);
    expect(loaded.quiet_hours_start).toBe('23:00');
    expect(loaded.quiet_hours_end).toBe('06:30');
  });
});
