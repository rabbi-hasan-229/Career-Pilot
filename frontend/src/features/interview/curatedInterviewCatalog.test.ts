import { describe, it, expect } from 'vitest';
import {
  CURATED_INTERVIEW_CATALOG,
  getCuratedInterviewQuestions,
  getQuestionCoachingHint,
  getQuestionFollowUpProbes,
  getRoleTailoredInterviewQuestions,
  scoreDeterministicInterviewAnswer,
  type CuratedInterviewQuestion,
} from './curatedInterviewCatalog';
import type { CareerCategory } from '../roadmap/careerCatalog';

const ALL_CATEGORIES: CareerCategory[] = [
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

describe('curatedInterviewCatalog', () => {
  it('contains at least 72 calibrated questions across 12 categories', () => {
    expect(CURATED_INTERVIEW_CATALOG.length).toBeGreaterThanOrEqual(72);
  });

  it('provides at least 6 diverse questions for every category (Behavioral, Technical, System Design)', () => {
    for (const category of ALL_CATEGORIES) {
      const questions = getCuratedInterviewQuestions(category);
      expect(questions.length, `Category ${category} should have at least 6 questions`).toBeGreaterThanOrEqual(6);

      const rounds = new Set(questions.map((q) => q.round));
      expect(rounds.has('Behavioral')).toBe(true);
      expect(rounds.has('Technical')).toBe(true);
      expect(rounds.has('System Design')).toBe(true);

      const difficulties = new Set(questions.map((q) => q.difficulty));
      expect(difficulties.has('Junior')).toBe(true);
      expect(difficulties.has('Mid')).toBe(true);
      expect(difficulties.has('Senior')).toBe(true);
    }
  });

  it('verifies every question has valid fields, keywords, rubric, and model answers', () => {
    for (const q of CURATED_INTERVIEW_CATALOG) {
      expect(q.id).toBeTruthy();
      expect(q.question.trim().length).toBeGreaterThan(15);
      expect(q.expected_keywords.length).toBeGreaterThanOrEqual(3);
      expect(q.model_answer.trim().length).toBeGreaterThan(30);
      expect(q.rubric.situation).toBe(true);
      expect(q.rubric.task).toBe(true);
      expect(q.rubric.action).toBe(true);
      expect(q.rubric.result).toBe(true);
    }
  });

  describe('scoreDeterministicInterviewAnswer', () => {
    const sampleQuestion: CuratedInterviewQuestion = {
      id: 'test-q1',
      role_category: 'Software & Web',
      round: 'Behavioral',
      difficulty: 'Junior',
      question: 'Tell me about a feature you delivered.',
      expected_keywords: ['acceptance criteria', 'api contract', 'tests', 'user outcome'],
      rubric: { situation: true, task: true, action: true, result: true },
      model_answer: 'Model answer text.',
    };

    it('scores 0 structure points when answer is empty or lacks STAR components', () => {
      const evaluated = scoreDeterministicInterviewAnswer(sampleQuestion, 'I do not know.');
      expect(evaluated.score).toBe(0);
      expect(evaluated.rubric_feedback.situation).toBe(false);
      expect(evaluated.rubric_feedback.task).toBe(false);
      expect(evaluated.rubric_feedback.action).toBe(false);
      expect(evaluated.rubric_feedback.result).toBe(false);
      expect(evaluated.matched_keywords).toHaveLength(0);
    });

    it('awards full STAR structure points and keyword points when all criteria are met', () => {
      const fullAnswer = `
        During my previous project situation, the context was slow form submissions.
        My assigned task and goal was to resolve validation delays.
        I took action: built and implemented debounced validation against the api contract,
        conformed to acceptance criteria, and added integration tests.
        As a result, we improved response times, achieved positive user outcome, and reduced errors by 45%.
      `;

      const evaluated = scoreDeterministicInterviewAnswer(sampleQuestion, fullAnswer);
      expect(evaluated.rubric_feedback.situation).toBe(true);
      expect(evaluated.rubric_feedback.task).toBe(true);
      expect(evaluated.rubric_feedback.action).toBe(true);
      expect(evaluated.rubric_feedback.result).toBe(true);

      // Structure points: 15 + 15 + 20 + 20 = 70.
      // Expected keywords matched: 'acceptance criteria', 'api contract', 'tests', 'user outcome' = 4/4 => 30 keyword points.
      // Total = 100
      expect(evaluated.score).toBe(100);
      expect(evaluated.matched_keywords.length).toBe(4);
    });

    it('detects numerical percentage results accurately', () => {
      const answerWithPercentage = `
        In this scenario, my objective was optimization.
        I tested and deployed caching changes.
        Latency dropped by 35%.
      `;

      const evaluated = scoreDeterministicInterviewAnswer(
        { ...sampleQuestion, round: 'Technical' },
        answerWithPercentage
      );
      expect(evaluated.rubric_feedback.result).toBe(true);
    });
  });

  describe('role-tailored questions & probes', () => {
    it('prioritizes distinct specialized questions for Frontend vs Backend target roles', () => {
      const feQuestions = getRoleTailoredInterviewQuestions('Software & Web', 'Frontend Engineer');
      const beQuestions = getRoleTailoredInterviewQuestions('Software & Web', 'Backend Specialist');

      expect(feQuestions.length).toBeGreaterThanOrEqual(6);
      expect(beQuestions.length).toBeGreaterThanOrEqual(6);
      expect(feQuestions[0].id).not.toBe(beQuestions[0].id);

      const probes = getQuestionFollowUpProbes(feQuestions[0], 'Frontend Engineer');
      expect(probes.length).toBeGreaterThanOrEqual(1);
      const hint = getQuestionCoachingHint(feQuestions[0], 'Frontend Engineer');
      expect(hint.trim().length).toBeGreaterThan(20);
    });

    it('prioritizes Python-specific questions when targetRole is Python Software Engineer with role skills', () => {
      const pyQuestions = getRoleTailoredInterviewQuestions(
        'Software & Web',
        'Python Software Engineer',
        undefined,
        ['Python 3.12', 'FastAPI', 'Django', 'SQLAlchemy', 'PyTest', 'Asyncio']
      );

      expect(pyQuestions[0].id).toMatch(/^spec-py-/);
      expect(pyQuestions.slice(0, 4).every((q) => q.id.startsWith('spec-py-'))).toBe(true);
    });
  });
});

