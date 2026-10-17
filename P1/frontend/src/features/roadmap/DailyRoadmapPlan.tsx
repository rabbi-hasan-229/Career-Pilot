import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Code2,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Task, TaskActionType } from '../../types';

interface Props {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
}

const typeConfig: Record<TaskActionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Learn: {
    label: 'LEARN',
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.08)',
    icon: <BookOpen size={12} />,
  },
  Build: {
    label: 'BUILD',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    icon: <Code2 size={12} />,
  },
  Practice: {
    label: 'PRACTICE',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.08)',
    icon: <Layers size={12} />,
  },
  Checkpoint: {
    label: 'CHECKPOINT',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    icon: <ShieldCheck size={12} />,
  },
};

export const DailyRoadmapPlan: React.FC<Props> = ({
  tasks,
  onSelectTask,
  onToggleTaskComplete,
}) => {
  const completedCount = tasks.filter((t) => t.done_at != null).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ marginBottom: '22px' }}>
      {/* Header Row: Minimal & Compact */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontSize: '15.5px',
              fontWeight: 800,
              color: 'var(--md-text-primary, #1E293B)',
              margin: 0,
              letterSpacing: '-0.2px',
            }}
          >
            Today's Roadmap Tasks
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: progressPct === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(142, 169, 91, 0.15)',
              color: progressPct === 100 ? '#10B981' : '#5C7433',
            }}
          >
            {completedCount}/{tasks.length} Done ({progressPct}%)
          </span>
        </div>

        {/* Minimal linear progress gauge */}
        <div
          style={{
            width: '80px',
            height: '6px',
            background: 'var(--md-surface-variant, #E2E8F0)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: '#8EA95B',
              borderRadius: '9999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((task) => {
          const isDone = task.done_at != null;
          const config = typeConfig[task.type] || typeConfig.Learn;

          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                background: isDone ? 'rgba(142, 169, 91, 0.05)' : 'var(--md-surface, #FFFFFF)',
                border: `1px solid ${isDone ? 'rgba(142, 169, 91, 0.3)' : 'var(--md-outline, #E2E8F0)'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Left Action Box + Titles */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1,
                  cursor: 'pointer',
                }}
                onClick={() => onSelectTask(task)}
              >
                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTaskComplete(task.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: isDone ? '#8EA95B' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={isDone ? 'Completed' : 'Mark complete'}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} color="#8EA95B" />
                  ) : (
                    <Circle size={22} strokeWidth={1.8} />
                  )}
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: config.bg,
                        color: config.color,
                      }}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} /> {task.est_minutes}m
                    </span>
                  </div>

                  <h4
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: isDone ? '#64748B' : 'var(--md-text-primary, #1E293B)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      margin: 0,
                    }}
                  >
                    {task.title}
                  </h4>
                </div>
              </div>

              {/* Right: Checkpoint Quiz or Verify pill */}
              {task.quiz && (
                <button
                  type="button"
                  onClick={() => onSelectTask(task)}
                  style={{
                    background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(142, 169, 91, 0.12)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isDone ? '#10B981' : '#5C7433',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={12} />
                  {isDone ? 'Verified' : 'Quiz'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
