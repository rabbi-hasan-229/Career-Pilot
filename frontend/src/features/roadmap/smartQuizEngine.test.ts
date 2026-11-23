import { describe, expect, it } from 'vitest';
import type { Milestone, Task } from '../../types';
import { buildSmartCheckpointQuiz } from './smartQuizEngine';

function sampleStage(index: number, skillA: string, skillB: string): {
  milestone: Milestone;
  stageTasks: Task[];
  checkpointTask: Task;
} {
  const milestone: Milestone = {
    id: `m-${index}`,
    roadmap_id: 'r1',
    user_id: 'u1',
    title: `Stage ${index + 1}: ${skillA} & ${skillB}`,
    position: index + 1,
    start_date: '2026-01-01',
    end_date: '2026-01-14',
    status: 'doing',
    skills_covered: [skillA, skillB],
  };
  const stageTasks: Task[] = [
    {
      id: `learn-${index}`,
      milestone_id: milestone.id,
      user_id: 'u1',
      title: `Study ${skillA} architecture`,
      subject: skillA,
      type: 'Learn',
      due_date: '2026-01-03',
      est_minutes: 45,
      progress_pct: 100,
    },
    {
      id: `build-${index}`,
      milestone_id: milestone.id,
      user_id: 'u1',
      title: `Build ${skillA} & ${skillB} service module`,
      subject: skillB,
      type: 'Build',
      due_date: '2026-01-06',
      est_minutes: 60,
      progress_pct: 100,
    },
    {
      id: `practice-${index}`,
      milestone_id: milestone.id,
      user_id: 'u1',
      title: `Test ${skillB} failure recovery`,
      subject: skillB,
      type: 'Practice',
      due_date: '2026-01-09',
      est_minutes: 45,
      progress_pct: 100,
    },
    {
      id: `cp-${index}`,
      milestone_id: milestone.id,
      user_id: 'u1',
      title: `Week ${index + 1} Checkpoint: Ship verified ${skillA} integration`,
      subject: milestone.title,
      type: 'Checkpoint',
      due_date: '2026-01-12',
      est_minutes: 45,
      progress_pct: 0,
    },
  ];
  return { milestone, stageTasks, checkpointTask: stageTasks[3] };
}

describe('smartQuizEngine', () => {
  it('generates 3 distinct stage-specific questions and shuffles answer positions across stages', () => {
    const stages = [
      sampleStage(0, 'TypeScript', 'React State'),
      sampleStage(1, 'PostgreSQL', 'Indexing'),
      sampleStage(2, 'Docker', 'CI Pipelines'),
      sampleStage(3, 'OAuth', 'Observability'),
    ];

    const correctPositions = new Set<string>();
    const q1Texts = new Set<string>();

    stages.forEach((s, idx) => {
      const quiz = buildSmartCheckpointQuiz({
        task: s.checkpointTask,
        milestone: s.milestone,
        stageTasks: s.stageTasks,
        roleTitle: 'Full Stack Engineer',
        category: 'Software & Web',
        stageIndex: idx,
        totalStages: stages.length,
      });

      expect(quiz.questions).toHaveLength(3);
      q1Texts.add(quiz.questions![0].question);
      quiz.questions!.forEach((q) => {
        expect(q.options).toHaveLength(4);
        const correct = q.options.filter((o) => o.is_correct);
        expect(correct).toHaveLength(1);
        correctPositions.add(correct[0].id);
      });
    });

    // Different questions per stage and varied correct option letters (not locked to one letter)
    expect(q1Texts.size).toBe(4);
    expect(correctPositions.size).toBeGreaterThanOrEqual(2);
  });

  it('preserves a database-backed server question as Question 1 alongside extra stage questions', () => {
    const s = sampleStage(0, 'SQL Joins', 'RLS');
    const serverTask: Task = {
      ...s.checkpointTask,
      quiz: {
        id: '11111111-2222-3333-4444-555555555555',
        task_id: s.checkpointTask.id,
        question: 'Server DB question text',
        options: [
          { id: 'a', text: 'Opt A' },
          { id: 'b', text: 'Opt B' },
          { id: 'c', text: 'Opt C' },
          { id: 'd', text: 'Opt D' },
        ],
        explanation: 'Server explanation',
      },
    };

    const enriched = buildSmartCheckpointQuiz({
      task: serverTask,
      milestone: s.milestone,
      stageTasks: s.stageTasks,
      roleTitle: 'Backend Specialist',
      category: 'Software & Web',
      stageIndex: 0,
      totalStages: 6,
    });

    expect(enriched.id).toBe('11111111-2222-3333-4444-555555555555');
    expect(enriched.questions).toHaveLength(3);
    expect(enriched.questions![0].requiresServerRpc).toBe(true);
    expect(enriched.questions![0].question).toBe('Server DB question text');
    expect(enriched.questions![1].requiresServerRpc).toBe(false);
  });
});
