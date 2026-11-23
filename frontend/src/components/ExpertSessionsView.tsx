import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageSquare,
  Video,
  XCircle,
} from 'lucide-react';
import type { ExpertBooking, ExpertProfile } from '../types';
import { expertRepository } from '../features/experts/expertRepository';
import { formatCurrencyCents } from '../features/experts/expertMatching';
import { SessionChatDrawer } from './SessionChatDrawer';

interface Props {
  expertProfile: ExpertProfile;
  bookings: ExpertBooking[];
  onBookingUpdated: (updated: ExpertBooking) => void;
  onToast: (msg: string) => void;
}

export const ExpertSessionsView: React.FC<Props> = ({
  expertProfile,
  bookings,
  onBookingUpdated,
  onToast,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('pending');
  const [meetingDrafts, setMeetingDrafts] = useState<Record<string, string>>({});
  const [venueDrafts, setVenueDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chatBooking, setChatBooking] = useState<ExpertBooking | null>(null);

  const filtered = bookings.filter((b) => {
    if (filterTab === 'pending') return b.status === 'pending_confirmation';
    if (filterTab === 'confirmed') return b.status === 'confirmed';
    if (filterTab === 'completed') return b.status === 'completed';
    return b.status === 'cancelled_by_learner' || b.status === 'cancelled_by_expert';
  });

  const handleConfirm = async (booking: ExpertBooking) => {
    const meetingUrl =
      meetingDrafts[booking.id]?.trim() ||
      booking.meeting_url ||
      expertProfile.default_meeting_url ||
      '';
    const offlineVenue =
      venueDrafts[booking.id]?.trim() ||
      booking.offline_venue ||
      expertProfile.offline_notes ||
      '';

    if (booking.meeting_mode === 'online' && !/^https?:\/\//i.test(meetingUrl)) {
      onToast('Enter a valid Zoom, Google Meet, or Teams link (https://...) to confirm.');
      return;
    }
    if (booking.meeting_mode === 'offline' && !offlineVenue) {
      onToast('Enter the confirmed offline meeting venue address.');
      return;
    }

    setBusyId(booking.id);
    try {
      const updated = await expertRepository.confirmBooking(
        booking.id,
        booking.meeting_mode === 'online' ? meetingUrl : undefined,
        booking.meeting_mode === 'offline' ? offlineVenue : undefined
      );
      onBookingUpdated(updated);
      onToast('Session confirmed and learner notified.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not confirm session.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkCompleted = async (booking: ExpertBooking) => {
    setBusyId(booking.id);
    try {
      const updated = await expertRepository.expertMarkSessionCompleted(booking.id);
      onBookingUpdated(updated);
      onToast(
        updated.status === 'completed'
          ? 'Session completed and payment released to your wallet!'
          : 'Marked as delivered. Escrow will release once the learner confirms.'
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not update session.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (booking: ExpertBooking) => {
    setBusyId(booking.id);
    try {
      const updated = await expertRepository.cancelBooking(booking.id);
      onBookingUpdated(updated);
      onToast('Booking cancelled and escrow refunded to the learner.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not cancel booking.');
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    pending: bookings.filter((b) => b.status === 'pending_confirmation').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status.startsWith('cancelled')).length,
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'pending', label: `Pending Requests (${counts.pending})` },
            { id: 'confirmed', label: `Upcoming (${counts.confirmed})` },
            { id: 'completed', label: `Completed (${counts.completed})` },
            { id: 'cancelled', label: `Cancelled (${counts.cancelled})` },
          ] as const
        ).map((tab) => {
          const active = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${active ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                color: active ? '#FFFFFF' : 'var(--md-text-secondary)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="m3-surface-card" style={{ padding: '32px', textAlign: 'center' }}>
          <Calendar size={28} color="var(--md-text-muted)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '15px', fontWeight: 700 }}>No sessions in this category</div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--md-text-secondary)' }}>
            New learner bookings matching your career expertise will appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filtered.map((booking) => {
            const isBusy = busyId === booking.id;
            return (
              <div key={booking.id} className="m3-surface-card" style={{ display: 'grid', gap: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
                        {booking.learner_name_snapshot}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: 'var(--md-primary-container)',
                          color: 'var(--md-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {booking.meeting_mode === 'online' ? <Video size={11} /> : <MapPin size={11} />}
                        {booking.hours}h {booking.meeting_mode}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--md-text-secondary)', marginTop: '2px' }}>
                      {new Date(booking.scheduled_start).toLocaleString()} –{' '}
                      {new Date(booking.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.timezone})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--md-success)' }}>
                      +{formatCurrencyCents(booking.expert_payout_cents)} net
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--md-text-muted)' }}>
                      {booking.payment_status === 'released_to_expert'
                        ? 'Released to Wallet'
                        : booking.payment_status === 'refunded'
                          ? 'Refunded'
                          : 'Held in Escrow'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--md-text-secondary)' }}>
                  <strong>Session Topic:</strong> {booking.topic}
                </div>

                {/* Meeting Link / Venue editor for pending or confirmed */}
                {(booking.status === 'pending_confirmation' || booking.status === 'confirmed') && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    {booking.meeting_mode === 'online' ? (
                      <input
                        type="url"
                        placeholder="Paste Zoom / Google Meet / Teams URL (https://...)"
                        value={
                          meetingDrafts[booking.id] ??
                          booking.meeting_url ??
                          expertProfile.default_meeting_url ??
                          ''
                        }
                        onChange={(e) =>
                          setMeetingDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))
                        }
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface-variant)',
                          color: 'var(--md-text-primary)',
                          fontSize: '12.5px',
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={`Confirm venue address in ${booking.offline_city || 'city'}`}
                        value={
                          venueDrafts[booking.id] ??
                          booking.offline_venue ??
                          expertProfile.offline_notes ??
                          ''
                        }
                        onChange={(e) =>
                          setVenueDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))
                        }
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-outline)',
                          background: 'var(--md-surface-variant)',
                          color: 'var(--md-text-primary)',
                          fontSize: '12.5px',
                        }}
                      />
                    )}
                    <button
                      type="button"
                      className="btn-m3-primary"
                      disabled={isBusy}
                      onClick={() => void handleConfirm(booking)}
                      style={{ padding: '9px 14px', fontSize: '12.5px' }}
                    >
                      {booking.status === 'pending_confirmation' ? 'Confirm & Share' : 'Update Details'}
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-m3-white"
                    onClick={() => setChatBooking(booking)}
                    style={{ padding: '7px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <MessageSquare size={13} /> Message Learner
                  </button>

                  {booking.meeting_mode === 'online' && booking.meeting_url && booking.status === 'confirmed' && (
                    <a
                      href={booking.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-m3-white"
                      style={{ padding: '7px 12px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ExternalLink size={13} /> Open Meeting Room
                    </a>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      type="button"
                      className="btn-m3-primary"
                      disabled={isBusy || Boolean(booking.expert_completed_at)}
                      onClick={() => void handleMarkCompleted(booking)}
                      style={{ padding: '7px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <CheckCircle2 size={13} />
                      <span>
                        {booking.expert_completed_at ? 'Delivered (Awaiting Learner)' : 'Mark Session Delivered'}
                      </span>
                    </button>
                  )}

                  {(booking.status === 'pending_confirmation' || booking.status === 'confirmed') && (
                    <button
                      type="button"
                      className="btn-m3-white"
                      disabled={isBusy}
                      onClick={() => void handleCancel(booking)}
                      style={{ padding: '7px 12px', fontSize: '12px', color: 'var(--md-error)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <XCircle size={13} /> Decline & Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SessionChatDrawer
        key={chatBooking?.id || 'expert-chat-closed'}
        booking={chatBooking}
        currentUserId={expertProfile.user_id}
        currentUserName={expertProfile.display_name}
        onClose={() => setChatBooking(null)}
        onToast={onToast}
      />
    </div>
  );
};
