import { describe, it, expect } from 'vitest';
import { exportAccountData } from './accountRepository';
import type { Profile, Milestone, Task } from '../../types';

describe('accountRepository', () => {
  it('exports demo account data locally without network calls', async () => {
    const demoProfile: Profile = {
      id: 'demo-123',
      full_name: 'Demo Pilot',
      email: 'demo@careerpilot.io',
      target_role: 'Full Stack Engineer',
      is_demo: true,
      plan: 'free',
      daily_minutes: 60,
      streak_days: 3,
      created_at: '2026-05-01T00:00:00Z',
      has_completed_onboarding: true,
      is_guest: false,
    };

    const milestones: Milestone[] = [
      {
        id: 'm1',
        roadmap_id: 'rm1',
        user_id: 'demo-123',
        title: 'Stage 1',
        position: 1,
        start_date: '2026-05-01',
        end_date: '2026-05-20',
        status: 'doing',
      },
    ];

    const tasks: Task[] = [
      {
        id: 't1',
        milestone_id: 'm1',
        user_id: 'demo-123',
        title: 'Task 1',
        subject: 'Engineering',
        type: 'Learn',
        due_date: '2026-05-05',
        est_minutes: 45,
        progress_pct: 100,
      },
    ];

    const exportData = await exportAccountData(demoProfile, milestones, tasks);
    expect(exportData.account_type).toBe('development_demo');
    expect(exportData.profile).toEqual(demoProfile);
    expect(exportData.milestones).toEqual(milestones);
    expect(exportData.tasks).toEqual(tasks);
    expect(exportData.exported_at).toBeTruthy();
  });
});
