import { describe, it, expect } from 'vitest';
import {
  comprehensiveCareerCatalog,
  careerCategories,
  getOrCreateCareerBlueprint,
  type CareerCategory,
} from './careerCatalog';

const VALID_CATEGORIES: CareerCategory[] = [
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

describe('careerCatalog', () => {
  it('contains at least 209 curated roles', () => {
    expect(comprehensiveCareerCatalog.length).toBeGreaterThanOrEqual(209);
  });

  it('contains all 12 domain categories in careerCategories list', () => {
    const categoryIds = careerCategories.map((c) => c.id).filter((id) => id !== 'all');
    expect(categoryIds).toHaveLength(12);
    for (const validCat of VALID_CATEGORIES) {
      expect(categoryIds).toContain(validCat);
    }
  });

  it('verifies that every curated role has valid, well-formed properties', () => {
    const slugs = new Set<string>();

    for (const role of comprehensiveCareerCatalog) {
      expect(role.id, `Role ${role.title} should have an id`).toBeTruthy();
      expect(role.title, `Role should have a non-empty title`).toBeTruthy();
      expect(role.slug, `Role ${role.title} should have a slug`).toBeTruthy();
      expect(slugs.has(role.slug), `Duplicate slug detected: ${role.slug}`).toBe(false);
      slugs.add(role.slug);

      expect(VALID_CATEGORIES).toContain(role.category);
      expect(role.effortHours, `Role ${role.slug} effortHours should be positive`).toBeGreaterThan(0);
      expect(role.skills.length, `Role ${role.slug} must have at least one skill`).toBeGreaterThan(0);
      expect(role.stages.length, `Role ${role.slug} must have at least 4 stages`).toBeGreaterThanOrEqual(4);

      for (const stage of role.stages) {
        expect(stage.title).toBeTruthy();
        expect(stage.effortHours).toBeGreaterThan(0);
      }
    }
  });

  it('verifies every category has multiple curated roles represented', () => {
    const categoryCounts: Record<string, number> = {};
    for (const cat of VALID_CATEGORIES) {
      categoryCounts[cat] = 0;
    }
    for (const role of comprehensiveCareerCatalog) {
      categoryCounts[role.category] = (categoryCounts[role.category] || 0) + 1;
    }

    for (const cat of VALID_CATEGORIES) {
      expect(categoryCounts[cat], `Category ${cat} should have at least 5 roles`).toBeGreaterThanOrEqual(5);
    }
  });

  describe('getOrCreateCareerBlueprint', () => {
    it('returns exact blueprint for a curated role by title or slug', () => {
      const blueprintByTitle = getOrCreateCareerBlueprint('Full Stack Engineer');
      expect(blueprintByTitle.title).toBe('Full Stack Engineer');
      expect(blueprintByTitle.category).toBe('Software & Web');

      const blueprintBySlug = getOrCreateCareerBlueprint('full-stack-engineer');
      expect(blueprintBySlug.title).toBe('Full Stack Engineer');
    });

    it('creates a synthesized blueprint for unknown / custom roles', () => {
      const customBlueprint = getOrCreateCareerBlueprint('Quantum Systems Integrator', 'Hardware & Robotics');
      expect(customBlueprint.title).toBe('Quantum Systems Integrator');
      expect(customBlueprint.category).toBe('Hardware & Robotics');
      expect(customBlueprint.stages).toHaveLength(4);
      expect(customBlueprint.effortHours).toBeGreaterThan(0);
    });

    it('infers an appropriate category for custom roles when no category is supplied', () => {
      const mlCustom = getOrCreateCareerBlueprint('Custom Deep Learning Scientist');
      expect(mlCustom.category).toBe('AI & Data Science');

      const securityCustom = getOrCreateCareerBlueprint('Cloud Security Analyst');
      expect(['Cybersecurity', 'Cloud & DevOps']).toContain(securityCustom.category);
    });
  });
});
