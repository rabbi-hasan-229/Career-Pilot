import { supabase } from '../../lib/supabase';
import type { ExpertBooking, ExpertWallet, ExpertWithdrawal } from '../../types';

export interface BookSessionInput {
  expertId: string;
  hours: number;
  meetingMode: 'online' | 'offline';
  scheduledStartIso: string;
  timezone: string;
  offlineCity?: string;
  offlineVenue?: string;
  topic: string;
  paymentMethod: string;
  paymentReference: string;
}

export interface BookSessionResult {
  booking: ExpertBooking;
}

export interface WithdrawalResult {
  withdrawal: ExpertWithdrawal;
  wallet: ExpertWallet;
}

export interface PaymentProviderAdapter {
  readonly providerName: string;
  createCheckoutHold(input: BookSessionInput): Promise<BookSessionResult>;
  releaseEscrowToWallet(bookingId: string): Promise<ExpertBooking>;
  refundEscrow(bookingId: string): Promise<ExpertBooking>;
  requestWithdrawal(payoutMethodId: string, amountCents: number): Promise<WithdrawalResult>;
}

/**
 * SSLCOMMERZ direct checkout + server-side expert escrow adapter backed by atomic PostgreSQL RPCs.
 */
export const sslcommerzPaymentAdapter: PaymentProviderAdapter = {
  providerName: 'SSLCOMMERZ Payment Gateway',

  async createCheckoutHold(input: BookSessionInput): Promise<BookSessionResult> {
    const { data, error } = await supabase.rpc('book_expert_session', {
      p_expert_id: input.expertId,
      p_hours: input.hours,
      p_meeting_mode: input.meetingMode,
      p_scheduled_start: input.scheduledStartIso,
      p_timezone: input.timezone,
      p_offline_city: input.offlineCity ?? null,
      p_offline_venue: input.offlineVenue ?? null,
      p_topic: input.topic,
      p_payment_method: input.paymentMethod,
      p_payment_reference: input.paymentReference,
    });
    if (error) throw new Error(error.message || 'Could not complete SSLCOMMERZ booking payment.');
    const payload = data as { booking: ExpertBooking };
    return {
      booking: payload.booking,
    };
  },

  async releaseEscrowToWallet(bookingId: string): Promise<ExpertBooking> {
    const { data, error } = await supabase.rpc('learner_confirm_session_completion', {
      p_booking_id: bookingId,
    });
    if (error) throw new Error(error.message || 'Could not confirm session and release payment.');
    return data as ExpertBooking;
  },

  async refundEscrow(bookingId: string): Promise<ExpertBooking> {
    const { data, error } = await supabase.rpc('cancel_expert_booking', {
      p_booking_id: bookingId,
    });
    if (error) throw new Error(error.message || 'Could not cancel booking and refund payment.');
    return data as ExpertBooking;
  },

  async requestWithdrawal(payoutMethodId: string, amountCents: number): Promise<WithdrawalResult> {
    const { data, error } = await supabase.rpc('request_expert_withdrawal', {
      p_payout_method_id: payoutMethodId,
      p_amount_cents: amountCents,
    });
    if (error) throw new Error(error.message || 'Could not process withdrawal.');
    return data as WithdrawalResult;
  },
};
