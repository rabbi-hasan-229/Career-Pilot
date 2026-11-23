import { describe, expect, it } from 'vitest';
import type { Milestone, Task } from '../../types';
import { computeRoadmapJobMarketProgression } from './jobMarketProgress';

function makeMilestones(): Milestone[] {
  return [
    {
      id: 'm1',
      roadmap_id: 'r1',
      user_id: 'u1',
      title: 'Web Foundations',
      position: 1,
      start_date: '2026-01-01',
      end_date: '2026-01-14',
      status: 'doing',
      skills_covered: ['HTML5', 'TypeScript'],
    },
    {
      id: 'm2',
      roadmap_id: 'r1',
      user_id: 'u1',
      title: 'Backend APIs',
      position: 2,
      start_date: '2026-01-15',
      end_date: '2026-01-31',
      status: 'todo',
      skills_covered: ['Node.js', 'PostgreSQL'],
    },
  ];
}

function makeTasks(doneCount: number): Task[] {
  const list: Task[] = [
    { id: 't1', milestone_id: 'm1', user_id: 'u1', title: 'Learn HTML', subject: 'HTML5', type: 'Learn', due_date: '2026-01-05', est_minutes: 60, progress_pct: 0, done_at: null },
    { id: 't2', milestone_id: 'm1', user_id: 'u1', title: 'Build TS App', subject: 'TypeScript', type: 'Build', due_date: '2026-01-10', est_minutes: 60, progress_pct: 0, done_at: null },
    { id: 't3', milestone_id: 'm2', user_id: 'u1', title: 'REST Endpoints', subject: 'Node.js', type: 'Build', due_date: '2026-01-18', est_minutes: 60, progress_pct: 0, done_at: null },
    { id: 't4', milestone_id: 'm2', user_id: 'u1', title: 'SQL Queries', subject: 'PostgreSQL', type: 'Practice', due_date: '2026-01-22', est_minutes: 60, progress_pct: 0, done_at: null },
    { id: 't5', milestone_id: 'm2', user_id: 'u1', title: 'Stage 2 Quiz', subject: 'PostgreSQL', type: 'Checkpoint', due_date: '2026-01-30', est_minutes: 30, progress_pct: 0, done_at: null },
  ];
  for (let i = 0; i < doneCount; i += 1) {
    list[i].done_at = '2026-01-06T00:00:00.000Z';
    list[i].progress_pct = 100;
  }
  return list;
}

describe('jobMarketProgress', () => {
  it('locks Job Market below 20% progression and computes exact tasks needed', () => {
    const prog = computeRoadmapJobMarketProgression(makeMilestones(), makeTasks(0), 'Full Stack Engineer', 'Software & Web');
    expect(prog.progressPct).toBe(0);
    expect(prog.isUnlocked).toBe(false);
    expect(prog.tasksNeededToUnlock).toBe(1);
    expect(prog.achievedSkills).toEqual([]);
  });

  it('unlocks at >=20% and marks skills achieved once stages are completed', () => {
    const prog = computeRoadmapJobMarketProgression(makeMilestones(), makeTasks(2), 'Full Stack Engineer', 'Software & Web');
    expect(prog.progressPct).toBe(40);
    expect(prog.isUnlocked).toBe(true);
    expect(prog.completedStagesCount).toBe(1);
    expect(prog.achievedSkills).toContain('HTML5');
    expect(prog.achievedSkills).toContain('TypeScript');
    expect(prog.upcomingSkills).toContain('PostgreSQL');
  });

  it('unlocks Job Market at 20% when the 20% checkpoint stage of a 26-stage roadmap is completed', () => {
    const milestones: Milestone[] = Array.from({ length: 26 }, (_, idx) => ({
      id: `m-${idx + 1}`,
      roadmap_id: 'r26',
      user_id: 'u1',
      title: `Stage ${idx + 1}`,
      position: idx + 1,
      start_date: '2026-01-01',
      end_date: '2026-01-07',
      status: idx < 5 ? 'done' : 'todo',
      skills_covered: idx === 0 ? ['TypeScript'] : [],
    }));

    const tasks: Task[] = milestones.flatMap((m, mIdx) =>
      Array.from({ length: 4 }, (_, tIdx) => ({
        id: `t-${mIdx + 1}-${tIdx + 1}`,
        milestone_id: m.id,
        user_id: 'u1',
        title: `Task ${tIdx + 1}`,
        subject: 'TypeScript',
        type: tIdx === 3 ? 'Checkpoint' : 'Learn',
        due_date: '2026-01-07',
        est_minutes: 45,
        progress_pct: mIdx < 5 ? 100 : 0,
        done_at: mIdx < 5 ? '2026-01-07T00:00:00.000Z' : null,
      }))
    );

    const prog = computeRoadmapJobMarketProgression(milestones, tasks, 'Full Stack Engineer', 'Software & Web');
    expect(prog.completedTasks).toBe(20);
    expect(prog.totalTasks).toBe(104);
    expect(prog.progressPct).toBe(20);
    expect(prog.isUnlocked).toBe(true);
    expect(prog.tasksNeededToUnlock).toBe(0);
  });

  it('does not count out-of-order completion of Stage 5 alone as 20% unlocked', () => {
    const milestones: Milestone[] = Array.from({ length: 26 }, (_, idx) => ({
      id: `m-${idx + 1}`,
      roadmap_id: 'r26',
      user_id: 'u1',
      title: `Stage ${idx + 1}`,
      position: idx + 1,
      start_date: '2026-01-01',
      end_date: '2026-01-07',
      status: idx === 4 ? 'done' : 'todo',
      skills_covered: [],
    }));

    const tasks: Task[] = milestones.flatMap((m, mIdx) =>
      Array.from({ length: 4 }, (_, tIdx) => ({
        id: `t-${mIdx + 1}-${tIdx + 1}`,
        milestone_id: m.id,
        user_id: 'u1',
        title: `Task ${tIdx + 1}`,
        subject: 'TypeScript',
        type: tIdx === 3 ? 'Checkpoint' : 'Learn',
        due_date: '2026-01-07',
        est_minutes: 45,
        progress_pct: mIdx === 4 ? 100 : 0,
        done_at: mIdx === 4 ? '2026-01-07T00:00:00.000Z' : null,
      }))
    );

    const prog = computeRoadmapJobMarketProgression(milestones, tasks, 'Full Stack Engineer', 'Software & Web');
    expect(prog.completedTasks).toBe(4);
    expect(prog.progressPct).toBe(4);
    expect(prog.isUnlocked).toBe(false);
  });

  it('excludes long phase/stage titles in task.subject from achieved skills list', () => {
    const milestones: Milestone[] = [
      {
        id: 'm1',
        roadmap_id: 'r1',
        user_id: 'u1',
        title: 'Phase 1: Python Core Fundamentals & Tooling · Language foundations',
        position: 1,
        start_date: '2026-01-01',
        end_date: '2026-01-07',
        status: 'done',
        skills_covered: ['Python 3.12', 'FastAPI'],
      },
      {
        id: 'm2',
        roadmap_id: 'r1',
        user_id: 'u1',
        title: 'Phase 2: Architecture',
        position: 2,
        start_date: '2026-01-08',
        end_date: '2026-01-14',
        status: 'todo',
        skills_covered: ['Django'],
      },
    ];
    const tasks: Task[] = [
      {
        id: 't1',
        milestone_id: 'm1',
        user_id: 'u1',
        title: 'Learn Python',
        subject: 'Phase 1: Python Core Fundamentals & Tooling · Language foundations',
        type: 'Learn',
        due_date: '2026-01-07',
        est_minutes: 60,
        progress_pct: 100,
        done_at: '2026-01-07T00:00:00.000Z',
      },
      {
        id: 't2',
        milestone_id: 'm2',
        user_id: 'u1',
        title: 'Learn Django',
        subject: 'Phase 2: Architecture',
        type: 'Learn',
        due_date: '2026-01-14',
        est_minutes: 60,
        progress_pct: 0,
        done_at: null,
      },
    ];

    const prog = computeRoadmapJobMarketProgression(milestones, tasks, 'Python Software Engineer', 'Software & Web');
    expect(prog.achievedSkills).toEqual(['Python 3.12', 'FastAPI']);
  });
});
