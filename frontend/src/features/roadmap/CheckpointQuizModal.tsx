import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task, TaskQuizQuestion } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';

type QuizCompletion = { persisted: boolean; currentStreak?: number };

interface Props {
  task: Task;
  isDemo: boolean;
  onClose: () => void;
  onPassTask: (taskId: string, completion?: QuizCompletion) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const CheckpointQuizModal: React.FC<Props> = ({
  task,
  isDemo,
  onClose,
  onPassTask,
}) => {
  const dialogRef = useAccessibleDialog(true, onClose);
  const quiz = task.quiz;

  const questions: TaskQuizQuestion[] = quiz
    ? quiz.questions && quiz.questions.length > 0
      ? quiz.questions
      : [
          {
            id: quiz.id,
            question: quiz.question,
            options: quiz.options,
            explanation: quiz.explanation,
            requiresServerRpc:
              !isDemo && !quiz.id.startsWith('demo_quiz_') && !quiz.id.startsWith('local_quiz_'),
          },
        ]
    : [];

  const totalQuestions = questions.length;
  const passThreshold = totalQuestions >= 3 ? 2 : totalQuestions;

  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [serverPassed, setServerPassed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number | undefined>();
  const [persistedByServer, setPersistedByServer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (!quiz || totalQuestions === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1500,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={isDemo ? `Confirm completion of ${task.title}` : `Checkpoint unavailable for ${task.title}`}
          tabIndex={-1}
          style={{
            background: 'var(--md-surface, #FFFFFF)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            color: 'var(--md-text-primary, #0F172A)',
            border: '1px solid var(--md-outline, #E2E8F0)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>
            {isDemo ? 'Mark Task Complete' : 'Checkpoint unavailable'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--md-text-secondary, #64748B)', margin: '0 0 16px 0' }}>
            {isDemo
              ? <>Confirm completion of: <strong>{task.title}</strong></>
              : <>This checkpoint assessment could not be loaded. Close this dialog and retry after your roadmap refreshes.</>}
          </p>
          <button
            type="button"
            onClick={() => {
              if (isDemo) onPassTask(task.id, { persisted: false });
              onClose();
            }}
            style={{
              width: '100%',
              background: 'var(--md-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {isDemo ? 'Mark Done' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[questionIdx];
  const requiresServerRpc = Boolean(currentQuestion.requiresServerRpc);
  const needsServerPass = questions.some((q) => q.requiresServerRpc);
  const overallPassed =
    correctCount >= passThreshold && (!needsServerPass || serverPassed);

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleVerifyAnswer = async () => {
    if (!selectedOptionId || isSubmitting) return;
    const chosen = currentQuestion.options.find((o) => o.id === selectedOptionId);
    setSubmitError('');
    setIsSubmitting(true);

    let correct: boolean;
    let correctId: string | null = null;
    let resultFeedback = currentQuestion.explanation;
    let streak: number | undefined;
    let serverPersisted = false;

    if (requiresServerRpc) {
      const { data, error } = await supabase.rpc('submit_task_quiz', {
        p_task_id: task.id,
        p_selected_option: selectedOptionId,
      });
      if (error) {
        const isMissingRpc =
          error.code === 'PGRST202' ||
          error.code === '42883' ||
          /could not find the function|does not exist/i.test(error.message || '');
        const hasLocalCorrectFlag = currentQuestion.options.some(
          (option) => typeof option.is_correct === 'boolean'
        );
        if (isMissingRpc && hasLocalCorrectFlag) {
          correct = Boolean(chosen?.is_correct);
          correctId = currentQuestion.options.find((option) => option.is_correct)?.id ?? null;
        } else {
          setSubmitError(error.message || 'Could not verify your answer. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = data as {
          is_correct: boolean;
          correct_option_id: string;
          explanation: string;
          current_streak: number;
        };
        correct = result.is_correct;
        correctId = result.correct_option_id;
        resultFeedback = result.explanation || currentQuestion.explanation;
        streak = result.current_streak;
        serverPersisted = true;
      }
    } else {
      correct = Boolean(chosen?.is_correct);
      correctId = currentQuestion.options.find((option) => option.is_correct)?.id ?? null;
    }

    setCorrectOptionId(correctId);
    setFeedback(resultFeedback);
    if (streak !== undefined) setCurrentStreak(streak);
    if (serverPersisted && correct) {
      setPersistedByServer(true);
      setServerPassed(true);
    }
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
    setIsCurrentCorrect(correct);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleRetryCurrentServerQuestion = () => {
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setIsCurrentCorrect(false);
    setCorrectOptionId(null);
    setFeedback('');
    setSubmitError('');
  };

  const handleAdvance = () => {
    if (questionIdx + 1 < totalQuestions) {
      setQuestionIdx((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsSubmitted(false);
      setIsCurrentCorrect(false);
      setCorrectOptionId(null);
      setFeedback('');
      setSubmitError('');
      return;
    }

    setShowSummary(true);
    if (overallPassed) {
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#123C69', '#10B981', '#38BDF8'],
        });
      } catch {
        // Ignore confetti failures in test/headless mode
      }
    }
  };

  const handleRetakeQuiz = () => {
    setQuestionIdx(0);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setIsCurrentCorrect(false);
    setCorrectOptionId(null);
    setFeedback('');
    setSubmitError('');
    setCorrectCount(0);
    setServerPassed(false);
    setShowSummary(false);
  };

  const handleCompleteStage = () => {
    if (overallPassed) {
      onPassTask(task.id, { persisted: persistedByServer, currentStreak });
    }
    onClose();
  };

  const progressFraction = showSummary
    ? 100
    : Math.round(((questionIdx + (isSubmitted ? 1 : 0)) / totalQuestions) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Checkpoint assessment for ${task.title}`}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '510px',
          background: 'var(--md-surface, #FFFFFF)',
          borderRadius: '22px',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--md-outline, #E2E8F0)',
          color: 'var(--md-text-primary, #0F172A)',
          display: 'grid',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'var(--md-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--md-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stage Checkpoint
                </span>
                {!showSummary && totalQuestions > 1 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-muted)' }}>
                    · Question {questionIdx + 1} of {totalQuestions}
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontSize: '14.5px',
                  fontWeight: 800,
                  margin: '2px 0 0',
                  color: 'var(--md-text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {task.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkpoint quiz"
            style={{
              background: 'var(--md-surface-variant, #F1F5F9)',
              border: '1px solid var(--md-outline, #E2E8F0)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-text-secondary, #64748B)',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Multi-Question Progress Bar */}
        {totalQuestions > 1 && (
          <div style={{ display: 'grid', gap: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--md-text-secondary)',
              }}
            >
              <span>Score: {correctCount}/{totalQuestions} correct (need {passThreshold} to pass)</span>
              <span>{progressFraction}%</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${totalQuestions}, 1fr)`,
                gap: '6px',
              }}
            >
              {questions.map((q, idx) => {
                const isDone = showSummary || idx < questionIdx || (idx === questionIdx && isSubmitted);
                const isActive = !showSummary && idx === questionIdx;
                return (
                  <div
                    key={q.id}
                    style={{
                      height: '5px',
                      borderRadius: '9999px',
                      background: isDone
                        ? 'var(--md-primary)'
                        : isActive
                          ? 'var(--md-primary-light, #60A5FA)'
                          : 'var(--md-outline, #E2E8F0)',
                      transition: 'background 0.2s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {showSummary ? (
          /* Polished Executive Summary Screen */
          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              style={{
                padding: '22px 18px',
                borderRadius: '16px',
                border: `1px solid ${overallPassed ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                background: 'var(--md-surface-variant)',
                textAlign: 'center',
                display: 'grid',
                gap: '10px',
                justifyItems: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  background: overallPassed ? 'var(--md-success-bg)' : 'var(--md-error-bg)',
                  color: overallPassed ? 'var(--md-success)' : 'var(--md-error)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {overallPassed ? <Award size={26} /> : <AlertCircle size={26} />}
              </div>

              <div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--md-text-primary)',
                  }}
                >
                  {overallPassed ? 'Checkpoint Assessment Passed' : 'Review Needed Before Passing'}
                </div>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    color: 'var(--md-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {overallPassed
                    ? `You answered ${correctCount} of ${totalQuestions} questions correctly (${Math.round((correctCount / totalQuestions) * 100)}%).`
                    : `You scored ${correctCount} of ${totalQuestions}. At least ${passThreshold} correct answers are required to verify this stage.`}
                </p>
              </div>

              {overallPassed && currentStreak !== undefined && (
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--md-primary)',
                    background: 'var(--md-primary-container)',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}
                >
                  Active Streak: {currentStreak} day{currentStreak === 1 ? '' : 's'}
                </div>
              )}
            </div>

            {overallPassed ? (
              <button
                type="button"
                className="btn-m3-primary"
                onClick={handleCompleteStage}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Complete Stage Checkpoint</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-m3-primary"
                onClick={handleRetakeQuiz}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <RotateCcw size={15} />
                <span>Retake Assessment</span>
              </button>
            )}
          </div>
        ) : (
          /* Active Question View */
          <>
            <div
              style={{
                background: 'var(--md-surface-variant, #F8FAFC)',
                border: '1px solid var(--md-outline, #E2E8F0)',
                borderRadius: '14px',
                padding: '14px 16px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  fontWeight: 700,
                  lineHeight: 1.5,
                  color: 'var(--md-text-primary, #0F172A)',
                }}
              >
                {currentQuestion.question}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedOptionId === opt.id;
                const isRightOption = opt.id === correctOptionId;
                const isWrongSelection = isSubmitted && isSelected && !isRightOption;

                let border = '1px solid var(--md-outline, #E2E8F0)';
                let bg = 'var(--md-surface, #FFFFFF)';
                let badgeBg = 'var(--md-surface-variant, #F1F5F9)';
                let badgeColor = 'var(--md-text-secondary, #64748B)';

                if (isSubmitted) {
                  if (isRightOption) {
                    border = '1.5px solid #10B981';
                    bg = 'var(--md-success-bg, rgba(16, 185, 129, 0.1))';
                    badgeBg = '#10B981';
                    badgeColor = '#FFFFFF';
                  } else if (isWrongSelection) {
                    border = '1.5px solid #EF4444';
                    bg = 'var(--md-error-bg, rgba(239, 68, 68, 0.1))';
                    badgeBg = '#EF4444';
                    badgeColor = '#FFFFFF';
                  }
                } else if (isSelected) {
                  border = '1.5px solid var(--md-primary)';
                  bg = 'var(--md-primary-container)';
                  badgeBg = 'var(--md-primary)';
                  badgeColor = '#FFFFFF';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={isSubmitted}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '11px 13px',
                      borderRadius: '12px',
                      border,
                      background: bg,
                      cursor: isSubmitted ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '7px',
                          background: badgeBg,
                          color: badgeColor,
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {OPTION_LETTERS[optIdx] || opt.id.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected || (isSubmitted && isRightOption) ? 700 : 500,
                          color: 'var(--md-text-primary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {opt.text}
                      </span>
                    </span>
                    {isSubmitted && isRightOption && <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />}
                    {isWrongSelection && <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--md-surface-variant)',
                  border: `1px solid ${isCurrentCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.35)'}`,
                  fontSize: '12.5px',
                  color: 'var(--md-text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                {isCurrentCorrect ? (
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>
                    {isCurrentCorrect ? 'Correct Answer' : 'Concept Review'}
                  </strong>
                  <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--md-text-secondary)' }}>
                    {feedback}
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <p role="alert" style={{ color: 'var(--md-error)', fontSize: '12px', margin: 0 }}>
                {submitError}
              </p>
            )}

            {!isSubmitted ? (
              <button
                type="button"
                className="btn-m3-primary"
                disabled={!selectedOptionId || isSubmitting}
                onClick={handleVerifyAnswer}
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: selectedOptionId && !isSubmitting ? 'pointer' : 'not-allowed',
                  opacity: selectedOptionId && !isSubmitting ? 1 : 0.6,
                }}
              >
                {isSubmitting ? 'Verifying…' : 'Check Answer'}
              </button>
            ) : requiresServerRpc && !isCurrentCorrect ? (
              <button
                type="button"
                className="btn-m3-primary"
                onClick={handleRetryCurrentServerQuestion}
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={15} />
                <span>Try Again to Pass Verification</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-m3-primary"
                onClick={handleAdvance}
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>
                  {questionIdx + 1 < totalQuestions ? 'Next Question' : 'View Assessment Result'}
                </span>
                <ArrowRight size={15} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
