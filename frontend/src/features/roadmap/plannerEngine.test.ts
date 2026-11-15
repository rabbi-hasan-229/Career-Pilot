import { describe, it, expect } from 'vitest';
import {
  generateRoadmapForRole,
  generateTasksForMilestones,
  calculateProportionalPlan,
  applyQuickPlannerAction,
  getWeeklyCurriculum,
} from './plannerEngine';
import { getLocalDateOnly, addDaysToDateOnly, addMonthsToDateOnly } from '../../lib/dateOnly';
import type { Milestone, Task } from '../../types';

describe('plannerEngine', () => {
  const role = 'Full Stack Engineer';

  describe('generateRoadmapForRole', () => {
    it('generates a sequential roadmap with ordered milestones', () => {
      const today = getLocalDateOnly();
      const targetDate = addMonthsToDateOnly(today, 6);
      const milestones = generateRoadmapForRole(role, 6, 60, targetDate, 'beginner');

      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones[0].status).toBe('doing');

      // Verify each milestone has valid dates and sequence
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        expect(m.title).toBeTruthy();
        expect(m.start_date <= m.end_date).toBe(true);
        expect(m.position).toBe(i + 1);

        if (i > 0) {
          const prev = milestones[i - 1];
          expect(prev.end_date <= m.start_date).toBe(true);
        }
      }

      // Final milestone should end on targetDate
      const lastMilestone = milestones[milestones.length - 1];
      expect(lastMilestone.end_date).toBe(targetDate);
    });

    it('adapts curriculum length and content based on experience level', () => {
      const beginnerCurriculum = getWeeklyCurriculum(role, 24, 'beginner');
      const switcherCurriculum = getWeeklyCurriculum(role, 24, 'switcher');
      const juniorCurriculum = getWeeklyCurriculum(role, 24, 'junior');
      const midCurriculum = getWeeklyCurriculum(role, 24, 'mid');

      expect(beginnerCurriculum.length).toBe(24);
      expect(switcherCurriculum.length).toBe(24);
      expect(juniorCurriculum.length).toBe(24);
      expect(midCurriculum.length).toBe(24);

      // Career switcher starts with transition bridge
      expect(switcherCurriculum[0].title).toContain('Career transition bridge');

      // Junior skips early fundamentals
      expect(juniorCurriculum[0].title).not.toEqual(beginnerCurriculum[0].title);
    });

    it('handles short timeline requests by sampling curriculum', () => {
      const shortCurriculum = getWeeklyCurriculum(role, 8, 'beginner');
      expect(shortCurriculum).toHaveLength(8);
      expect(shortCurriculum[7].title).toBeTruthy();
    });
  });

  describe('generateTasksForMilestones', () => {
    it('generates comprehensive tasks with checkpoint tasks and quiz template IDs', () => {
      const today = getLocalDateOnly();
      const targetDate = addMonthsToDateOnly(today, 3);
      const milestones = generateRoadmapForRole(role, 3, 60, targetDate, 'beginner');
      const tasks = generateTasksForMilestones(milestones, role, 'beginner');

      expect(tasks.length).toBeGreaterThan(0);

      const milestoneIds = new Set(milestones.map((m) => m.id));
      const checkpointTasks = tasks.filter((t) => t.type === 'Checkpoint');
      expect(checkpointTasks.length).toBeGreaterThan(0);

      for (const task of tasks) {
        expect(milestoneIds.has(task.milestone_id)).toBe(true);
        expect(task.title).toBeTruthy();
        expect(task.est_minutes).toBeGreaterThan(0);
        expect(['Learn', 'Build', 'Practice', 'Checkpoint']).toContain(task.type);

        if (task.type === 'Checkpoint') {
          expect(task.quiz_template_id).toBeTruthy();
          expect(task.quiz_template_id).toMatch(/_p[1-4]$/);
        }
      }
    });
  });

  describe('calculateProportionalPlan', () => {
    it('detects overload when user daily capacity is less than required effort', () => {
      const today = getLocalDateOnly();
      const targetDate = addDaysToDateOnly(today, 14); // 2 weeks for a 120-hour role = ~8.5 hrs/day!
      const plan = calculateProportionalPlan(role, targetDate, 30); // 30 mins/day capacity

      expect(plan.isOverloaded).toBe(true);
      expect(plan.requiredDailyMinutes).toBeGreaterThan(30);
      expect(plan.totalDays).toBeGreaterThan(0);
      expect(plan.milestones.length).toBeGreaterThan(0);
    });

    it('reports feasible when user daily capacity is ample', () => {
      const today = getLocalDateOnly();
      const targetDate = addMonthsToDateOnly(today, 12); // 12 months for 120-hour role = <20 mins/day
      const plan = calculateProportionalPlan(role, targetDate, 120); // 2 hours/day capacity

      expect(plan.isOverloaded).toBe(false);
      expect(plan.requiredDailyMinutes).toBeLessThan(120);
    });
  });

  describe('applyQuickPlannerAction', () => {
    const today = getLocalDateOnly();
    const baseMilestones: Milestone[] = [
      {
        id: 'm1',
        roadmap_id: 'rm1',
        user_id: 'user1',
        title: 'Stage 1',
        position: 1,
        start_date: today,
        end_date: addDaysToDateOnly(today, 7),
        status: 'doing',
      },
      {
        id: 'm2',
        roadmap_id: 'rm1',
        user_id: 'user1',
        title: 'Stage 2',
        position: 2,
        start_date: addDaysToDateOnly(today, 8),
        end_date: addDaysToDateOnly(today, 15),
        status: 'todo',
      },
    ];

    const baseTasks: Task[] = [
      {
        id: 't1',
        milestone_id: 'm1',
        user_id: 'user1',
        title: 'Task 1 in Stage 1',
        subject: 'Engineering',
        type: 'Learn',
        due_date: addDaysToDateOnly(today, 3),
        est_minutes: 60,
        progress_pct: 100,
        done_at: '2026-05-01T10:00:00Z',
      },
      {
        id: 't2',
        milestone_id: 'm1',
        user_id: 'user1',
        title: 'Task 2 in Stage 1',
        subject: 'Engineering',
        type: 'Build',
        due_date: addDaysToDateOnly(today, 5),
        est_minutes: 60,
        progress_pct: 0,
        done_at: null,
      },
      {
        id: 't3',
        milestone_id: 'm2',
        user_id: 'user1',
        title: 'Task 3 in Stage 2',
        subject: 'Engineering',
        type: 'Learn',
        due_date: addDaysToDateOnly(today, 10),
        est_minutes: 60,
        progress_pct: 0,
        done_at: null,
      },
    ];

    it('action "behind" extends active milestone by 3 days and shifts subsequent dates', () => {
      const result = applyQuickPlannerAction(baseMilestones, baseTasks, 'behind');

      // m1 end date +3d
      expect(result.updatedMilestones[0].end_date).toBe(addDaysToDateOnly(baseMilestones[0].end_date, 3));
      // m2 start and end shifted +3d
      expect(result.updatedMilestones[1].start_date).toBe(addDaysToDateOnly(baseMilestones[1].start_date, 3));
      expect(result.updatedMilestones[1].end_date).toBe(addDaysToDateOnly(baseMilestones[1].end_date, 3));

      // Completed task t1 due date unchanged
      const t1 = result.updatedTasks.find((t) => t.id === 't1')!;
      expect(t1.due_date).toBe(baseTasks[0].due_date);

      // Incomplete tasks t2 and t3 shifted +3d
      const t2 = result.updatedTasks.find((t) => t.id === 't2')!;
      expect(t2.due_date).toBe(addDaysToDateOnly(baseTasks[1].due_date, 3));
      const t3 = result.updatedTasks.find((t) => t.id === 't3')!;
      expect(t3.due_date).toBe(addDaysToDateOnly(baseTasks[2].due_date, 3));
    });

    it('action "pause" shifts all current and subsequent milestones by 7 days', () => {
      const result = applyQuickPlannerAction(baseMilestones, baseTasks, 'pause');

      expect(result.updatedMilestones[0].start_date).toBe(addDaysToDateOnly(baseMilestones[0].start_date, 7));
      expect(result.updatedMilestones[0].end_date).toBe(addDaysToDateOnly(baseMilestones[0].end_date, 7));
      expect(result.updatedMilestones[1].start_date).toBe(addDaysToDateOnly(baseMilestones[1].start_date, 7));
      expect(result.updatedMilestones[1].end_date).toBe(addDaysToDateOnly(baseMilestones[1].end_date, 7));

      // Completed task t1 unchanged
      const t1 = result.updatedTasks.find((t) => t.id === 't1')!;
      expect(t1.due_date).toBe(baseTasks[0].due_date);

      // Incomplete task t2 shifted +7d
      const t2 = result.updatedTasks.find((t) => t.id === 't2')!;
      expect(t2.due_date).toBe(addDaysToDateOnly(baseTasks[1].due_date, 7));
    });
  });
});
