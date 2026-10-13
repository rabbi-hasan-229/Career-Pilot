import React, { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import type { InterviewQuestion, InterviewAttempt } from '../types';

const sampleQuestions: InterviewQuestion[] = [
  {
    id: 'bbbb0001-0000-0000-0000-000000000001',
    round: 'Behavioral',
    difficulty: 'Mid',
    question: 'Tell me about a time you had to deal with an unexpected production incident or performance bottleneck. How did you diagnose and resolve it?',
    expected_keywords: ['diagnosed', 'monitored', 'metrics', 'root cause', 'rollback', 'post-mortem', 'collaborated', 'latency'],
    rubric: { situation: true, task: true, action: true, result: true },
    model_answer: 'Situation: High latency spiked to 4s during peak traffic due to unindexed queries saturating connection pools. Task: Restore service within SLA. Action: Identified slow queries in pg_stat_statements, deployed partial indexes, and enabled PgBouncer. Result: Latency dropped by 92% to 120ms with zero downtime.',
  },
  {
    id: 'bbbb0002-0000-0000-0000-000000000002',
    round: 'Technical',
    difficulty: 'Senior',
    question: 'How do you design database indexes in PostgreSQL to optimize range queries without degrading write throughput?',
    expected_keywords: ['b-tree', 'selectivity', 'write amplification', 'partial index', 'composite', 'vacuum', 'explain analyze'],
    rubric: { situation: false, task: true, action: true, result: true },
    model_answer: 'B-Tree indexes are standard for range queries (<, >). To minimize write amplification, I use partial indexes targeting active status rows, place highest-selectivity columns first in composite indexes, and verify execution plans with EXPLAIN (ANALYZE, BUFFERS).',
  },
];

interface Props {
  onUseAICall?: () => void;
  aiPromptsLeft: number;
}

export const InterviewSimulatorView: React.FC<Props> = ({ onUseAICall, aiPromptsLeft }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(sampleQuestions[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [attemptResult, setAttemptResult] = useState<InterviewAttempt | null>(null);
  const [aiFeedbackText, setAiFeedbackText] = useState<string | null>(null);

  // Deterministic Zero-AI Scoring Engine (Docx Section 8)
  const handleScoreFreeAnswer = () => {
    if (!userAnswer.trim()) return;

    const lowerAnswer = userAnswer.toLowerCase();
    const matched = selectedQuestion.expected_keywords.filter((kw) =>
      lowerAnswer.includes(kw.toLowerCase())
    );

    // STAR Method Checklist checks
    const hasSituation = lowerAnswer.includes('situation') || lowerAnswer.includes('when') || lowerAnswer.includes('during') || lowerAnswer.includes('team');
    const hasTask = lowerAnswer.includes('task') || lowerAnswer.includes('goal') || lowerAnswer.includes('needed to') || lowerAnswer.includes('responsible');
    const hasAction = lowerAnswer.includes('action') || lowerAnswer.includes('implemented') || lowerAnswer.includes('built') || lowerAnswer.includes('optimized') || lowerAnswer.includes('deployed');
    const hasResult = lowerAnswer.includes('result') || lowerAnswer.includes('reduced') || lowerAnswer.includes('improved') || lowerAnswer.includes('%') || lowerAnswer.includes('latency');

    const starPoints = (hasSituation ? 15 : 0) + (hasTask ? 15 : 0) + (hasAction ? 20 : 0) + (hasResult ? 20 : 0);
    const keywordPoints = Math.round((matched.length / Math.max(1, selectedQuestion.expected_keywords.length)) * 30);
    const totalScore = Math.min(100, starPoints + keywordPoints);

    setAttemptResult({
      id: `att_${Date.now()}`,
      question_id: selectedQuestion.id,
      user_answer: userAnswer,
      score: totalScore,
      matched_keywords: matched,
      rubric_feedback: {
        situation: hasSituation,
        task: hasTask,
        action: hasAction,
        result: hasResult,
      },
    });
  };

  const handleRequestAIFeedback = () => {
    if (aiPromptsLeft <= 0) return;
    onUseAICall?.();
    setAiFeedbackText(
      `AI Coach Review: Solid technical framing! Your explanation effectively covered the root cause diagnosis. Recommendation: Emphasize business impact in the Result section (e.g., mention downtime avoided or customer impact) to stand out to hiring managers.`
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
              Zero-AI Interview Simulator (Docx Section 8)
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--md-text-primary)', margin: '4px 0' }}>
              Mock Interview Arena
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
              Instant keyword & STAR rubric scoring runs at <strong>$0 cost</strong> in SQL/Browser.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {sampleQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuestion(q);
                  setAttemptResult(null);
                  setAiFeedbackText(null);
                  setUserAnswer('');
                }}
                className={`m3-tab-pill ${selectedQuestion.id === q.id ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '6px 14px' }}
              >
                {q.round} ({q.difficulty})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="m3-hero-gradient-card" style={{ marginBottom: '20px', padding: '22px' }}>
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className="m3-hero-pill-badge">{selectedQuestion.round.toUpperCase()}</span>
            <span className="m3-hero-pill-badge" style={{ background: 'rgba(255,255,255,0.15)' }}>
              {selectedQuestion.difficulty} Level
            </span>
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.4 }}>
            "{selectedQuestion.question}"
          </h3>
        </div>
      </div>

      {/* Answer Input Pad */}
      <div className="m3-surface-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
            Your Answer (Structure with Situation, Task, Action, Result)
          </label>
          <button
            onClick={() => setUserAnswer('Situation: During our Black Friday launch, API latency spiked to 3.8s. Task: Identify root cause and fix connection pooling. Action: Diagnosed slow queries via metrics, monitored pg_stat_statements, deployed partial indexes, and configured connection pooling. Result: Reduced latency by 90% and resolved the bottleneck with zero downtime.')}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            Insert Sample Answer
          </button>
        </div>

        <textarea
          rows={5}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Speak or type your structured response here..."
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            border: '1.5px solid var(--md-outline)',
            background: 'var(--md-surface-variant)',
            fontFamily: 'var(--font-main)',
            fontSize: '13.5px',
            outline: 'none',
            color: 'var(--md-text-primary)',
            resize: 'vertical',
            marginBottom: '14px',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--md-text-secondary)', fontSize: '12px' }}>
            <Mic size={16} />
            <span>Voice input supported</span>
          </div>

          <button
            className="btn-m3-primary"
            onClick={handleScoreFreeAnswer}
            disabled={!userAnswer.trim()}
          >
            Evaluate Answer ($0 Free)
          </button>
        </div>
      </div>

      {/* Instant Scoring Results */}
      {attemptResult && (
        <div className="m3-surface-card" style={{ marginBottom: '20px', border: '2px solid var(--md-outline)' }}>
          {/* Score Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: attemptResult.score >= 70 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: attemptResult.score >= 70 ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 900,
                }}
              >
                {attemptResult.score}%
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                  {attemptResult.score >= 75 ? 'Strong Answer!' : 'Needs Structural Polish'}
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--md-text-secondary)' }}>
                  Scored via Keyword Match & STAR Structure Rubric
                </span>
              </div>
            </div>

            {/* Optional AI Feedback Button */}
            <button
              onClick={handleRequestAIFeedback}
              style={{
                background: 'var(--md-primary-container)',
                border: '1px solid var(--md-outline)',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--md-on-primary-container)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} />
              Get AI Deep Feedback (Metered)
            </button>
          </div>

          {/* STAR Rubric Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Situation', covered: attemptResult.rubric_feedback.situation },
              { label: 'Task', covered: attemptResult.rubric_feedback.task },
              { label: 'Action', covered: attemptResult.rubric_feedback.action },
              { label: 'Result', covered: attemptResult.rubric_feedback.result },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  padding: '8px 10px',
                  borderRadius: '12px',
                  background: r.covered ? 'rgba(16, 185, 129, 0.15)' : 'var(--md-surface-variant)',
                  border: `1px solid ${r.covered ? 'rgba(16, 185, 129, 0.4)' : 'var(--md-outline)'}`,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: r.covered ? '#10b981' : 'var(--md-text-muted)' }}>
                  {r.covered ? '✓ ' : '✕ '} {r.label}
                </span>
              </div>
            ))}
          </div>

          {/* Matched Keywords */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '6px' }}>
              KEYWORD RECOGNITION ({attemptResult.matched_keywords.length}/{selectedQuestion.expected_keywords.length} MATCHED)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedQuestion.expected_keywords.map((kw) => {
                const isMatched = attemptResult.matched_keywords.includes(kw);
                return (
                  <span
                    key={kw}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isMatched ? 'rgba(16, 185, 129, 0.2)' : 'var(--md-surface-variant)',
                      color: isMatched ? '#10b981' : 'var(--md-text-muted)',
                      border: `1px solid ${isMatched ? 'rgba(16, 185, 129, 0.4)' : 'var(--md-outline)'}`,
                    }}
                  >
                    {isMatched ? '✓ ' : ''}{kw}
                  </span>
                );
              })}
            </div>
          </div>

          {/* AI Deep Feedback Result */}
          {aiFeedbackText && (
            <div
              style={{
                background: 'var(--md-primary-container)',
                border: '1.5px solid var(--md-outline)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={15} color="#818cf8" />
                <strong style={{ fontSize: '12.5px', color: 'var(--md-on-primary-container)' }}>AI Senior Interviewer Feedback</strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--md-on-primary-container)', margin: 0, lineHeight: 1.45 }}>
                {aiFeedbackText}
              </p>
            </div>
          )}

          {/* Model Answer Showcase */}
          <div style={{ background: 'var(--md-surface-variant)', borderRadius: '14px', padding: '14px', border: '1px solid var(--md-outline)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>
              Verified Model Answer (Curated in Database)
            </span>
            <p style={{ fontSize: '12.5px', color: 'var(--md-text-primary)', marginTop: '4px', lineHeight: 1.45, fontStyle: 'italic' }}>
              "{selectedQuestion.model_answer}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
