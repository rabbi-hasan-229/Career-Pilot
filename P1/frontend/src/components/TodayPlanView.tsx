import React from 'react';
import { BookOpen, Variable, Code2, Bot, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onSelectTaskForQuiz: (task: Task) => void;
  onOpenCoach: () => void;
  onViewAllPlans?: () => void;
}

export const TodayPlanView: React.FC<Props> = ({
  tasks,
  onSelectTaskForQuiz,
  onOpenCoach,
  onViewAllPlans,
}) => {
  return (
    <div>
      {/* 1. Hero Gradient Card (Matching Image 2 Left Screen) */}
      <div className="m3-hero-gradient-card" style={{ marginBottom: '24px' }}>
        <div className="m3-hero-content">
          <div className="m3-hero-pill-badge">CAREER SPRINT · DAY 14</div>
          <h2 className="m3-hero-title">Data Structures</h2>
          <p className="m3-hero-subtitle">
            Today's Focus: 2 of 5 Sessions Complete Successfully
          </p>

          {/* Progress bar */}
          <div className="m3-progress-bar-wrap">
            <div className="m3-progress-bar-fill" style={{ width: '40%' }} />
          </div>

          <button className="btn-m3-white" onClick={onViewAllPlans}>
            Learn more
          </button>
        </div>

        {/* 3D Books & Coffee Cup Illustration */}
        <div style={{ zIndex: 1, position: 'relative', fontSize: '56px', lineHeight: 1, paddingRight: '4px' }}>
          <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' }}>
            📚☕
          </div>
        </div>
      </div>

      {/* 2. Today's Plan Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
          Today's Plan
        </h3>
        <button
          onClick={onViewAllPlans}
          style={{
            background: 'none',
            border: 'none',
            color: '#6366f1',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          See All
        </button>
      </div>

      {/* 3. Today's Plan Task Items List */}
      <div style={{ marginBottom: '24px' }}>
        {tasks.map((task, index) => {
          const isDone = task.done_at != null;
          const iconColors = ['purple', 'blue', 'green'];
          const iconColor = iconColors[index % iconColors.length];

          return (
            <div
              key={task.id}
              className={`m3-task-item ${isDone ? 'done' : ''}`}
              onClick={() => onSelectTaskForQuiz(task)}
              title="Click to start session & checkpoint quiz"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Subject Box Icon */}
                <div className={`m3-task-icon-box ${iconColor}`}>
                  {task.subject.includes('Data') && <BookOpen size={20} />}
                  {task.subject.includes('Discrete') && <Variable size={20} />}
                  {task.subject.includes('Problem') && <Code2 size={20} />}
                </div>

                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--md-text-primary)', marginBottom: '3px' }}>
                    {task.title.split(':')[0]}
                  </h4>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-text-secondary)' }}>
                    🕒 {Math.floor(task.est_minutes / 60)}h {task.est_minutes % 60}m · {task.type}
                  </span>
                </div>
              </div>

              {/* Circular Progress Gauge */}
              <div className="m3-circle-progress">
                {isDone ? (
                  <CheckCircle2 size={28} color="#10b981" />
                ) : (
                  <>
                    <svg viewBox="0 0 44 44">
                      <circle className="m3-circle-bg" cx="22" cy="22" r="18" />
                      <circle
                        className="m3-circle-fill"
                        cx="22"
                        cy="22"
                        r="18"
                        strokeDasharray={113}
                        strokeDashoffset={113 - (113 * task.progress_pct) / 100}
                      />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                      {task.progress_pct}%
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. StudyZen AI Tip Card (Matching Image 2 Left Screen) */}
      <div
        className="m3-surface-card"
        onClick={onOpenCoach}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '16px 18px',
          background: 'var(--md-surface)',
          borderColor: 'var(--md-outline)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--md-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
              StudyZen AI Tip
            </h4>
            <p style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--md-text-secondary)', marginTop: '2px' }}>
              You study best between 9-11AM. Let's plan your deep focus session!
            </p>
          </div>
        </div>

        <ChevronRight size={18} color="var(--md-text-muted)" />
      </div>
    </div>
  );
};
