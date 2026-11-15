import { describe, it, expect } from 'vitest';
import {
  getCheckpointQuizTemplateId,
} from './checkpointQuizCatalog';
import { domainQuizTemplates } from './domainCheckpointQuizTemplates';
import { attachDemoCheckpointQuizzes } from './demoCheckpointQuizzes';
import type { CareerCategory } from './careerCatalog';
import type { Task } from '../../types';

describe('checkpointQuizCatalog', () => {
  const categories: CareerCategory[] = [
    'Software & Web',
    'AI & Data Science',
    'Cloud & DevOps',
    'Cybersecurity',
    'Mobile & Multiplatform',
    'Game Dev & 3D',
    'UI/UX & Product Design',
    'Product & Agile Leadership',
    'QA & Reliability',
    'FinTech & Web3',
    'Hardware & Robotics',
    'Enterprise & Applied Tech',
  ];

  describe('getCheckpointQuizTemplateId', () => {
    it('returns phase 1..4 appropriately as week progresses through the curriculum', () => {
      const totalWeeks = 16;
      expect(getCheckpointQuizTemplateId('unknown-role', 0, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p1');
      expect(getCheckpointQuizTemplateId('unknown-role', 3, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p1');
      expect(getCheckpointQuizTemplateId('unknown-role', 4, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p2');
      expect(getCheckpointQuizTemplateId('unknown-role', 7, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p2');
      expect(getCheckpointQuizTemplateId('unknown-role', 8, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p3');
      expect(getCheckpointQuizTemplateId('unknown-role', 11, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p3');
      expect(getCheckpointQuizTemplateId('unknown-role', 12, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p4');
      expect(getCheckpointQuizTemplateId('unknown-role', 15, totalWeeks, 'Software & Web')).toBe('cp_domain_software_p4');
    });

    it('returns featured role prefixes for recognized role slugs', () => {
      expect(getCheckpointQuizTemplateId('full-stack-engineer', 0, 16)).toBe('cp_full_stack_p1');
      expect(getCheckpointQuizTemplateId('frontend-engineer', 0, 16)).toBe('cp_frontend_p1');
      expect(getCheckpointQuizTemplateId('backend-specialist', 0, 16)).toBe('cp_backend_p1');
      expect(getCheckpointQuizTemplateId('next-js-full-stack-specialist', 0, 16)).toBe('cp_nextjs_p1');
      expect(getCheckpointQuizTemplateId('vue-js-nuxt-3-developer', 0, 16)).toBe('cp_vue_p1');
      expect(getCheckpointQuizTemplateId('rust-systems-programmer', 0, 16)).toBe('cp_rust_p1');
      expect(getCheckpointQuizTemplateId('c-net-cloud-architect', 0, 16)).toBe('cp_dotnet_p1');
    });

    it('returns valid domain templates for all 12 career categories', () => {
      for (const cat of categories) {
        for (let phase = 1; phase <= 4; phase++) {
          const weekIndex = (phase - 1) * 4;
          const templateId = getCheckpointQuizTemplateId('generic-specialist', weekIndex, 16, cat);
          expect(templateId).toMatch(/_p[1-4]$/);
        }
      }
    });
  });

  describe('domainQuizTemplates content quality', () => {
    it('verifies that every domain quiz template has quality questions and valid options', () => {
      const templateEntries = Object.entries(domainQuizTemplates);
      expect(templateEntries.length).toBe(48); // 12 categories * 4 phases = 48 templates

      for (const [id, template] of templateEntries) {
        expect(template.question, `Template ${id} must have question`).toBeTruthy();
        expect(template.question).toContain('{checkpoint}');
        expect(template.options).toHaveLength(4);

        const optionIds = template.options.map((o) => o.id);
        expect(optionIds).toEqual(['a', 'b', 'c', 'd']);
        for (const opt of template.options) {
          expect(opt.text.trim().length, `Option ${opt.id} in ${id} must not be empty`).toBeGreaterThan(0);
        }

        expect(['a', 'b', 'c', 'd']).toContain(template.correct);
        expect(template.explanation, `Template ${id} must have explanation`).toBeTruthy();
      }
    });
  });

  describe('attachDemoCheckpointQuizzes', () => {
    it('attaches quizzes to checkpoint tasks while leaving non-checkpoint tasks unchanged', () => {
      const sampleTasks: Task[] = [
        {
          id: 't1',
          milestone_id: 'm1',
          user_id: 'demo-user',
          title: 'Learn modern React 19 architecture',
          subject: 'Engineering',
          type: 'Learn',
          due_date: '2026-05-10',
          est_minutes: 60,
          progress_pct: 0,
        },
        {
          id: 't2',
          milestone_id: 'm1',
          user_id: 'demo-user',
          title: 'Publish tested e-commerce API',
          subject: 'Engineering',
          type: 'Checkpoint',
          due_date: '2026-05-10',
          est_minutes: 60,
          progress_pct: 0,
          quiz_template_id: 'cp_domain_software_p1',
        },
      ];

      const processed = attachDemoCheckpointQuizzes(sampleTasks);
      expect(processed[0].quiz).toBeUndefined();
      expect(processed[1].quiz).toBeDefined();
      expect(processed[1].quiz?.task_id).toBe('t2');
      expect(processed[1].quiz?.question).toContain('Publish tested e-commerce API');
      expect(processed[1].quiz?.options).toHaveLength(4);
      expect(processed[1].quiz?.explanation).toBeTruthy();
    });
  });
});
