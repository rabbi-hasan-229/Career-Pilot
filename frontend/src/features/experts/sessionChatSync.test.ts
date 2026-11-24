import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExpertSessionMessage } from '../../types';

const { mockGetSession, mockSetAuth } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSetAuth: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    realtime: {
      setAuth: mockSetAuth,
    },
  },
}));

import {
  createRealtimeChannelName,
  getLatestMessageTimestamp,
  mergeLatestByBooking,
  mergeSessionMessages,
  removeSessionMessage,
  syncSupabaseRealtimeAuth,
} from './sessionChatSync';

function makeMessage(overrides: Partial<ExpertSessionMessage> & { id: string }): ExpertSessionMessage {
  return {
    booking_id: 'bk-1',
    sender_id: 'user-1',
    sender_name: 'Ada',
    message: 'Hello',
    created_at: '2026-11-24T10:00:00.000Z',
    ...overrides,
  };
}

describe('sessionChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges out-of-order and duplicate messages deterministically in chronological order', () => {
    const m1 = makeMessage({ id: 'm1', created_at: '2026-11-24T10:00:00.000Z', message: 'First' });
    const m2 = makeMessage({ id: 'm2', created_at: '2026-11-24T10:01:00.000Z', message: 'Second' });
    const m3 = makeMessage({ id: 'm3', created_at: '2026-11-24T10:02:00.000Z', message: 'Third' });

    const initial = mergeSessionMessages([m3], [m1, m2, m3]);
    expect(initial.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);

    // Re-merging identical messages preserves the array reference
    const unchanged = mergeSessionMessages(initial, [m2]);
    expect(unchanged).toBe(initial);

    // Updating an existing message replaces its payload in place
    const updatedM2 = makeMessage({ id: 'm2', created_at: '2026-11-24T10:01:00.000Z', message: 'Second (edited)' });
    const afterUpdate = mergeSessionMessages(initial, [updatedM2]);
    expect(afterUpdate).not.toBe(initial);
    expect(afterUpdate[1].message).toBe('Second (edited)');
  });

  it('removes deleted messages and preserves reference when absent', () => {
    const list = [
      makeMessage({ id: 'm1', created_at: '2026-11-24T10:00:00.000Z' }),
      makeMessage({ id: 'm2', created_at: '2026-11-24T10:01:00.000Z' }),
    ];
    expect(removeSessionMessage(list, 'missing')).toBe(list);
    expect(removeSessionMessage(list, 'm1').map((m) => m.id)).toEqual(['m2']);
  });

  it('extracts the latest timestamp and merges latest messages per booking', () => {
    const m1 = makeMessage({ id: 'm1', booking_id: 'bk-1', created_at: '2026-11-24T10:00:00.000Z', message: 'Older' });
    const m2 = makeMessage({ id: 'm2', booking_id: 'bk-1', created_at: '2026-11-24T10:05:00.000Z', message: 'Newer' });
    const m3 = makeMessage({ id: 'm3', booking_id: 'bk-2', created_at: '2026-11-24T10:03:00.000Z', message: 'Other booking' });

    expect(getLatestMessageTimestamp([m2, m1])).toBe('2026-11-24T10:05:00.000Z');
    expect(getLatestMessageTimestamp([])).toBeUndefined();

    const first = mergeLatestByBooking({}, [m2, m3]);
    expect(first['bk-1']?.id).toBe('m2');
    expect(first['bk-2']?.id).toBe('m3');

    // Older message should not overwrite newer preview
    const afterOlder = mergeLatestByBooking(first, [m1]);
    expect(afterOlder).toBe(first);
    expect(afterOlder['bk-1']?.id).toBe('m2');
  });

  it('creates unique realtime channel names to avoid StrictMode removeChannel collisions', () => {
    const a = createRealtimeChannelName('session_chat', 'bk-1');
    const b = createRealtimeChannelName('session_chat', 'bk-1');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^session_chat:bk-1:\d+$/);
    expect(b).toMatch(/^session_chat:bk-1:\d+$/);
  });

  it('syncs the active session access token to Supabase Realtime before subscribing', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: 'jwt-access-token' } },
    });
    await syncSupabaseRealtimeAuth();
    expect(mockSetAuth).toHaveBeenCalledWith('jwt-access-token');
  });
});
