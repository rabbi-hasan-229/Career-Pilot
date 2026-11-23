import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Video,
  X,
} from 'lucide-react';
import type {
  ExpertAvailabilitySlot,
  ExpertBooking,
  ExpertProfile,
  Profile,
} from '../types';
import { expertRepository } from '../features/experts/expertRepository';
import {
  formatCurrencyCents,
  formatHourlyRate,
  generateBookableSlotsForDate,
  getCurrentIsoTimestamp,
} from '../features/experts/expertMatching';
import { getLocalDateOnly } from '../lib/dateOnly';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import {
  SSLCommerzCheckoutModal,
  type SSLCommerzPaymentResult,
} from './SSLCommerzCheckoutModal';

interface Props {
  expert: ExpertProfile | null;
  learnerProfile: Profile;
  onBooked: (booking: ExpertBooking) => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ExpertBookingModal: React.FC<Props> = ({
  expert,
  learnerProfile,
  onBooked,
  onClose,
  onToast,
}) => {
  const dialogRef = useAccessibleDialog<HTMLFormElement>(Boolean(expert), onClose);

  const [hours, setHours] = useState(1);
  const [meetingMode, setMeetingMode] = useState<'online' | 'offline'>(() =>
    expert?.meeting_modes === 'offline' ? 'offline' : 'online'
  );
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateOnly());
  const [selectedSlotIso, setSelectedSlotIso] = useState('');
  const [offlineCity, setOfflineCity] = useState(() => expert?.offline_cities[0] || expert?.location || '');
  const [offlineVenue, setOfflineVenue] = useState('');
  const [topic, setTopic] = useState(() =>
    learnerProfile.target_role
      ? `Guidance & skill roadmap review for ${learnerProfile.target_role}`
      : '1-on-1 career mentoring session'
  );

  const [availability, setAvailability] = useState<ExpertAvailabilitySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<
    Pick<ExpertBooking, 'scheduled_start' | 'scheduled_end' | 'status'>[]
  >([]);
  const [loadedExpertId, setLoadedExpertId] = useState<string | null>(null);
  const [isSSLCommerzOpen, setIsSSLCommerzOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expert) return;
    let active = true;
    void Promise.all([
      expertRepository.loadExpertAvailability(expert.user_id, Boolean(learnerProfile.is_demo)),
      expertRepository.loadExpertBookedSlots(expert.user_id, Boolean(learnerProfile.is_demo)),
    ])
      .then(([avail, existing]) => {
        if (!active) return;
        setAvailability(avail);
        setBookedSlots(existing);
        setLoadedExpertId(expert.user_id);
      })
      .catch(() => {
        if (active) {
          setError('Could not load expert availability.');
          setLoadedExpertId(expert.user_id);
        }
      });

    return () => {
      active = false;
    };
  }, [expert, learnerProfile.is_demo]);

  const isLoadingSlots = Boolean(expert) && loadedExpertId !== expert?.user_id;

  const availableSlots = useMemo(
    () => generateBookableSlotsForDate(availability, bookedSlots, selectedDate, hours),
    [availability, bookedSlots, selectedDate, hours]
  );

  const effectiveSlotIso = availableSlots.some((s) => s.startIso === selectedSlotIso)
    ? selectedSlotIso
    : availableSlots[0]?.startIso || '';

  if (!expert) return null;

  const grossCents = expert.hourly_rate_cents * hours;
  const feeCents = Math.round(grossCents * 0.1);
  const expertPayoutCents = grossCents - feeCents;
  const isLocalPreviewBooking = Boolean(learnerProfile.is_demo) || expert.user_id.startsWith('exp_demo_');
  const maxHours = Math.max(1, Math.min(4, expert.max_hours_per_session || 4));
  const tz =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC';

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveSlotIso) {
      setError('Select an available date and time slot.');
      return;
    }
    if (topic.trim().length < 3) {
      setError('Describe what you want to cover in this session.');
      return;
    }
    if (meetingMode === 'offline' && !offlineCity.trim()) {
      setError('Enter the city for your in-person session.');
      return;
    }
    setIsSSLCommerzOpen(true);
  };

  const handleSSLCommerzSuccess = async (payment: SSLCommerzPaymentResult) => {
    if (isLocalPreviewBooking) {
      const endDate = new Date(new Date(effectiveSlotIso).getTime() + hours * 3600 * 1000);
      const demoBooking: ExpertBooking = {
        id: `demo-bk-${crypto.randomUUID()}`,
        learner_id: learnerProfile.id,
        expert_id: expert.user_id,
        learner_name_snapshot: learnerProfile.full_name,
        expert_name_snapshot: expert.display_name,
        expert_headline_snapshot: expert.headline,
        hours,
        hourly_rate_cents: expert.hourly_rate_cents,
        gross_amount_cents: grossCents,
        platform_fee_cents: feeCents,
        expert_payout_cents: expertPayoutCents,
        meeting_mode: meetingMode,
        scheduled_start: effectiveSlotIso,
        scheduled_end: endDate.toISOString(),
        timezone: tz,
        meeting_url: meetingMode === 'online' ? expert.default_meeting_url || 'https://meet.google.com/demo-session' : null,
        offline_city: meetingMode === 'offline' ? offlineCity.trim() : null,
        offline_venue: meetingMode === 'offline' ? offlineVenue.trim() || expert.offline_notes || 'To be confirmed' : null,
        topic: topic.trim(),
        status: 'confirmed',
        payment_status: 'escrow_held',
        payment_method: payment.paymentMethod,
        payment_reference: payment.paymentReference,
        created_at: getCurrentIsoTimestamp(),
      };
      setIsSSLCommerzOpen(false);
      onBooked(demoBooking);
      onToast(`Paid ${formatCurrencyCents(grossCents)} via ${payment.paymentMethod}. Session booked!`);
      onClose();
      return;
    }

    const result = await expertRepository.bookSession({
      expertId: expert.user_id,
      hours,
      meetingMode,
      scheduledStartIso: effectiveSlotIso,
      timezone: tz,
      offlineCity: meetingMode === 'offline' ? offlineCity.trim() : undefined,
      offlineVenue: meetingMode === 'offline' ? offlineVenue.trim() : undefined,
      topic: topic.trim(),
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
    });
    setIsSSLCommerzOpen(false);
    onBooked(result.booking);
    onToast(`Paid ${formatCurrencyCents(grossCents)} via ${payment.paymentMethod}. Session booked!`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Book session with ${expert.display_name}`}
        tabIndex={-1}
        onSubmit={handleProceedToPayment}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--md-surface)',
          color: 'var(--md-text-primary)',
          borderRadius: '18px',
          border: '1px solid var(--md-outline)',
          padding: '22px',
          display: 'grid',
          gap: '16px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
              Book 1-on-1 Session with {expert.display_name}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--md-text-secondary)' }}>
              {expert.headline} · {formatHourlyRate(expert.hourly_rate_cents)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            style={{
              background: 'var(--md-surface-variant)',
              border: '1px solid var(--md-outline)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: 'var(--md-text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--md-error-bg)',
              color: 'var(--md-error)',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Meeting Mode & Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '6px' }}>
              Meeting Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                disabled={expert.meeting_modes === 'offline'}
                onClick={() => setMeetingMode('online')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: `1.5px solid ${meetingMode === 'online' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                  background: meetingMode === 'online' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: meetingMode === 'online' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: expert.meeting_modes === 'offline' ? 'not-allowed' : 'pointer',
                  opacity: expert.meeting_modes === 'offline' ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Video size={14} /> Online
              </button>
              <button
                type="button"
                disabled={expert.meeting_modes === 'online'}
                onClick={() => setMeetingMode('offline')}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: `1.5px solid ${meetingMode === 'offline' ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                  background: meetingMode === 'offline' ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  color: meetingMode === 'offline' ? 'var(--md-primary)' : 'var(--md-text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: expert.meeting_modes === 'online' ? 'not-allowed' : 'pointer',
                  opacity: expert.meeting_modes === 'online' ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MapPin size={14} /> Offline
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '6px' }}>
              Session Duration (Hours)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Array.from({ length: maxHours }, (_, idx) => idx + 1).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    borderRadius: '10px',
                    border: `1.5px solid ${hours === h ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                    background: hours === h ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                    color: hours === h ? '#FFFFFF' : 'var(--md-text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date & Slots */}
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} /> Choose Date ({tz})
            </label>
            <input
              type="date"
              min={getLocalDateOnly()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid var(--md-outline)',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-text-primary)',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} /> Available {hours}-Hour Time Slots
            </div>
            {isLoadingSlots ? (
              <div style={{ fontSize: '12.5px', color: 'var(--md-text-muted)', padding: '8px 0' }}>
                Checking expert availability...
              </div>
            ) : availableSlots.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--md-surface-variant)',
                  border: '1px solid var(--md-outline)',
                  fontSize: '12.5px',
                  color: 'var(--md-text-secondary)',
                }}
              >
                No open {hours}-hour slots on this date. Try another weekday or shorter duration.
              </div>
            ) : (
              <div className="slot-pill-grid">
                {availableSlots.map((slot) => {
                  const active = effectiveSlotIso === slot.startIso;
                  return (
                    <button
                      key={slot.startIso}
                      type="button"
                      onClick={() => setSelectedSlotIso(slot.startIso)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '9px',
                        border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline)'}`,
                        background: active ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                        color: active ? 'var(--md-primary)' : 'var(--md-text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Offline details */}
        {meetingMode === 'offline' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Dhaka"
                value={offlineCity}
                onChange={(e) => setOfflineCity(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: '9px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
                Preferred Public Venue
              </label>
              <input
                type="text"
                placeholder={expert.offline_notes || 'Coffee shop / coworking hub'}
                value={offlineVenue}
                onChange={(e) => setOfflineVenue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  borderRadius: '9px',
                  border: '1px solid var(--md-outline)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        )}

        {/* Session Agenda */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-text-secondary)', display: 'block', marginBottom: '5px' }}>
            What would you like to learn / discuss? *
          </label>
          <textarea
            rows={2}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="Share your target career goals, questions, or portfolio links to review..."
            style={{
              width: '100%',
              padding: '9px 11px',
              borderRadius: '9px',
              border: '1px solid var(--md-outline)',
              background: 'var(--md-surface-variant)',
              color: 'var(--md-text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Direct SSLCOMMERZ Checkout Summary */}
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            display: 'grid',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--md-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} /> Session Rate ({hours}h × {formatCurrencyCents(expert.hourly_rate_cents)})
            </span>
            <strong>{formatCurrencyCents(grossCents)}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--md-text-secondary)' }}>
            <span>Included Platform Protection &amp; Escrow (10%)</span>
            <span>{formatCurrencyCents(feeCents)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--md-outline)', fontSize: '14px', fontWeight: 800 }}>
            <span>Total Payable via SSLCOMMERZ</span>
            <span style={{ color: 'var(--md-primary)' }}>{formatCurrencyCents(grossCents)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn-m3-white" onClick={onClose} style={{ padding: '10px 16px' }}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-m3-primary"
            disabled={!effectiveSlotIso}
            style={{ padding: '10px 20px', opacity: !effectiveSlotIso ? 0.6 : 1 }}
          >
            Pay {formatCurrencyCents(grossCents)} with SSLCOMMERZ
          </button>
        </div>
      </form>

      <SSLCommerzCheckoutModal
        isOpen={isSSLCommerzOpen}
        amountCents={grossCents}
        merchantTitle="Career Pilot Mentorship"
        itemSummary={`${hours}h ${meetingMode} session with ${expert.display_name}`}
        customerName={learnerProfile.full_name}
        customerEmail={learnerProfile.email}
        onCancel={() => setIsSSLCommerzOpen(false)}
        onSuccess={handleSSLCommerzSuccess}
      />
    </div>
  );
};
