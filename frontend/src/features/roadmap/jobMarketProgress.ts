import type { Milestone, Skill, Task } from '../../types';
import { createCustomCareerBlueprint, findCuratedCareerBlueprint, type CareerCategory } from './careerCatalog';
import { computeRoadmapProgressPct } from './roadmapProgressMilestones';

export const MINIMUM_JOB_MARKET_PROGRESS_PCT = 20;

export interface RoadmapSkillUnlockItem {
  name: string;
  stageTitle: string;
  stagePosition: number;
  category: string;
  isUnlocked: boolean;
}

export interface RoadmapJobMarketProgression {
  totalTasks: number;
  completedTasks: number;
  progressPct: number;
  isUnlocked: boolean;
  tasksNeededToUnlock: number;
  completedStagesCount: number;
  totalStagesCount: number;
  achievedSkills: string[];
  upcomingSkills: string[];
  skillItems: RoadmapSkillUnlockItem[];
}

function normalizeSkillKey(name: string): string {
  return name.trim().toLowerCase();
}

function isConciseSkillLabel(subject: string, milestoneTitle: string): boolean {
  const clean = subject.trim();
  if (!clean || clean.length > 40) return false;
  const lower = clean.toLowerCase();
  if (lower === 'career skills' || lower === milestoneTitle.trim().toLowerCase()) return false;
  if (clean.includes('·') || /^(phase|stage|week)\s+\d+/i.test(clean)) return false;
  return true;
}

/**
 * Computes the user's roadmap progression %, whether the 20% Job Market gate is unlocked,
 * and the exact skills achieved from completed roadmap stages & completed tasks.
 */
export function computeRoadmapJobMarketProgression(
  milestones: Milestone[],
  tasks: Task[],
  targetRole: string,
  targetRoleCategory?: CareerCategory
): RoadmapJobMarketProgression {
  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);
  const blueprint =
    findCuratedCareerBlueprint(targetRole) ||
    createCustomCareerBlueprint(targetRole, targetRoleCategory);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done_at != null).length;
  const progressPct = computeRoadmapProgressPct(sortedMilestones, tasks);
  const minTasksFor20Pct = totalTasks > 0 ? Math.ceil(totalTasks * (MINIMUM_JOB_MARKET_PROGRESS_PCT / 100)) : 1;
  const isUnlocked = totalTasks > 0 && progressPct >= MINIMUM_JOB_MARKET_PROGRESS_PCT;
  const tasksNeededToUnlock = isUnlocked ? 0 : Math.max(0, minTasksFor20Pct - completedTasks);

  const skillMap = new Map<string, RoadmapSkillUnlockItem>();
  let completedStagesCount = 0;

  sortedMilestones.forEach((milestone, idx) => {
    const stageTasks = tasks.filter((t) => t.milestone_id === milestone.id);
    const stageDone =
      (stageTasks.length > 0 && stageTasks.every((t) => t.done_at != null)) ||
      milestone.status === 'done';

    if (stageDone) {
      completedStagesCount += 1;
    }

    const blueprintStage = blueprint.stages[idx];
    const stageSkills = [
      ...(milestone.skills_covered ?? []),
      ...(milestone.skills_covered?.length ? [] : blueprintStage?.skills ?? []),
    ]
      .map((s) => s.trim())
      .filter(Boolean);

    // Track concise completed task subjects only when they represent real skills (never full milestone titles)
    const completedTaskSubjects = stageTasks
      .filter((t) => t.done_at != null && t.subject?.trim() && isConciseSkillLabel(t.subject, milestone.title))
      .map((t) => t.subject.trim());

    for (const rawName of stageSkills) {
      const key = normalizeSkillKey(rawName);
      const existing = skillMap.get(key);
      if (!existing) {
        skillMap.set(key, {
          name: rawName,
          stageTitle: milestone.title,
          stagePosition: milestone.position || idx + 1,
          category: blueprint.category,
          isUnlocked: stageDone,
        });
      } else if (stageDone && !existing.isUnlocked) {
        skillMap.set(key, { ...existing, isUnlocked: true });
      }
    }

    if (stageDone) {
      for (const subject of completedTaskSubjects) {
        const key = normalizeSkillKey(subject);
        if (!skillMap.has(key)) {
          skillMap.set(key, {
            name: subject,
            stageTitle: milestone.title,
            stagePosition: milestone.position || idx + 1,
            category: blueprint.category,
            isUnlocked: true,
          });
        }
      }
    }
  });

  // Ensure role-level skills also appear if roadmap milestones were sparse
  for (const roleSkill of blueprint.skills) {
    const clean = roleSkill.trim();
    if (!clean) continue;
    const key = normalizeSkillKey(clean);
    if (!skillMap.has(key)) {
      skillMap.set(key, {
        name: clean,
        stageTitle: 'Career Foundation',
        stagePosition: 1,
        category: blueprint.category,
        isUnlocked: completedStagesCount > 0 && progressPct >= 100,
      });
    }
  }

  const skillItems = Array.from(skillMap.values());
  const achievedSkills = skillItems.filter((item) => item.isUnlocked).map((item) => item.name);
  const upcomingSkills = skillItems.filter((item) => !item.isUnlocked).map((item) => item.name);

  return {
    totalTasks,
    completedTasks,
    progressPct,
    isUnlocked,
    tasksNeededToUnlock,
    completedStagesCount,
    totalStagesCount: sortedMilestones.length,
    achievedSkills,
    upcomingSkills,
    skillItems,
  };
}

/**
 * Converts RoadmapJobMarketProgression into Skill[] compatible with vacancy matching logic.
 */
export function buildProgressionSkillsList(progression: RoadmapJobMarketProgression): Skill[] {
  return progression.skillItems.map((item, idx) => ({
    id: `roadmap-skill-${idx}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: item.name,
    category: `Stage ${String(item.stagePosition).padStart(2, '0')} · ${item.stageTitle}`,
    is_acquired: item.isUnlocked,
  }));
}
