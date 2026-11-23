import { describe, expect, it } from 'vitest';
import type { Milestone, Task } from '../../types';
import { isCheckpointTask, sortRoadmapTasks, sortStageTasks } from './stageTaskOrder';

function makeTask(partial: Partial<Task> & Pick<Task, 'id' | 'title' | 'type'>): Task {
  return {
    milestone_id: 'm1',
    user_id: 'u1',
    subject: 'Engineering',
    due_date: '2026-11-30',
    est_minutes: 45,
    progress_pct: 0,
    done_at: null,
    ...partial,
  };
}

describe('stageTaskOrder', () => {
  it('places checkpoint tasks at the last position of each stage even if returned in the middle', () => {
    const unsorted: Task[] = [
      makeTask({ id: 't1', title: 'Study relational indexing', type: 'Learn' }),
      makeTask({ id: 't4', title: 'Week 2 Checkpoint: Indexing benchmark', type: 'Checkpoint' }),
      makeTask({ id: 't2', title: 'Build composite index migration', type: 'Build' }),
      makeTask({ id: 't3', title: 'Practice EXPLAIN ANALYZE queries', type: 'Practice' }),
    ];

    const sorted = sortStageTasks(unsorted);
    expect(sorted.map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4']);
    expect(isCheckpointTask(sorted[sorted.length - 1])).toBe(true);
  });

  it('normalizes Learn -> Build -> Practice -> Checkpoint order when due dates are tied from database loads', () => {
    const milestones: Milestone[] = [
      {
        id: 'm1',
        roadmap_id: 'r1',
        user_id: 'u1',
        title: 'Stage 1',
        position: 1,
        start_date: '2026-11-01',
        end_date: '2026-11-07',
        status: 'doing',
      },
      {
        id: 'm2',
        roadmap_id: 'r1',
        user_id: 'u1',
        title: 'Stage 2',
        position: 2,
        start_date: '2026-11-08',
        end_date: '2026-11-14',
        status: 'todo',
      },
    ];

    const dbRows: Task[] = [
      makeTask({ id: 'm2-chk', milestone_id: 'm2', title: 'Week 2 Checkpoint: Ship API', type: 'Checkpoint', due_date: '2026-11-14' }),
      makeTask({ id: 'm2-prc', milestone_id: 'm2', title: 'Practice auth checks', type: 'Practice', due_date: '2026-11-14' }),
      makeTask({ id: 'm2-lrn', milestone_id: 'm2', title: 'Learn REST error specs', type: 'Learn', due_date: '2026-11-14' }),
      makeTask({ id: 'm1-chk', milestone_id: 'm1', title: 'Week 1 Checkpoint: Verify setup', type: 'Checkpoint', due_date: '2026-11-07' }),
      makeTask({ id: 'm1-bld', milestone_id: 'm1', title: 'Build workspace template', type: 'Build', due_date: '2026-11-07' }),
      makeTask({ id: 'm1-lrn', milestone_id: 'm1', title: 'Learn TypeScript strictness', type: 'Learn', due_date: '2026-11-07' }),
      makeTask({ id: 'm1-added', milestone_id: 'm1', title: 'Develop Git Hooks', type: 'Learn', due_date: '2026-11-20' }),
    ];

    const ordered = sortRoadmapTasks(dbRows, milestones, { normalizeWorkflow: true });
    const stage1 = ordered.filter((t) => t.milestone_id === 'm1');
    const stage2 = ordered.filter((t) => t.milestone_id === 'm2');

    expect(stage1.map((t) => t.id)).toEqual(['m1-lrn', 'm1-bld', 'm1-added', 'm1-chk']);
    expect(stage2.map((t) => t.id)).toEqual(['m2-lrn', 'm2-prc', 'm2-chk']);
  });
});
