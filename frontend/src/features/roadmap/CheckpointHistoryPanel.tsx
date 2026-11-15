import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ListSkeleton } from '../../components/SkeletonScreen';

interface Attempt {
  id: string;
  title: string;
  isCorrect: boolean;
  attemptCount: number;
  createdAt: string;
}

export const CheckpointHistoryPanel: React.FC<{ userId: string; isDemo?: boolean }> = ({ userId, isDemo = false }) => {
  const [loadedResult, setLoadedResult] = useState<{
    userId: string;
    attempts: Attempt[];
    error: string;
  } | null>(null);

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    const load = async () => {
      let queryResult = await supabase
        .from('quiz_submissions')
        .select('id,is_correct,attempt_count,created_at,tasks(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12);

      // Phase-1 schemas use `passed_at` instead of `created_at` on quiz_submissions.
      if (queryResult.error && /created_at/i.test(queryResult.error.message)) {
        const legacyResult = await supabase
          .from('quiz_submissions')
          .select('id,is_correct,attempt_count,passed_at,tasks(title)')
          .eq('user_id', userId)
          .order('passed_at', { ascending: false })
          .limit(12);
        if (!active) return;
        if (!legacyResult.error) {
          const attempts = (legacyResult.data ?? []).map((row: any) => ({
            id: row.id,
            title: row.tasks?.title ?? 'Checkpoint',
            isCorrect: row.is_correct,
            attemptCount: row.attempt_count ?? 1,
            createdAt: row.passed_at ?? new Date().toISOString(),
          }));
          setLoadedResult({ userId, attempts, error: '' });
          return;
        }
        queryResult = legacyResult as unknown as typeof queryResult;
      }

      if (!active) return;
      if (queryResult.error) {
        const msg = queryResult.error.message || '';
        // Missing table/column schema mismatch should degrade calmly to empty history.
        if (/schema cache|does not exist|relation/i.test(msg)) {
          setLoadedResult({ userId, attempts: [], error: '' });
          return;
        }
        setLoadedResult({ userId, attempts: [], error: msg });
        return;
      }

      const attempts = (queryResult.data ?? []).map((row: any) => ({
        id: row.id,
        title: row.tasks?.title ?? 'Checkpoint',
        isCorrect: row.is_correct,
        attemptCount: row.attempt_count ?? 1,
        createdAt: row.created_at ?? row.passed_at ?? new Date().toISOString(),
      }));
      setLoadedResult({ userId, attempts, error: '' });
    };
    void load();
    return () => { active = false; };
  }, [userId, isDemo]);

  const currentResult = isDemo || loadedResult?.userId !== userId ? null : loadedResult;
  const attempts = isDemo ? [] : currentResult?.attempts ?? [];
  const loading = !isDemo && currentResult === null;
  const error = currentResult?.error ?? '';

  if (!loading && !error && attempts.length === 0) {
    return null;
  }

  return (
    <section
      className="m3-surface-card"
      style={{ maxWidth: 1080, margin: '0 auto 16px', padding: '16px 20px' }}
      aria-labelledby="checkpoint-history-title"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 id="checkpoint-history-title" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--md-text-primary)', letterSpacing: '-0.01em' }}>
          Checkpoint History
        </h2>
        {!loading && !error && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-text-muted)' }}>
            {attempts.length} recorded
          </span>
        )}
      </div>
      {loading && <ListSkeleton rows={3} compact label="Loading checkpoint history" />}
      {error && <p role="alert" style={{ margin: 0, fontSize: 12.5, color: '#B91C1C' }}>Could not load checkpoint history: {error}</p>}
      {attempts.map((attempt, idx) => (
        <div
          key={attempt.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderTop: idx === 0 ? 'none' : '1px solid var(--md-outline-variant)',
            padding: '9px 0',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-text-primary)' }}>{attempt.title}</div>
            <div style={{ fontSize: 11, color: 'var(--md-text-muted)' }}>
              Attempt {attempt.attemptCount} · {new Date(attempt.createdAt).toLocaleString()}
            </div>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              background: attempt.isCorrect ? 'rgba(5, 150, 105, 0.1)' : 'rgba(180, 83, 9, 0.1)',
              color: attempt.isCorrect ? '#059669' : '#B45309',
              fontWeight: 700,
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            {attempt.isCorrect ? 'Passed' : 'Retry'}
          </span>
        </div>
      ))}
    </section>
  );
};
