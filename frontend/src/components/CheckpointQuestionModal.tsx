import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onClose: () => void;
  onPassTask: (taskId: string) => void;
}

export const CheckpointQuestionModal: React.FC<Props> = ({ task, onClose, onPassTask }) => {
  const quiz = task.quiz;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!quiz) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div className="m3-surface-card" style={{ maxWidth: '420px', width: '100%', padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: 'var(--md-text-primary)' }}>Complete Session</h3>
          <p style={{ fontSize: '13px', color: 'var(--md-text-secondary)', marginBottom: '20px' }}>
            Mark "{task.title}" as completed.
          </p>
          <button className="btn-m3-primary" style={{ width: '100%' }} onClick={() => onPassTask(task.id)}>
            Complete Session
          </button>
        </div>
      </div>
    );
  }

  const handleSelect = (optionId: string, correct: boolean) => {
    if (isAnswered && isCorrect) return;

    setSelectedOptionId(optionId);
    setIsAnswered(true);
    setIsCorrect(correct);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="m3-surface-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '28px 24px',
          borderRadius: '32px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Row: Timer Pill & Close Button (Matching Image 1 Left Screen) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--md-text-secondary)',
            }}
          >
            <Clock size={14} color="#6366f1" />
            <span>Time left: 02:45</span>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Main Headline (Matching Image 1 Left Screen) */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--md-text-primary)', marginBottom: '6px' }}>
            Choose the correct answer
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}>
            {task.subject} Checkpoint
          </span>
        </div>

        {/* 3D Concept Icon Graphic */}
        <div style={{ textAlign: 'center', fontSize: '56px', margin: '10px 0 18px 0', filter: 'drop-shadow(0 8px 12px rgba(99,102,241,0.25))' }}>
          🧠💡
        </div>

        {/* Question Text */}
        <div style={{ textAlign: 'center', marginBottom: '22px', padding: '0 8px' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--md-text-primary)', lineHeight: 1.45 }}>
            {quiz.question}
          </p>
        </div>

        {/* 4 Rounded Choice Pills (Matching Image 1 Left Screen) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          {quiz.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let optClass = 'm3-question-option';
            if (isSelected) {
              optClass += opt.is_correct ? ' correct' : ' wrong';
            }

            return (
              <button
                key={opt.id}
                className={optClass}
                onClick={() => handleSelect(opt.id, opt.is_correct)}
                style={{
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '16px',
                  padding: '10px 12px',
                  fontSize: '13px',
                }}
              >
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Feedback Box */}
        {isAnswered && (
          <div
            style={{
              background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1.5px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '16px',
              padding: '12px 14px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {isCorrect ? (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <strong style={{ fontSize: '13px', color: '#10b981' }}>Correct! Checkpoint Verified</strong>
                </>
              ) : (
                <>
                  <AlertCircle size={16} color="#ef4444" />
                  <strong style={{ fontSize: '13px', color: '#ef4444' }}>Incorrect. Try again!</strong>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--md-text-primary)', lineHeight: 1.4 }}>
              {quiz.explanation}
            </p>
          </div>
        )}

        {/* Bottom Action Button (Prominent Violet Pill Matching Image 1) */}
        {isCorrect ? (
          <button
            className="btn-m3-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            onClick={() => onPassTask(task.id)}
          >
            <span>Next</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--md-text-muted)' }}>
            Select the correct option to verify your understanding & complete the step.
          </div>
        )}
      </div>
    </div>
  );
};
