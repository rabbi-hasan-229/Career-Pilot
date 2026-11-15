import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Milestone, Profile, Task } from '../../types';

const { mockRpc, mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  },
  isSupabaseConfigured: () => true,
  getSupabasePublicConfig: () => ({ url: 'https://example.supabase.co', anonKey: 'anon' }),
  getRememberMePreference: () => true,
  setRememberMePreference: vi.fn(),
}));

import { completeTask, loadActiveRoadmap, saveCareerPlan } from './roadmapRepository';

const storageBacking = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageBacking.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageBacking.set(key, value);
  },
  removeItem: (key: string) => {
    storageBacking.delete(key);
  },
  clear: () => {
    storageBacking.clear();
  },
};

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: mockLocalStorage,
    },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  mockLocalStorage.clear();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'user@example.com', user_metadata: { full_name: 'Ada' } } },
    error: null,
  });
});

describe('roadmapRepository Phase 1 schema fallbacks', () => {
  it('saves career plan via base tables when save_user_career_plan and create_user_roadmap RPCs are missing (PGRST202)', async () => {
    const profile: Profile = {
      id: 'user-1',
      full_name: 'Ada Lovelace',
      email: 'user@example.com',
      avatar_url: '',
      target_role: 'Backend Engineer',
      target_role_category: 'Software & Web',
      target_timeline_months: 6,
      target_completion_date: '2027-05-15',
      experience_level: 'beginner',
      plan: 'free',
      daily_minutes: 60,
      streak_days: 0,
      created_at: '2026-11-15T00:00:00.000Z',
      has_completed_onboarding: true,
    };

    const milestones: Milestone[] = [
      {
        id: 'local-m-1',
        roadmap_id: 'local',
        user_id: 'user-1',
        title: 'Foundations',
        position: 1,
        start_date: '2026-11-15',
        end_date: '2026-12-15',
        status: 'doing',
        effort_hours: 40,
        skills_covered: ['SQL', 'APIs'],
      },
    ];

    const tasks: Task[] = [
      {
        id: 'local-t-1',
        milestone_id: 'local-m-1',
        user_id: 'user-1',
        title: 'Build first API',
        subject: 'APIs',
        type: 'Build',
        due_date: '2026-11-18',
        est_minutes: 60,
        progress_pct: 0,
        done_at: null,
        deliverable: 'Ship a REST endpoint',
      },
    ];

    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.save_user_career_plan in schema cache' },
    });

    let insertedCoreTasks: unknown;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  if ('target_role_category' in payload) {
                    return { data: null, error: { code: '42703', message: 'column profiles.target_role_category does not exist' } };
                  }
                  return {
                    data: {
                      id: 'user-1',
                      full_name: 'Ada Lovelace',
                      avatar_url: null,
                      target_role: 'Backend Engineer',
                      plan: 'free',
                      daily_minutes: 60,
                      created_at: '2026-11-15T00:00:00.000Z',
                    },
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }

      if (table === 'user_roadmaps') {
        return {
          update: () => ({
            eq: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'roadmap-db-1' }, error: null }),
            }),
          }),
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: { id: 'roadmap-db-1', target_date: '2027-05-15' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'milestones') {
        return {
          insert: (payload: Array<Record<string, unknown>>) => ({
            select: async () => {
              if ('effort_hours' in (payload[0] || {})) {
                return { data: null, error: { code: '42703', message: 'column milestones.effort_hours does not exist' } };
              }
              return { data: [{ id: 'milestone-db-1', position: 1 }], error: null };
            },
          }),
          select: (columns: string) => ({
            eq: () => ({
              eq: () => ({
                order: async () => {
                  if (columns.includes('effort_hours')) {
                    return { data: null, error: { code: '42703', message: 'column milestones.effort_hours does not exist' } };
                  }
                  return {
                    data: [
                      {
                        id: 'milestone-db-1',
                        roadmap_id: 'roadmap-db-1',
                        user_id: 'user-1',
                        title: 'Foundations',
                        position: 1,
                        start_date: '2026-11-15',
                        end_date: '2026-12-15',
                        status: 'doing',
                      },
                    ],
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }

      if (table === 'tasks') {
        return {
          insert: async (payload: Array<Record<string, unknown>>) => {
            if ('subject' in (payload[0] || {})) {
              return { error: { code: '42703', message: 'column tasks.subject does not exist' } };
            }
            insertedCoreTasks = payload;
            return { error: null };
          },
          select: (columns: string) => ({
            in: () => ({
              eq: () => ({
                order: async () => {
                  if (columns.includes('subject')) {
                    return { data: null, error: { code: '42703', message: 'column tasks.subject does not exist' } };
                  }
                  return {
                    data: [
                      {
                        id: 'task-db-1',
                        milestone_id: 'milestone-db-1',
                        user_id: 'user-1',
                        title: 'Build first API',
                        resource_id: null,
                        due_date: '2026-11-18',
                        est_minutes: 60,
                        xp_reward: 25,
                        done_at: null,
                      },
                    ],
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }

      if (table === 'task_quizzes_public') {
        return {
          select: () => ({
            in: async () => ({ data: null, error: { code: 'PGRST205', message: 'Could not find the table public.task_quizzes_public' } }),
          }),
        };
      }

      if (table === 'task_quizzes') {
        return {
          select: () => ({
            in: async () => ({ data: [], error: null }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    await expect(saveCareerPlan(profile, milestones, tasks)).resolves.toBeUndefined();
    expect(insertedCoreTasks).toEqual([
      expect.objectContaining({
        milestone_id: 'milestone-db-1',
        user_id: 'user-1',
        title: 'Build first API',
        due_date: '2026-11-18',
      }),
    ]);

    const loaded = await loadActiveRoadmap('user-1');
    expect(loaded?.targetDate).toBe('2027-05-15');
    expect(loaded?.milestones[0]?.effort_hours).toBe(40);
    expect(loaded?.milestones[0]?.skills_covered).toEqual(['SQL', 'APIs']);
    expect(loaded?.tasks[0]?.subject).toBe('APIs');
    expect(loaded?.tasks[0]?.type).toBe('Build');
    expect(loaded?.tasks[0]?.deliverable).toBe('Ship a REST endpoint');
  });

  it('completes tasks via base tasks table when complete_user_task RPC is missing', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.complete_user_task in schema cache' },
    });

    mockFrom.mockReturnValue({
      update: (payload: Record<string, unknown>) => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if ('progress_pct' in payload) {
                return { data: null, error: { code: '42703', message: 'column tasks.progress_pct does not exist' } };
              }
              return { data: { xp_reward: 35 }, error: null };
            },
          }),
        }),
      }),
    });

    const result = await completeTask('task-db-1');
    expect(result).toEqual({
      already_completed: false,
      xp_awarded: 35,
      current_streak: null,
    });
  });
});
