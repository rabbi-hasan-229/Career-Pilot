import type { ExpertSessionMessage } from '../../types';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

let channelSequence = 0;

export function createRealtimeChannelName(prefix: string, scopeId: string): string {
  channelSequence += 1;
  return `${prefix}:${scopeId}:${channelSequence}`;
}

export async function syncSupabaseRealtimeAuth(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken && typeof supabase.realtime?.setAuth === 'function') {
      await supabase.realtime.setAuth(accessToken);
    }
  } catch {
    // Non-fatal: channel subscription will still attempt with current client credentials
  }
}

function compareMessagesChronologically(a: ExpertSessionMessage, b: ExpertSessionMessage): number {
  const timeA = Date.parse(a.created_at);
  const timeB = Date.parse(b.created_at);
  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }
  if (a.created_at !== b.created_at) {
    return a.created_at < b.created_at ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function isSameMessage(a: ExpertSessionMessage, b: ExpertSessionMessage): boolean {
  return (
    a.id === b.id &&
    a.booking_id === b.booking_id &&
    a.sender_id === b.sender_id &&
    a.sender_name === b.sender_name &&
    a.message === b.message &&
    a.created_at === b.created_at
  );
}

/**
 * Merges incoming session chat messages into an existing list without duplicates,
 * keeping deterministic chronological order and preserving array reference if unchanged.
 */
export function mergeSessionMessages(
  existing: ExpertSessionMessage[],
  incoming: ExpertSessionMessage[]
): ExpertSessionMessage[] {
  if (incoming.length === 0) return existing;

  const byId = new Map<string, ExpertSessionMessage>();
  for (const msg of existing) {
    if (msg?.id) byId.set(msg.id, msg);
  }

  let changed = false;
  for (const msg of incoming) {
    if (!msg?.id) continue;
    const prev = byId.get(msg.id);
    if (!prev || !isSameMessage(prev, msg)) {
      byId.set(msg.id, msg);
      changed = true;
    }
  }

  if (!changed) return existing;

  const next = Array.from(byId.values()).sort(compareMessagesChronologically);
  return next;
}

export function removeSessionMessage(
  existing: ExpertSessionMessage[],
  messageId?: string | null
): ExpertSessionMessage[] {
  if (!messageId) return existing;
  const filtered = existing.filter((m) => m.id !== messageId);
  return filtered.length === existing.length ? existing : filtered;
}

export function getLatestMessageTimestamp(messages: ExpertSessionMessage[]): string | undefined {
  if (messages.length === 0) return undefined;
  let latest = messages[0];
  for (let i = 1; i < messages.length; i += 1) {
    if (compareMessagesChronologically(latest, messages[i]) < 0) {
      latest = messages[i];
    }
  }
  return latest.created_at;
}

export function mergeLatestByBooking(
  prev: Record<string, ExpertSessionMessage>,
  incoming: ExpertSessionMessage[]
): Record<string, ExpertSessionMessage> {
  if (incoming.length === 0) return prev;
  let next: Record<string, ExpertSessionMessage> | null = null;

  for (const msg of incoming) {
    if (!msg?.id || !msg.booking_id) continue;
    const current = (next ?? prev)[msg.booking_id];
    if (!current || compareMessagesChronologically(current, msg) < 0 || (current.id === msg.id && !isSameMessage(current, msg))) {
      if (!next) next = { ...prev };
      next[msg.booking_id] = msg;
    }
  }

  return next ?? prev;
}
