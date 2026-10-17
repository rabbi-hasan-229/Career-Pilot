import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task } from '../../types';

interface Props {
  task: Task;
  onClose: () => void;
  onPassTask: (taskId: string) => void;
}

export const CheckpointQuizModal: React.FC<Props> = ({
  task,
  onClose,
  onPassTask,
}) => {
  const quiz = task.quiz;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>Mark Task Complete</h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
            Confirm completion of: <strong>{task.title}</strong>
          </p>
          <button
            onClick={() => {
              onPassTask(task.id);
              onClose();
            }}
            style={{
              width: '100%',
              background: '#8EA95B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Mark Done
          </button>
        </div>
      </div>
    );
  }

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    const chosen = quiz.options.find((o) => o.id === selectedOptionId);
    const correct = Boolean(chosen?.is_correct);

    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8EA95B', '#10B981', '#6366F1'],
        });
      } catch {}
    }
  };

  const handleFinish = () => {
    onPassTask(task.id);
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
                background: '#8EA95B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#8EA95B', textTransform: 'uppercase' }}>
                Checkpoint Quiz
              </span>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0 }}>
                {task.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
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
              if (opt.is_correct) {
                border = '1.5px solid #10B981';
                bg = 'rgba(16, 185, 129, 0.08)';
                textColor = '#065F46';
              } else if (isSelected && !opt.is_correct) {
                border = '1.5px solid #EF4444';
                bg = 'rgba(239, 68, 68, 0.08)';
                textColor = '#991B1B';
              }
            } else if (isSelected) {
              border = '1.5px solid #8EA95B';
              bg = 'rgba(142, 169, 91, 0.08)';
              textColor = '#4A6223';
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
                {isSubmitted && opt.is_correct && <CheckCircle2 size={16} color="#10B981" />}
                {isSubmitted && isSelected && !opt.is_correct && <AlertCircle size={16} color="#EF4444" />}
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
            <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{quiz.explanation}</p>
          </div>
        )}

        {/* Action Button */}
        {!isSubmitted ? (
          <button
            type="button"
            disabled={!selectedOptionId}
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: '#8EA95B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: selectedOptionId ? 'pointer' : 'not-allowed',
              opacity: selectedOptionId ? 1 : 0.6,
              boxShadow: '0 4px 12px rgba(142, 169, 91, 0.3)',
            }}
          >
            Verify Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            style={{
              width: '100%',
              background: isCorrect ? '#8EA95B' : '#64748B',
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
