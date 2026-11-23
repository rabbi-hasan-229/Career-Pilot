import type { Milestone, Task } from '../../types';

const TYPE_ORDER: Record<Task['type'], number> = {
  Learn: 0,
  Build: 1,
  Practice: 2,
  Checkpoint: 4,
};

/**
 * Identifies whether a task acts as a stage completion checkpoint.
 */
export function isCheckpointTask(task: Pick<Task, 'type' | 'title'>): boolean {
  return task.type === 'Checkpoint' || /checkpoint/i.test(task.title);
}

function getStageTaskTypeRank(task: Pick<Task, 'type' | 'title'>): number {
  if (isCheckpointTask(task)) return TYPE_ORDER.Checkpoint;
  return TYPE_ORDER[task.type] ?? 3;
}

/**
 * Orders tasks inside a single stage so all learning/build/practice work
 * appears before any stage checkpoint task.
 */
export function sortStageTasks(
  stageTasks: Task[],
  options: { normalizeWorkflow?: boolean } = {}
): Task[] {
  if (stageTasks.length <= 1) return stageTasks.slice();

  const { normalizeWorkflow = false } = options;
  return stageTasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const aCheckpoint = isCheckpointTask(a.task) ? 1 : 0;
      const bCheckpoint = isCheckpointTask(b.task) ? 1 : 0;
      if (aCheckpoint !== bCheckpoint) {
        return aCheckpoint - bCheckpoint;
      }

      if (normalizeWorkflow) {
        const aDue = a.task.due_date || '';
        const bDue = b.task.due_date || '';
        if (aDue && bDue && aDue !== bDue) {
          return aDue.localeCompare(bDue);
        }

        const rankDiff = getStageTaskTypeRank(a.task) - getStageTaskTypeRank(b.task);
        if (rankDiff !== 0) {
          return rankDiff;
        }
      }

      return a.index - b.index;
    })
    .map((entry) => entry.task);
}

/**
 * Groups tasks by milestone order and ensures checkpoints sit at the end of every stage.
 */
export function sortRoadmapTasks(
  tasks: Task[],
  milestones: Milestone[],
  options: { normalizeWorkflow?: boolean } = {}
): Task[] {
  if (tasks.length <= 1) return tasks.slice();

  const byMilestone = new Map<string, Task[]>();
  for (const task of tasks) {
    const bucket = byMilestone.get(task.milestone_id);
    if (bucket) {
      bucket.push(task);
    } else {
      byMilestone.set(task.milestone_id, [task]);
    }
  }

  const ordered: Task[] = [];
  const consumedMilestones = new Set<string>();

  for (const milestone of milestones) {
    const stageTasks = byMilestone.get(milestone.id);
    if (!stageTasks || stageTasks.length === 0) continue;
    consumedMilestones.add(milestone.id);
    ordered.push(...sortStageTasks(stageTasks, options));
  }

  for (const [milestoneId, stageTasks] of byMilestone.entries()) {
    if (consumedMilestones.has(milestoneId)) continue;
    ordered.push(...sortStageTasks(stageTasks, options));
  }

  return ordered;
}
