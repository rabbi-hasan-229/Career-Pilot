import { describe, it, expect } from 'vitest';
import {
  analyzeCandidateResponse,
  buildInterviewLoopQueue,
  buildOpeningGreetingTurn,
  buildQuestionIntroTurn,
  buildSessionDebrief,
  extractFirstName,
  generateInterviewerTurn,
  type CandidateMemory,
} from './interviewSessionEngine';
import { getRoleTailoredInterviewQuestions } from './curatedInterviewCatalog';

describe('interviewSessionEngine', () => {
  const baseMemory: CandidateMemory = {
    firstName: 'Alex',
    targetRole: 'Next.js Full Stack Specialist',
    experienceLevel: 'junior',
    mentionedTools: [],
  };

  it('extracts clean first names and skips email addresses', () => {
    expect(extractFirstName('alex mercer')).toBe('Alex');
    expect(extractFirstName('alex@example.com')).toBeUndefined();
    expect(extractFirstName('')).toBeUndefined();
  });

  it('builds a balanced mixed interview loop tailored to the role', () => {
    const queue = buildInterviewLoopQueue({
      category: 'Software & Web',
      targetRole: 'Next.js Full Stack Specialist',
      focusMode: 'Mixed',
      difficulty: 'Adaptive',
      experienceLevel: 'junior',
      count: 4,
    });

    expect(queue).toHaveLength(4);
    const rounds = new Set(queue.map((q) => q.round));
    expect(rounds.has('Behavioral')).toBe(true);
    expect(rounds.has('Technical')).toBe(true);
    expect(rounds.has('System Design')).toBe(true);
  });

  it('personalizes opening greeting and carries warm-up context into Q1', () => {
    const greeting = buildOpeningGreetingTurn(baseMemory, 'Mixed');
    expect(greeting.text).toContain('Hi Alex');
    expect(greeting.text).toContain('Next.js Full Stack Specialist');

    const question = getRoleTailoredInterviewQuestions('Software & Web', 'Next.js Full Stack Specialist')[0];
    const intro = buildQuestionIntroTurn({
      question,
      questionIndex: 0,
      totalQuestions: 4,
      memory: {
        ...baseMemory,
        warmupSummary: 'I built a dashboard using Next.js and PostgreSQL.',
        mentionedTools: ['Next.js', 'PostgreSQL'],
      },
      transitionFromWarmup: true,
    });

    expect(intro.text).toContain('Next.js and PostgreSQL');
    expect(intro.text).toContain(question.question);
  });

  it('handles clarification requests without penalizing or completing the question', () => {
    const question = getRoleTailoredInterviewQuestions('Software & Web', 'Backend Specialist', 'Technical')[0];
    const outcome = generateInterviewerTurn({
      question,
      previousUserTurnsForQuestion: [],
      latestAnswer: 'Could you clarify what scale of traffic we should assume here?',
      followUpCount: 0,
      memory: baseMemory,
    });

    expect(outcome.action).toBe('clarify');
    expect(outcome.evaluation).toBeUndefined();
    expect(outcome.interviewerTurn.kind).toBe('clarification');
  });

  it('provides an empathetic human scaffold when a candidate feels stuck', () => {
    const question = getRoleTailoredInterviewQuestions('Software & Web', 'Backend Specialist', 'Technical')[0];
    const outcome = generateInterviewerTurn({
      question,
      previousUserTurnsForQuestion: [],
      latestAnswer: "I'm honestly not sure where to start.",
      followUpCount: 0,
      memory: baseMemory,
    });

    expect(outcome.action).toBe('ask_followup');
    expect(outcome.interviewerTurn.text.toLowerCase()).toContain('break this down');
  });

  it('asks contextual follow-up referencing tools mentioned by the candidate and evaluates after follow-up', () => {
    const question = getRoleTailoredInterviewQuestions('Software & Web', 'Backend Specialist', 'Technical')[0];
    const firstReply =
      'When an API endpoint slowed down during morning peak, I profiled PostgreSQL queries and added Redis caching to cut latency by 45%.';

    const sig = analyzeCandidateResponse(firstReply);
    expect(sig.mentionedTools).toContain('PostgreSQL');
    expect(sig.metrics).toContain('45%');

    const firstTurn = generateInterviewerTurn({
      question,
      previousUserTurnsForQuestion: [],
      latestAnswer: firstReply,
      followUpCount: 0,
      memory: { ...baseMemory, targetRole: 'Backend Specialist' },
    });

    expect(firstTurn.action).toBe('ask_followup');
    expect(firstTurn.interviewerTurn.text).toMatch(/PostgreSQL|45%/);

    const secondReply =
      'We chose Redis instead of in-memory node cache because we run multiple pods. If Redis times out, we fall back gracefully to the primary DB with a short circuit breaker.';
    const finalTurn = generateInterviewerTurn({
      question,
      previousUserTurnsForQuestion: [firstReply],
      latestAnswer: secondReply,
      followUpCount: 1,
      memory: { ...baseMemory, targetRole: 'Backend Specialist' },
    });

    expect(finalTurn.action).toBe('complete_question');
    expect(finalTurn.evaluation).toBeDefined();
    expect(finalTurn.evaluation!.score).toBeGreaterThanOrEqual(65);

    const debrief = buildSessionDebrief([finalTurn.evaluation!], baseMemory);
    expect(debrief.questionsCompleted).toBe(1);
    expect(debrief.dimensions).toHaveLength(3);
    expect(debrief.overallScore).toBe(finalTurn.evaluation!.score);
  });
});
