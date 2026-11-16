import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';

type QuizCompletion = { persisted: boolean; currentStreak?: number };

interface Props {
  task: Task;
  isDemo: boolean;
  onClose: () => void;
  onPassTask: (taskId: string, completion?: QuizCompletion) => void;
}

export const CheckpointQuizModal: React.FC<Props> = ({
  task,
  isDemo,
  onClose,
  onPassTask,
}) => {
  const dialogRef = useAccessibleDialog(true, onClose);
  const quiz = task.quiz;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [currentStreak, setCurrentStreak] = useState<number | undefined>();
  const [persistedByServer, setPersistedByServer] = useState(false);

  if (!quiz) {
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
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>
            {isDemo ? 'Mark Task Complete' : 'Checkpoint unavailable'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
            {isDemo
              ? <>Confirm completion of: <strong>{task.title}</strong></>
              : <>This checkpoint assessment could not be loaded. Close this dialog and retry after your roadmap refreshes.</>}
          </p>
          <button
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

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmit = async () => {
    if (!selectedOptionId || isSubmitting) return;
    const chosen = quiz.options.find((o) => o.id === selectedOptionId);
    setSubmitError('');
    setIsSubmitting(true);
    let correct: boolean;
    let correctId: string | null = null;
    let resultFeedback = quiz.explanation;
    let streak: number | undefined;

    let serverPersisted = false;

    if (isDemo || quiz.id.startsWith('demo_quiz_') || quiz.id.startsWith('local_quiz_')) {
      correct = Boolean(chosen?.is_correct);
      correctId = quiz.options.find((option) => option.is_correct)?.id ?? null;
    } else {
      const { data, error } = await supabase.rpc('submit_task_quiz', {
        p_task_id: task.id,
        p_selected_option: selectedOptionId,
      });
      if (error) {
        const isMissingRpc =
          error.code === 'PGRST202' ||
          error.code === '42883' ||
          /could not find the function|does not exist/i.test(error.message || '');
        const hasLocalCorrectFlag = quiz.options.some((option) => typeof option.is_correct === 'boolean');
        if (isMissingRpc && hasLocalCorrectFlag) {
          correct = Boolean(chosen?.is_correct);
          correctId = quiz.options.find((option) => option.is_correct)?.id ?? null;
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
        resultFeedback = result.explanation || quiz.explanation;
        streak = result.current_streak;
        serverPersisted = true;
      }
    }

    setCorrectOptionId(correctId);
    setFeedback(resultFeedback);
    setCurrentStreak(streak);
    setPersistedByServer(serverPersisted);
    setIsCorrect(correct);
    setIsSubmitted(true);
    setIsSubmitting(false);

    if (correct) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#123C69', '#059669', '#38BDF8'],
        });
      } catch {}
    }
  };

  const handleFinish = () => {
    if (isCorrect) onPassTask(task.id, { persisted: persistedByServer, currentStreak });
    onClose();
  };

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
        aria-label={`Checkpoint quiz for ${task.title}`}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--md-surface, #FFFFFF)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--md-outline, #E2E8F0)',
          color: 'var(--md-text-primary, #1E293B)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--md-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--md-primary)', textTransform: 'uppercase' }}>
                Checkpoint Quiz
              </span>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0 }}>
                {task.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkpoint quiz"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Question */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, lineHeight: 1.45, color: '#1E293B' }}>
            {quiz.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {quiz.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let border = '1px solid #E2E8F0';
            let bg = '#FFFFFF';
            let textColor = '#1E293B';

            if (isSubmitted) {
              if (isSubmitted && opt.id === correctOptionId) {
                border = '1.5px solid #10B981';
                bg = 'rgba(16, 185, 129, 0.08)';
                textColor = '#065F46';
              } else if (isSubmitted && isSelected && opt.id !== correctOptionId) {
                border = '1.5px solid #EF4444';
                bg = 'rgba(239, 68, 68, 0.08)';
                textColor = '#991B1B';
              }
            } else if (isSelected) {
              border = '1.5px solid var(--md-primary)';
              bg = 'var(--md-primary-container)';
              textColor = 'var(--md-on-primary-container)';
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
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border,
                  background: bg,
                  cursor: isSubmitted ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: textColor }}>
                  {opt.text}
                </span>
                {isSubmitted && opt.id === correctOptionId && <CheckCircle2 size={16} color="#10B981" />}
                {isSubmitted && isSelected && opt.id !== correctOptionId && <AlertCircle size={16} color="#EF4444" />}
              </button>
            );
          })}
        </div>

        {/* Explanation on submit */}
        {isSubmitted && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              marginBottom: '16px',
              fontSize: '12px',
              color: isCorrect ? '#065F46' : '#991B1B',
            }}
          >
            <strong>{isCorrect ? '✨ Correct Verification!' : 'Review Concept:'}</strong>
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{feedback}</p>
            {isCorrect && currentStreak !== undefined && <p style={{ margin: '6px 0 0 0' }}>Current streak: {currentStreak} days</p>}
          </div>
        )}

        {submitError && <p role="alert" style={{ color: '#B91C1C', fontSize: '12px' }}>{submitError}</p>}

        {/* Action Button */}
        {!isSubmitted ? (
          <button
            type="button"
            disabled={!selectedOptionId || isSubmitting}
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: 'var(--md-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: selectedOptionId && !isSubmitting ? 'pointer' : 'not-allowed',
              opacity: selectedOptionId && !isSubmitting ? 1 : 0.6,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isSubmitting ? 'Verifying…' : 'Verify Answer'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            style={{
              width: '100%',
              background: isCorrect ? 'var(--md-primary)' : '#64748B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {isCorrect ? (
              <>
                <Sparkles size={16} />
                Pass Checkpoint & Mark Done
              </>
            ) : (
              'Close Checkpoint'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
