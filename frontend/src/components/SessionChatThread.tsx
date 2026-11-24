import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  MessageSquare,
  Send,
  Video,
  X,
} from 'lucide-react';
import type { ExpertBooking, ExpertSessionMessage } from '../types';
import { expertRepository } from '../features/experts/expertRepository';
import { getCurrentIsoTimestamp } from '../features/experts/expertMatching';
import {
  createRealtimeChannelName,
  getLatestMessageTimestamp,
  mergeSessionMessages,
  removeSessionMessage,
  syncSupabaseRealtimeAuth,
} from '../features/experts/sessionChatSync';
import { notificationService } from '../features/notifications/notificationService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface Props {
  booking: ExpertBooking;
  currentUserId: string;
  currentUserName: string;
  isDemo?: boolean;
  onMessageSent?: (message: ExpertSessionMessage) => void;
  onMessageReceived?: (message: ExpertSessionMessage) => void;
  onClose?: () => void;
  onBack?: () => void;
  onToast: (msg: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recent';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getBookingStatusMeta(status: ExpertBooking['status']): { label: string; bg: string; color: string } {
  if (status === 'confirmed') {
    return { label: 'Confirmed', bg: 'var(--md-success-bg)', color: 'var(--md-success)' };
  }
  if (status === 'completed') {
    return { label: 'Completed', bg: 'var(--md-surface-variant)', color: 'var(--md-text-secondary)' };
  }
  if (status.startsWith('cancelled')) {
    return { label: 'Cancelled', bg: 'var(--md-error-bg)', color: 'var(--md-error)' };
  }
  return { label: 'Pending Confirmation', bg: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' };
}

export const SessionChatThread: React.FC<Props> = ({
  booking,
  currentUserId,
  currentUserName,
  isDemo = false,
  onMessageSent,
  onMessageReceived,
  onClose,
  onBack,
  onToast,
}) => {
  const isDemoBooking = Boolean(isDemo || booking.id.startsWith('demo-bk-'));
  const isExpertViewer = booking.expert_id === currentUserId;
  const counterpartName = isExpertViewer
    ? booking.learner_name_snapshot || 'Learner'
    : booking.expert_name_snapshot || 'Expert';
  const counterpartRole = isExpertViewer ? 'Learner' : 'Mentor';
  const statusMeta = getBookingStatusMeta(booking.status);

  const [messages, setMessages] = useState<ExpertSessionMessage[]>(() =>
    isDemoBooking
      ? [
          {
            id: 'demo-msg-1',
            booking_id: booking.id,
            sender_id: booking.expert_id || 'exp',
            sender_name: booking.expert_name_snapshot,
            message: 'Looking forward to our session! Share any questions or links here beforehand.',
            created_at: booking.created_at,
          },
        ]
      : []
  );
  const [draft, setDraft] = useState('');
  const [loadedBookingId, setLoadedBookingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [syncState, setSyncState] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');
  const [reconnectNonce, setReconnectNonce] = useState(0);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const onToastRef = useRef(onToast);
  const onMessageSentRef = useRef(onMessageSent);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const latestTimestampRef = useRef<string | undefined>(undefined);
  const reconcileInFlightRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    onMessageSentRef.current = onMessageSent;
  }, [onMessageSent]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    latestTimestampRef.current = getLatestMessageTimestamp(messages);
  }, [messages]);

  const reconcileMessages = useCallback(
    async (forceFull = false) => {
      if (isDemoBooking || !isSupabaseConfigured() || reconcileInFlightRef.current) return;
      reconcileInFlightRef.current = true;
      try {
        const afterTimestamp = forceFull ? undefined : latestTimestampRef.current;
        const rows = await expertRepository.loadSessionMessages(booking.id, afterTimestamp);
        if (rows.length > 0) {
          setMessages((prev) => mergeSessionMessages(prev, rows));
          const latest = rows[rows.length - 1];
          if (latest) {
            onMessageReceivedRef.current?.(latest);
          }
        }
      } catch {
        // Silent background reconciliation; avoid toast spam on transient network blips
      } finally {
        reconcileInFlightRef.current = false;
      }
    },
    [booking.id, isDemoBooking]
  );

  // Initial message history load
  useEffect(() => {
    if (isDemoBooking) return;
    let active = true;
    void expertRepository
      .loadSessionMessages(booking.id)
      .then((rows) => {
        if (!active) return;
        setMessages((prev) => mergeSessionMessages(prev, rows));
        setLoadedBookingId(booking.id);
        const latest = rows[rows.length - 1];
        if (latest) {
          onMessageReceivedRef.current?.(latest);
        }
      })
      .catch((err) => {
        if (active) {
          onToastRef.current(err instanceof Error ? err.message : 'Could not load session messages.');
          setLoadedBookingId(booking.id);
        }
      });
    return () => {
      active = false;
    };
  }, [booking.id, isDemoBooking]);

  // Live Supabase Realtime sync with auth refresh, catch-up on subscribe, and auto-reconnect
  useEffect(() => {
    if (isDemoBooking || !isSupabaseConfigured()) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: number | null = null;

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== null) return;
      const delayMs = Math.min(15_000, 2_000 * 2 ** reconnectAttemptRef.current);
      reconnectAttemptRef.current = Math.min(reconnectAttemptRef.current + 1, 4);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        if (active) {
          setReconnectNonce((n) => n + 1);
        }
      }, delayMs);
    };

    const connect = async () => {
      await syncSupabaseRealtimeAuth();
      if (!active) return;

      channel = supabase
        .channel(createRealtimeChannelName('session_chat', booking.id))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expert_session_messages',
            filter: `booking_id=eq.${booking.id}`,
          },
          (payload) => {
            if (!active) return;
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id?: string } | undefined)?.id;
              if (oldId) {
                setMessages((prev) => removeSessionMessage(prev, oldId));
              }
              return;
            }
            const incoming = payload.new as ExpertSessionMessage | undefined;
            if (!incoming?.id) return;
            setMessages((prev) => mergeSessionMessages(prev, [incoming]));
            onMessageReceivedRef.current?.(incoming);
          }
        )
        .subscribe((status) => {
          if (!active) return;
          if (status === 'SUBSCRIBED') {
            reconnectAttemptRef.current = 0;
            setSyncState('live');
            // Catch up any messages sent during the initial fetch -> socket handshake window
            void reconcileMessages(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setSyncState('reconnecting');
            void reconcileMessages(false);
            scheduleReconnect();
          }
        });
    };

    void connect();

    return () => {
      active = false;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [booking.id, isDemoBooking, reconnectNonce, reconcileMessages]);

  // Reconcile immediately when returning to the tab, focusing the window, or regaining network,
  // plus a lightweight adaptive safety-net sync so messages never stall even if WebSockets drop.
  useEffect(() => {
    if (isDemoBooking || !isSupabaseConfigured()) return;

    const handleResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void reconcileMessages(false);
    };

    window.addEventListener('focus', handleResume);
    window.addEventListener('online', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    const intervalMs = syncState === 'live' ? 12_000 : 3_000;
    const pollTimer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void reconcileMessages(false);
    }, intervalMs);

    return () => {
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('online', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      window.clearInterval(pollTimer);
    };
  }, [isDemoBooking, syncState, reconcileMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, booking.id]);

  // Mark session message notifications for this booking as read while the user is actively viewing it
  useEffect(() => {
    if (isDemoBooking) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    void notificationService.markBookingMessageNotificationsRead(currentUserId, booking.id, isDemoBooking);
  }, [booking.id, currentUserId, isDemoBooking, messages.length]);

  const isLoading = !isDemoBooking && loadedBookingId !== booking.id;

  const groupedMessages = useMemo(() => {
    const groups: Array<{ day: string; items: ExpertSessionMessage[] }> = [];
    for (const msg of messages) {
      const day = formatDayLabel(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.day !== day) {
        groups.push({ day, items: [msg] });
      } else {
        lastGroup.items.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const starterPrompts = isExpertViewer
    ? [
        'Hi! Feel free to share your resume, repo, or specific goals ahead of our session.',
        'I have confirmed our schedule—let me know if you need any prep notes beforehand.',
        'Looking forward to our session! Check your unlocked resources when you get a chance.',
      ]
    : [
        'Hi! Looking forward to our session—here is what I would like to focus on.',
        'Could you share any prep material or links to review before we meet?',
        'Confirming I am ready for our scheduled time!',
      ];

  const submitMessage = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    if (isDemoBooking) {
      const demoMessage: ExpertSessionMessage = {
        id: `demo-msg-${crypto.randomUUID()}`,
        booking_id: booking.id,
        sender_id: currentUserId,
        sender_name: currentUserName,
        message: text,
        created_at: getCurrentIsoTimestamp(),
      };
      setMessages((prev) => mergeSessionMessages(prev, [demoMessage]));
      onMessageSentRef.current?.(demoMessage);
      setDraft('');
      return;
    }

    setIsSending(true);
    try {
      const saved = await expertRepository.sendSessionMessage(
        booking.id,
        currentUserId,
        currentUserName,
        text
      );
      setMessages((prev) => mergeSessionMessages(prev, [saved]));
      onMessageSentRef.current?.(saved);
      setDraft('');
    } catch (err) {
      onToastRef.current(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  };

  const startLabel = new Date(booking.scheduled_start).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--md-surface)',
        color: 'var(--md-text-primary)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--md-outline)',
          background: 'var(--md-surface)',
          display: 'grid',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to session conversations"
                style={{
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '8px',
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--md-text-primary)',
                  flexShrink: 0,
                }}
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div
              aria-hidden="true"
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                border: '1px solid var(--md-outline)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '13px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {getInitials(counterpartName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: 'var(--md-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {counterpartName}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: 'var(--md-surface-variant)',
                    border: '1px solid var(--md-outline)',
                    color: 'var(--md-text-secondary)',
                  }}
                >
                  {counterpartRole}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--md-text-muted)',
                  marginTop: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  Session Chat · {booking.hours}h {booking.meeting_mode === 'online' ? 'Online Video' : 'In-Person'}
                </span>
                {!isDemoBooking && isSupabaseConfigured() && (
                  <span
                    aria-live="polite"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: syncState === 'live' ? 'var(--md-success)' : 'var(--md-text-muted)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '9999px',
                        background: syncState === 'live' ? 'var(--md-success)' : 'var(--md-warning, #F59E0B)',
                        display: 'inline-block',
                      }}
                    />
                    {syncState === 'live' ? 'Live' : 'Syncing…'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '9999px',
                background: statusMeta.bg,
                color: statusMeta.color,
                whiteSpace: 'nowrap',
              }}
            >
              {statusMeta.label}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close session chat"
                style={{
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  borderRadius: '8px',
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--md-text-secondary)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Session Context Bar */}
        <div
          style={{
            padding: '8px 11px',
            borderRadius: '10px',
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px 12px',
            fontSize: '11.5px',
            color: 'var(--md-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Calendar size={12} color="var(--md-primary)" />
              {startLabel}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
              {booking.meeting_mode === 'online' ? <Video size={12} /> : <MapPin size={12} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '210px' }}>
                {booking.topic}
              </span>
            </span>
          </div>

          {booking.meeting_mode === 'online' && booking.meeting_url && booking.status === 'confirmed' && (
            <a
              href={booking.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--md-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Join Room</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Message Timeline */}
      <div
        className="session-chat-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'var(--md-surface-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {isLoading ? (
          <div style={{ margin: 'auto', textAlign: 'center', fontSize: '13px', color: 'var(--md-text-muted)' }}>
            Loading session conversation...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              maxWidth: '340px',
              width: '100%',
              background: 'var(--md-surface)',
              border: '1px solid var(--md-outline)',
              borderRadius: '14px',
              padding: '20px 18px',
              textAlign: 'center',
              display: 'grid',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'var(--md-primary-container)',
                color: 'var(--md-primary)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--md-text-primary)' }}>
                Coordinate with {counterpartName}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5, color: 'var(--md-text-secondary)' }}>
                Discuss your agenda, share prep links, or confirm meeting logistics ahead of the session.
              </p>
            </div>
            <div style={{ display: 'grid', gap: '6px', textAlign: 'left' }}>
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setDraft(prompt);
                    textareaRef.current?.focus();
                  }}
                  style={{
                    background: 'var(--md-surface-variant)',
                    border: '1px solid var(--md-outline)',
                    borderRadius: '9px',
                    padding: '7px 10px',
                    fontSize: '11.5px',
                    color: 'var(--md-text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.day} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 4px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--md-text-muted)',
                    background: 'var(--md-surface)',
                    border: '1px solid var(--md-outline)',
                    borderRadius: '9999px',
                    padding: '2px 10px',
                  }}
                >
                  {group.day}
                </span>
              </div>

              {group.items.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                const timeStr = formatTimeLabel(msg.created_at);
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                      gap: '3px',
                    }}
                  >
                    {!isMine && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--md-text-secondary)', paddingLeft: '4px' }}>
                        {msg.sender_name}
                      </span>
                    )}
                    <div
                      style={{
                        padding: '10px 13px',
                        borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMine ? 'var(--md-primary)' : 'var(--md-surface)',
                        color: isMine ? '#FFFFFF' : 'var(--md-text-primary)',
                        border: isMine ? 'none' : '1px solid var(--md-outline)',
                        fontSize: '13px',
                        lineHeight: 1.48,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      {msg.message}
                    </div>
                    {timeStr && (
                      <span style={{ fontSize: '10px', color: 'var(--md-text-muted)', padding: '0 4px' }}>
                        {isMine ? `You · ${timeStr}` : timeStr}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--md-outline)',
          background: 'var(--md-surface)',
          flexShrink: 0,
        }}
      >
        <div
          className="session-chat-composer"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            padding: '6px 6px 6px 12px',
            borderRadius: '12px',
            border: '1px solid var(--md-outline)',
            background: 'var(--md-surface-variant)',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={`Message ${counterpartName}...`}
            aria-label={`Message ${counterpartName}`}
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: 'var(--md-text-primary)',
              fontFamily: 'inherit',
              fontSize: '13px',
              lineHeight: 1.45,
              maxHeight: '96px',
              padding: '6px 0',
            }}
          />
          <button
            type="submit"
            className="btn-m3-primary"
            disabled={isSending || !draft.trim()}
            aria-label="Send message"
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            <Send size={13} />
            <span>{isSending ? 'Sending…' : 'Send'}</span>
          </button>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--md-text-muted)', marginTop: '5px', textAlign: 'right' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};
