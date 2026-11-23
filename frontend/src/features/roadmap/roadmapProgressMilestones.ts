import type { Milestone, Task } from '../../types';

export type JourneyCheckpointPercent = 20 | 50 | 80 | 100;

export interface JourneyMilestoneMeta {
  percent: JourneyCheckpointPercent;
  shortLabel: string;
  stageLabel: string;
  popupTitle: string;
  quote: string;
  gradient: string;
  pillColor: string;
  pillBg: string;
}

export const JOURNEY_CHECKPOINTS: Record<JourneyCheckpointPercent, JourneyMilestoneMeta> = {
  20: {
    percent: 20,
    shortLabel: '20%',
    stageLabel: '20% PROGRESSION',
    popupTitle: 'You finished 20% of your roadmap journey!',
    quote: '“The secret of getting ahead is getting started. Every milestone from here builds unstoppable momentum.”',
    gradient: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
    pillColor: '#047857',
    pillBg: '#D1FAE5',
  },
  50: {
    percent: 50,
    shortLabel: '50%',
    stageLabel: '50% HALFWAY',
    popupTitle: 'You finished 50% of your roadmap journey!',
    quote: '“Halfway through the climb, doubt fades and true skill emerges. Keep your pace — you’ve already proven you can finish.”',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
    pillColor: '#1D4ED8',
    pillBg: '#DBEAFE',
  },
  80: {
    percent: 80,
    shortLabel: '80%',
    stageLabel: '80% FINAL STRETCH',
    popupTitle: 'You finished 80% of your roadmap journey!',
    quote: '“The final stretch is where discipline turns into mastery. The finish line is right in front of you — push strong!”',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #D97706 100%)',
    pillColor: '#C2410C',
    pillBg: '#FFEDD5',
  },
  100: {
    percent: 100,
    shortLabel: '100%',
    stageLabel: '100% FINISH LINE',
    popupTitle: 'You finished 100% of your roadmap journey!',
    quote: '“Champions aren’t born at the finish line — they’re forged through every stage you just conquered. Congratulations!”',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #123C69 52%, #059669 100%)',
    pillColor: '#15803D',
    pillBg: '#DCFCE7',
  },
};

/**
 * Maps total roadmap milestones to distinct 20%, 50%, 80%, and 100% (final) stage indices.
 */
export function getJourneyCheckpointMap(count: number): Map<number, JourneyCheckpointPercent> {
  const map = new Map<number, JourneyCheckpointPercent>();
  if (count <= 0) return map;

  map.set(count - 1, 100);
  if (count === 1) return map;
  if (count === 2) {
    map.set(0, 50);
    return map;
  }
  if (count === 3) {
    map.set(0, 20);
    map.set(1, 50);
    return map;
  }

  const ratios = [0.2, 0.5, 0.8] as const;
  const percents = [20, 50, 80] as const;
  let prevIdx = -1;

  for (let k = 0; k < ratios.length; k += 1) {
    const minIdx = prevIdx + 1;
    const maxIdx = count - 2 - (ratios.length - 1 - k);
    const desired = Math.round(count * ratios[k]) - 1;
    const chosen = Math.max(minIdx, Math.min(maxIdx, desired));
    map.set(chosen, percents[k]);
    prevIdx = chosen;
  }

  return map;
}

/**
 * Computes overall roadmap completion percentage, ensuring sequential completion
 * through a 20/50/80/100% milestone stage meets at least that milestone's threshold
 * (so e.g. completing Stage 5 of 26 never displays 19% after the 20% celebration).
 */
export function computeRoadmapProgressPct(milestones: Milestone[], tasks: Task[]): number {
  const totalTasks = tasks.length;
  if (totalTasks === 0) return 0;

  const completedTasks = tasks.filter((t) => t.done_at != null).length;
  const taskProgressPct = Math.round((completedTasks / totalTasks) * 100);
  if (milestones.length < 4) {
    return taskProgressPct;
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);
  const checkpointMap = getJourneyCheckpointMap(sortedMilestones.length);
  let sequentialCheckpointPct = 0;

  for (let idx = 0; idx < sortedMilestones.length; idx += 1) {
    const milestone = sortedMilestones[idx];
    const stageTasks = tasks.filter((t) => t.milestone_id === milestone.id);
    const stageDone =
      (stageTasks.length > 0 && stageTasks.every((t) => t.done_at != null)) ||
      milestone.status === 'done';

    if (!stageDone) break;

    const tier = checkpointMap.get(idx);
    if (tier && tier > sequentialCheckpointPct) {
      sequentialCheckpointPct = tier;
    }
  }

  return Math.max(taskProgressPct, sequentialCheckpointPct);
}
