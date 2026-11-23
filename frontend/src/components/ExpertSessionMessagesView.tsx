import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MessageSquare, Search } from 'lucide-react';
import type { ExpertBooking, ExpertProfile, ExpertSessionMessage } from '../types';
import { expertRepository } from '../features/experts/expertRepository';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SessionChatThread } from './SessionChatThread';

interface Props {
  expertProfile: ExpertProfile;
  bookings: ExpertBooking[];
  onGoToSessions: () => void;
  onToast: (msg: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const ExpertSessionMessagesView: React.FC<Props> = ({
  expertProfile,
  bookings,
  onGoToSessions,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    () => bookings[0]?.id ?? null
  );
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [latestByBooking, setLatestByBooking] = useState<Record<string, ExpertSessionMessage>>({});

  const bookingIdsKey = useMemo(
    () => bookings.map((b) => b.id).join(','),
    [bookings]
  );

  useEffect(() => {
    const ids = bookingIdsKey ? bookingIdsKey.split(',') : [];
    if (ids.length === 0) return;
    let active = true;
    void expertRepository
      .loadLatestSessionMessages(ids)
      .then((map) => {
        if (active) setLatestByBooking(map);
      })
      .catch(() => {
        // Non-blocking preview fetch
      });
    return () => {
      active = false;
    };
  }, [bookingIdsKey]);

  // Update preview snippets when any participant posts a message
  useEffect(() => {
    if (!isSupabaseConfigured() || bookings.length === 0) return;
    const bookingIdSet = new Set(bookings.map((b) => b.id));
    const channel = supabase
      .channel(`expert_inbox:${expertProfile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expert_session_messages',
        },
        (payload) => {
          const msg = payload.new as ExpertSessionMessage | undefined;
          if (!msg?.booking_id || !bookingIdSet.has(msg.booking_id)) return;
          setLatestByBooking((prev) => ({ ...prev, [msg.booking_id]: msg }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [expertProfile.user_id, bookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...bookings].sort((a, b) => {
      const aTime = Date.parse(latestByBooking[a.id]?.created_at || a.scheduled_start);
      const bTime = Date.parse(latestByBooking[b.id]?.created_at || b.scheduled_start);
      return bTime - aTime;
    });
    if (!q) return sorted;
    return sorted.filter((b) => {
      const hay = `${b.learner_name_snapshot} ${b.topic} ${latestByBooking[b.id]?.message || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, latestByBooking, searchQuery]);

  const activeBooking = useMemo(() => {
    if (selectedBookingId) {
      const match = bookings.find((b) => b.id === selectedBookingId);
      if (match) return match;
    }
    return filteredBookings[0] ?? bookings[0] ?? null;
  }, [bookings, filteredBookings, selectedBookingId]);

  if (bookings.length === 0) {
    return (
      <div className="m3-surface-card" style={{ padding: '36px 24px', textAlign: 'center', display: 'grid', gap: '10px', justifyItems: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'var(--md-primary-container)',
            color: 'var(--md-primary)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <MessageSquare size={22} />
        </div>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>No Session Chats Yet</h2>
        <p style={{ margin: 0, maxWidth: '420px', fontSize: '13px', color: 'var(--md-text-secondary)', lineHeight: 1.55 }}>
          Once a learner books a 1-on-1 session with you, their conversation thread will appear here automatically so you can coordinate agendas and meeting links.
        </p>
        <button type="button" className="btn-m3-white" onClick={onGoToSessions} style={{ marginTop: '4px' }}>
          <Calendar size={14} /> View Sessions Queue
        </button>
      </div>
    );
  }

  return (
    <div
      className={`session-chat-inbox m3-surface-card${mobileShowThread ? ' showing-thread' : ''}`}
      style={{
        padding: 0,
        overflow: 'hidden',
        height: 'min(74vh, 660px)',
        minHeight: '480px',
      }}
    >
      {/* Left Pane: Learner Session Threads */}
      <aside className="session-chat-inbox-list">
        <div style={{ padding: '14px', borderBottom: '1px solid var(--md-outline)', display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <MessageSquare size={15} color="var(--md-primary)" />
              <span>Session Chats ({bookings.length})</span>
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 10px',
              borderRadius: '9px',
              border: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
            }}
          >
            <Search size={14} color="var(--md-text-muted)" />
            <input
              type="text"
              placeholder="Search learner or topic..."
              aria-label="Search learner session chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--md-text-primary)',
                fontSize: '12.5px',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div className="session-chat-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {filteredBookings.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12.5px', color: 'var(--md-text-muted)' }}>
              No session threads matched &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const isSelected = activeBooking?.id === booking.id;
              const lastMsg = latestByBooking[booking.id];
              const previewText = lastMsg
                ? `${lastMsg.sender_id === expertProfile.user_id ? 'You: ' : ''}${lastMsg.message}`
                : booking.topic;
              const dateLabel = new Date(lastMsg?.created_at || booking.scheduled_start).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => {
                    setSelectedBookingId(booking.id);
                    setMobileShowThread(true);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: 'none',
                    borderBottom: '1px solid var(--md-outline)',
                    borderLeft: isSelected ? '3px solid var(--md-primary)' : '3px solid transparent',
                    background: isSelected ? 'var(--md-primary-container)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: 'var(--md-text-primary)',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '9px',
                      background: isSelected ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                      color: isSelected ? '#FFFFFF' : 'var(--md-text-primary)',
                      border: isSelected ? 'none' : '1px solid var(--md-outline)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(booking.learner_name_snapshot || 'Learner')}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {booking.learner_name_snapshot}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--md-text-muted)', flexShrink: 0 }}>
                        {dateLabel}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--md-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      {previewText}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10.5px', color: 'var(--md-text-muted)' }}>
                      <span>{booking.status.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>{booking.hours}h {booking.meeting_mode}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Pane: Active Conversation */}
      <section className="session-chat-inbox-thread">
        {activeBooking && (
          <SessionChatThread
            key={activeBooking.id}
            booking={activeBooking}
            currentUserId={expertProfile.user_id}
            currentUserName={expertProfile.display_name}
            onBack={() => setMobileShowThread(false)}
            onMessageSent={(msg) =>
              setLatestByBooking((prev) => ({ ...prev, [activeBooking.id]: msg }))
            }
            onToast={onToast}
          />
        )}
      </section>
    </div>
  );
};
