import { describe, it, expect } from 'vitest';
import {
  comprehensiveCareerCatalog,
} from './careerCatalog';
import {
  generateRoadmapForRole,
  generateTasksForMilestones,
  applyQuickPlannerAction,
} from './plannerEngine';
import { domainQuizTemplates } from './domainCheckpointQuizTemplates';
import { getLocalDateOnly, addMonthsToDateOnly } from '../../lib/dateOnly';

describe('209 Curated Roles Curriculum & Quality Audit', () => {
  const today = getLocalDateOnly();
  const targetDate = addMonthsToDateOnly(today, 6);

  it('verifies that every single curated role generates a complete, valid roadmap and task structure', () => {
    expect(comprehensiveCareerCatalog.length).toBeGreaterThanOrEqual(209);

    for (const role of comprehensiveCareerCatalog) {
      // 1. Generate roadmap
      const milestones = generateRoadmapForRole(
        role.title,
        6,
        60,
        targetDate,
        'beginner',
        role.category
      );

      expect(
        milestones.length,
        `Role "${role.title}" (${role.slug}) should have at least 4 milestones`
      ).toBeGreaterThanOrEqual(4);

      // Verify date ordering
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        expect(m.start_date <= m.end_date, `Milestone ${m.id} in role ${role.slug} has invalid date range`).toBe(true);
        if (i > 0) {
          expect(
            milestones[i - 1].end_date <= m.start_date,
            `Milestone ${i} in role ${role.slug} starts before previous milestone ends`
          ).toBe(true);
        }
      }

      // 2. Generate tasks
      const tasks = generateTasksForMilestones(milestones, role.title, 'beginner', role.category);
      expect(
        tasks.length,
        `Role "${role.title}" (${role.slug}) should have tasks`
      ).toBeGreaterThanOrEqual(milestones.length * 2);

      const checkpoints = tasks.filter((t) => t.type === 'Checkpoint');
      expect(
        checkpoints.length,
        `Role "${role.title}" (${role.slug}) must have checkpoint tasks`
      ).toBeGreaterThan(0);

      // 3. Verify checkpoint quiz templates
      for (const cp of checkpoints) {
        expect(
          cp.quiz_template_id,
          `Checkpoint task "${cp.title}" in role ${role.slug} must have quiz_template_id`
        ).toBeTruthy();

        // Either domain template or featured role template
        const templateId = cp.quiz_template_id!;
        const isDomainTemplate = templateId in domainQuizTemplates;
        const isFeaturedTemplate = /^cp_(?:full_stack|frontend|backend|nextjs|vue|rust|dotnet)_p[1-4]$/.test(templateId);

        expect(
          isDomainTemplate || isFeaturedTemplate,
          `Template ${templateId} in role ${role.slug} must be registered`
        ).toBe(true);
      }

      // 4. Verify quick actions
      const behindResult = applyQuickPlannerAction(milestones, tasks, 'behind');
      expect(behindResult.updatedMilestones.length).toBe(milestones.length);

      const pauseResult = applyQuickPlannerAction(milestones, tasks, 'pause');
      expect(pauseResult.updatedMilestones.length).toBe(milestones.length);
    }
  });
});
