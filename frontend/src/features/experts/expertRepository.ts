import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type {
  ExpertAvailabilitySlot,
  ExpertBooking,
  ExpertPayoutMethod,
  ExpertProfile,
  ExpertRegistrationDraft,
  ExpertResource,
  ExpertResourcePreview,
  ExpertReview,
  ExpertSessionMessage,
  ExpertWallet,
  ExpertWithdrawal,
  WalletTransaction,
} from '../../types';
import {
  DEMO_EXPERTS,
  DEMO_EXPERT_AVAILABILITY,
  DEMO_EXPERT_RESOURCES,
  DEMO_EXPERT_REVIEWS,
} from './demoExperts';
import { sslcommerzPaymentAdapter } from './paymentAdapter';

const PENDING_EXPERT_DRAFT_KEY = 'career_pilot_pending_expert_draft';
const PENDING_EXPERT_CV_DATA_KEY = 'career_pilot_pending_expert_cv_data';
const LOCAL_EXPERT_PROFILE_PREFIX = 'career_pilot_local_expert_profile_';
const PENDING_OAUTH_ROLE_KEY = 'career_pilot_pending_oauth_role';
const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_RESOURCE_BYTES = 15 * 1024 * 1024;

export function validateExpertResourceFile(file: File): string | null {
  if (!file) return 'Please choose a file to upload.';
  if (file.size > MAX_RESOURCE_BYTES) {
    return 'Resource file must be 15 MB or smaller.';
  }
  return null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const inFlightRegistrations = new Map<string, Promise<ExpertProfile | null>>();

export function isExpertSchemaMissingError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = error.message || '';
  return (
    code === 'PGRST200' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    code === '42883' ||
    code === '42P01' ||
    /does not exist|schema cache|could not find (the|a) (function|table|column|relationship)/i.test(msg)
  );
}
const ALLOWED_CV_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

export function validateExpertCVFile(file: File): string | null {
  if (!file) return 'Please choose a CV file.';
  const extOk = /\.(pdf|docx?)$/i.test(file.name);
  if (!ALLOWED_CV_MIME_TYPES.has(file.type) && !extOk) {
    return 'Upload a PDF or Word (.doc/.docx) CV file.';
  }
  if (file.size > MAX_CV_BYTES) {
    return 'CV file must be 5 MB or smaller.';
  }
  return null;
}

export function savePendingExpertDraft(draft: ExpertRegistrationDraft): void {
  const { cv_file_data_url, ...metadataOnly } = draft;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PENDING_EXPERT_DRAFT_KEY, JSON.stringify(metadataOnly));
      if (cv_file_data_url) {
        try {
          window.localStorage.setItem(PENDING_EXPERT_CV_DATA_KEY, cv_file_data_url);
        } catch {
          // Ignore quota error for large binary CV data URL; structured draft is still saved
        }
      } else {
        window.localStorage.removeItem(PENDING_EXPERT_CV_DATA_KEY);
      }
    }
  } catch {
    // Ignore storage quota issues
  }
}

export function loadPendingExpertDraft(): ExpertRegistrationDraft | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(PENDING_EXPERT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExpertRegistrationDraft;
    const cvDataUrl = window.localStorage.getItem(PENDING_EXPERT_CV_DATA_KEY) || undefined;
    return { ...parsed, cv_file_data_url: cvDataUrl };
  } catch {
    return null;
  }
}

export function clearPendingExpertDraft(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PENDING_EXPERT_DRAFT_KEY);
      window.localStorage.removeItem(PENDING_EXPERT_CV_DATA_KEY);
    }
  } catch {
    // Ignore storage failure
  }
}

function saveLocalExpertProfileFallback(userId: string, profile: ExpertProfile): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${LOCAL_EXPERT_PROFILE_PREFIX}${userId}`, JSON.stringify(profile));
    }
  } catch {
    // Ignore storage failure
  }
}

function loadLocalExpertProfileFallback(userId: string): ExpertProfile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${LOCAL_EXPERT_PROFILE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as ExpertProfile) : null;
  } catch {
    return null;
  }
}

export function setPendingOAuthAccountRole(role: 'learner' | 'expert'): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (role === 'expert') {
      window.localStorage.setItem(PENDING_OAUTH_ROLE_KEY, 'expert');
    } else {
      window.localStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    }
  } catch {
    // Ignore storage error
  }
}

export function consumePendingOAuthAccountRole(): 'expert' | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const val = window.localStorage.getItem(PENDING_OAUTH_ROLE_KEY);
    window.localStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
    return val === 'expert' ? 'expert' : null;
  } catch {
    return null;
  }
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [meta, base64] = dataUrl.split(',');
    if (!meta || !base64) return null;
    const mimeMatch = /data:([^;]+);base64/.exec(meta);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected CV file.'));
    reader.readAsDataURL(file);
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'expert_cv.pdf';
}

export const expertRepository = {
  async uploadExpertCV(userId: string, file: File): Promise<{ storagePath: string; filename: string }> {
    const validationError = validateExpertCVFile(file);
    if (validationError) throw new Error(validationError);

    const safeName = sanitizeFilename(file.name);
    const storagePath = `${userId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from('expert-cvs')
      .upload(storagePath, file, { upsert: true, contentType: file.type || 'application/pdf' });

    if (error) {
      throw new Error(error.message || 'Could not upload your CV file.');
    }

    return { storagePath, filename: file.name };
  },

  async uploadExpertCVBlob(userId: string, filename: string, blob: Blob): Promise<{ storagePath: string; filename: string }> {
    const safeName = sanitizeFilename(filename);
    const storagePath = `${userId}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage
      .from('expert-cvs')
      .upload(storagePath, blob, { upsert: true, contentType: blob.type || 'application/pdf' });

    if (error) {
      throw new Error(error.message || 'Could not upload your CV file.');
    }
    return { storagePath, filename };
  },

  async getExpertCVSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('expert-cvs')
      .createSignedUrl(storagePath, 60 * 15);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Could not open CV document.');
    }
    return data.signedUrl;
  },

  async claimInitialExpertRole(): Promise<void> {
    const { error } = await supabase.rpc('claim_initial_expert_role');
    if (error) throw new Error(error.message || 'Could not activate expert account role.');
  },

  async saveExpertProfile(input: {
    displayName: string;
    avatarUrl?: string | null;
    headline: string;
    bio: string;
    currentCompany?: string;
    location?: string;
    timezone: string;
    yearsExperience: number;
    categories: string[];
    targetRoles: string[];
    skills: string[];
    experiences: ExpertProfile['experiences'];
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    cvStoragePath?: string | null;
    cvFilename?: string | null;
    cvSummary?: string;
    hourlyRateCents: number;
    meetingModes: ExpertProfile['meeting_modes'];
    offlineCities: string[];
    offlineNotes?: string;
    defaultMeetingUrl?: string;
    maxHoursPerSession?: number;
  }): Promise<ExpertProfile> {
    const { data, error } = await supabase.rpc('upsert_expert_profile', {
      p_display_name: input.displayName,
      p_avatar_url: input.avatarUrl ?? null,
      p_headline: input.headline,
      p_bio: input.bio,
      p_current_company: input.currentCompany ?? null,
      p_location: input.location ?? null,
      p_timezone: input.timezone,
      p_years_experience: input.yearsExperience,
      p_categories: input.categories,
      p_target_roles: input.targetRoles,
      p_skills: input.skills,
      p_experiences: input.experiences,
      p_portfolio_url: input.portfolioUrl ?? null,
      p_linkedin_url: input.linkedinUrl ?? null,
      p_github_url: input.githubUrl ?? null,
      p_cv_storage_path: input.cvStoragePath ?? null,
      p_cv_filename: input.cvFilename ?? null,
      p_cv_summary: input.cvSummary ?? null,
      p_hourly_rate_cents: input.hourlyRateCents,
      p_meeting_modes: input.meetingModes,
      p_offline_cities: input.offlineCities,
      p_offline_notes: input.offlineNotes ?? null,
      p_default_meeting_url: input.defaultMeetingUrl ?? null,
      p_max_hours_per_session: input.maxHoursPerSession ?? 4,
    });

    if (error) {
      if (isExpertSchemaMissingError(error)) {
        const { data: userRes } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const uid = userRes?.user?.id || 'local-expert';
        const nowIso = new Date().toISOString();
        const fallbackProfile: ExpertProfile = {
          user_id: uid,
          display_name: input.displayName,
          avatar_url: input.avatarUrl ?? null,
          headline: input.headline,
          bio: input.bio,
          current_company: input.currentCompany ?? null,
          location: input.location ?? null,
          timezone: input.timezone,
          years_experience: input.yearsExperience,
          categories: input.categories as ExpertProfile['categories'],
          target_roles: input.targetRoles,
          skills: input.skills,
          experiences: input.experiences,
          portfolio_url: input.portfolioUrl ?? null,
          linkedin_url: input.linkedinUrl ?? null,
          github_url: input.githubUrl ?? null,
          cv_storage_path: input.cvStoragePath ?? null,
          cv_filename: input.cvFilename ?? null,
          cv_summary: input.cvSummary ?? null,
          hourly_rate_cents: input.hourlyRateCents,
          currency: 'USD',
          meeting_modes: input.meetingModes,
          offline_cities: input.offlineCities,
          offline_notes: input.offlineNotes ?? null,
          default_meeting_url: input.defaultMeetingUrl ?? null,
          max_hours_per_session: input.maxHoursPerSession ?? 4,
          status: 'active',
          verification_tier: input.cvFilename || input.portfolioUrl || input.linkedinUrl ? 'verified' : 'standard',
          rating_avg: 0,
          review_count: 0,
          completed_sessions_count: 0,
          created_at: nowIso,
          updated_at: nowIso,
        };
        saveLocalExpertProfileFallback(uid, fallbackProfile);
        return fallbackProfile;
      }
      throw new Error(error.message || 'Could not save expert profile.');
    }
    return data as ExpertProfile;
  },

  async completePendingRegistration(
    userId: string,
    avatarUrl?: string | null,
    userMetadata?: Record<string, unknown>
  ): Promise<ExpertProfile | null> {
    const existingPromise = inFlightRegistrations.get(userId);
    if (existingPromise) return existingPromise;

    const run = (async () => {
      const metaDraft =
        userMetadata?.expert_draft && typeof userMetadata.expert_draft === 'object'
          ? (userMetadata.expert_draft as ExpertRegistrationDraft)
          : null;
      const draft = loadPendingExpertDraft() ?? metaDraft;
      if (!draft) return null;

      let cvStoragePath: string | null = null;
      let cvFilename: string | null = draft.cv_filename || null;

      if (draft.cv_file_data_url && draft.cv_filename) {
        try {
          const blob = dataUrlToBlob(draft.cv_file_data_url);
          if (blob) {
            const uploaded = await this.uploadExpertCVBlob(userId, draft.cv_filename, blob);
            cvStoragePath = uploaded.storagePath;
            cvFilename = uploaded.filename;
          }
        } catch (uploadErr) {
          console.warn('CV file upload deferred; saving profile with CV metadata:', uploadErr);
        }
      }

      const saved = await this.saveExpertProfile({
        displayName: draft.display_name,
        avatarUrl: draft.avatar_url ?? avatarUrl ?? null,
        headline: draft.headline,
        bio: draft.bio,
        currentCompany: draft.current_company,
        location: draft.location,
        timezone: draft.timezone,
        yearsExperience: draft.years_experience,
        categories: draft.categories,
        targetRoles: draft.target_roles,
        skills: draft.skills,
        experiences: draft.experiences,
        portfolioUrl: draft.portfolio_url,
        linkedinUrl: draft.linkedin_url,
        githubUrl: draft.github_url,
        cvStoragePath,
        cvFilename,
        cvSummary: draft.cv_summary,
        hourlyRateCents: draft.hourly_rate_cents,
        meetingModes: draft.meeting_modes,
        offlineCities: draft.offline_cities,
        offlineNotes: draft.offline_notes,
        defaultMeetingUrl: draft.default_meeting_url,
        maxHoursPerSession: draft.max_hours_per_session,
      });

      clearPendingExpertDraft();
      return saved;
    })().finally(() => {
      inFlightRegistrations.delete(userId);
    });

    inFlightRegistrations.set(userId, run);
    return run;
  },

  async isExpertMarketplaceMigrated(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('expert_bookings')
      .select('id')
      .limit(1);
    if (error && isExpertSchemaMissingError(error)) return false;
    return true;
  },

  async loadMyExpertProfile(userId: string): Promise<ExpertProfile | null> {
    if (!isSupabaseConfigured()) return loadLocalExpertProfileFallback(userId);
    const { data, error } = await supabase
      .from('expert_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      if (isExpertSchemaMissingError(error)) return loadLocalExpertProfileFallback(userId);
      throw new Error(error.message);
    }
    return (data as ExpertProfile | null) ?? loadLocalExpertProfileFallback(userId);
  },

  async listActiveExperts(isDemo = false): Promise<ExpertProfile[]> {
    if (isDemo || !isSupabaseConfigured()) {
      return DEMO_EXPERTS;
    }
    const { data, error } = await supabase
      .from('expert_profiles')
      .select('*')
      .eq('status', 'active')
      .order('rating_avg', { ascending: false })
      .order('completed_sessions_count', { ascending: false });

    if (error) {
      if (isExpertSchemaMissingError(error)) return DEMO_EXPERTS;
      throw new Error(error.message || 'Could not load experts directory.');
    }
    return (data as ExpertProfile[]) ?? [];
  },

  async loadExpertAvailability(expertId: string, isDemo = false): Promise<ExpertAvailabilitySlot[]> {
    if (isDemo || !isSupabaseConfigured() || expertId.startsWith('exp_demo_')) {
      return DEMO_EXPERT_AVAILABILITY.map((s) => ({ ...s, expert_id: expertId }));
    }
    const { data, error } = await supabase
      .from('expert_availability_slots')
      .select('*')
      .eq('expert_id', expertId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) {
      if (isExpertSchemaMissingError(error)) {
        return DEMO_EXPERT_AVAILABILITY.map((s) => ({ ...s, expert_id: expertId }));
      }
      throw new Error(error.message || 'Could not load expert availability.');
    }
    return (data as ExpertAvailabilitySlot[]) ?? [];
  },

  async saveExpertAvailability(
    expertId: string,
    slots: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>
  ): Promise<ExpertAvailabilitySlot[]> {
    const { error: delError } = await supabase
      .from('expert_availability_slots')
      .delete()
      .eq('expert_id', expertId);
    if (delError) throw new Error(delError.message);

    if (slots.length === 0) return [];
    const payload = slots.map((s) => ({
      expert_id: expertId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
    }));
    const { data, error } = await supabase
      .from('expert_availability_slots')
      .insert(payload)
      .select('*')
      .order('day_of_week', { ascending: true });
    if (error) throw new Error(error.message || 'Could not save availability.');
    return (data as ExpertAvailabilitySlot[]) ?? [];
  },

  async loadExpertBookedSlots(expertId: string, isDemo = false): Promise<Pick<ExpertBooking, 'scheduled_start' | 'scheduled_end' | 'status'>[]> {
    if (isDemo || !isSupabaseConfigured() || expertId.startsWith('exp_demo_')) {
      return [];
    }
    // Note: expert_bookings RLS restricts select to participants, so availability conflicts are
    // additionally enforced atomically inside book_expert_session(). We still read participant
    // bookings when available.
    const { data } = await supabase
      .from('expert_bookings')
      .select('scheduled_start, scheduled_end, status')
      .eq('expert_id', expertId)
      .in('status', ['pending_confirmation', 'confirmed']);
    return (data as Pick<ExpertBooking, 'scheduled_start' | 'scheduled_end' | 'status'>[]) ?? [];
  },

  async loadExpertReviews(expertId: string, isDemo = false): Promise<ExpertReview[]> {
    if (isDemo || !isSupabaseConfigured() || expertId.startsWith('exp_demo_')) {
      return DEMO_EXPERT_REVIEWS[expertId] ?? [];
    }
    const { data, error } = await supabase
      .from('expert_reviews')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      if (isExpertSchemaMissingError(error)) return DEMO_EXPERT_REVIEWS[expertId] ?? [];
      throw new Error(error.message);
    }
    return (data as ExpertReview[]) ?? [];
  },

  bookSession: sslcommerzPaymentAdapter.createCheckoutHold.bind(sslcommerzPaymentAdapter),
  learnerConfirmSession: sslcommerzPaymentAdapter.releaseEscrowToWallet.bind(sslcommerzPaymentAdapter),
  cancelBooking: sslcommerzPaymentAdapter.refundEscrow.bind(sslcommerzPaymentAdapter),
  requestWithdrawal: sslcommerzPaymentAdapter.requestWithdrawal.bind(sslcommerzPaymentAdapter),

  async loadLearnerBookings(learnerId: string): Promise<ExpertBooking[]> {
    const { data, error } = await supabase
      .from('expert_bookings')
      .select('*')
      .eq('learner_id', learnerId)
      .order('scheduled_start', { ascending: false });
    if (error) {
      if (isExpertSchemaMissingError(error)) return [];
      throw new Error(error.message || 'Could not load your bookings.');
    }
    return (data as ExpertBooking[]) ?? [];
  },

  async loadExpertBookings(expertId: string): Promise<ExpertBooking[]> {
    const { data, error } = await supabase
      .from('expert_bookings')
      .select('*')
      .eq('expert_id', expertId)
      .order('scheduled_start', { ascending: true });
    if (error) {
      if (isExpertSchemaMissingError(error)) return [];
      throw new Error(error.message || 'Could not load expert sessions.');
    }
    return (data as ExpertBooking[]) ?? [];
  },

  async confirmBooking(bookingId: string, meetingUrl?: string, offlineVenue?: string): Promise<ExpertBooking> {
    const { data, error } = await supabase.rpc('confirm_expert_booking', {
      p_booking_id: bookingId,
      p_meeting_url: meetingUrl ?? null,
      p_offline_venue: offlineVenue ?? null,
    });
    if (error) throw new Error(error.message || 'Could not confirm booking.');
    return data as ExpertBooking;
  },

  async expertMarkSessionCompleted(bookingId: string): Promise<ExpertBooking> {
    const { data, error } = await supabase.rpc('expert_mark_session_completed', {
      p_booking_id: bookingId,
    });
    if (error) throw new Error(error.message || 'Could not mark session delivered.');
    return data as ExpertBooking;
  },

  async submitReview(bookingId: string, rating: number, comment: string): Promise<ExpertReview> {
    const { data, error } = await supabase.rpc('submit_expert_review', {
      p_booking_id: bookingId,
      p_rating: rating,
      p_comment: comment,
    });
    if (error) throw new Error(error.message || 'Could not submit review.');
    return data as ExpertReview;
  },

  async loadSessionMessages(bookingId: string, afterCreatedAt?: string): Promise<ExpertSessionMessage[]> {
    let query = supabase
      .from('expert_session_messages')
      .select('*')
      .eq('booking_id', bookingId);
    if (afterCreatedAt) {
      query = query.gte('created_at', afterCreatedAt);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message || 'Could not load session messages.');
    return (data as ExpertSessionMessage[]) ?? [];
  },

  async sendSessionMessage(bookingId: string, senderId: string, senderName: string, message: string): Promise<ExpertSessionMessage> {
    const trimmed = message.trim();
    if (!trimmed) throw new Error('Enter a message first.');
    const { data, error } = await supabase
      .from('expert_session_messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        sender_name: senderName,
        message: trimmed,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message || 'Could not send message.');
    return data as ExpertSessionMessage;
  },

  async loadLatestSessionMessages(bookingIds: string[]): Promise<Record<string, ExpertSessionMessage>> {
    const uniqueIds = [...new Set(bookingIds.filter(Boolean))];
    if (uniqueIds.length === 0 || !isSupabaseConfigured()) return {};
    const { data, error } = await supabase
      .from('expert_session_messages')
      .select('*')
      .in('booking_id', uniqueIds)
      .order('created_at', { ascending: false });
    if (error) {
      if (isExpertSchemaMissingError(error)) return {};
      throw new Error(error.message || 'Could not load recent session messages.');
    }
    const latest: Record<string, ExpertSessionMessage> = {};
    for (const row of (data as ExpertSessionMessage[]) ?? []) {
      if (!latest[row.booking_id]) {
        latest[row.booking_id] = row;
      }
    }
    return latest;
  },

  async loadExpertWalletAndLedger(expertId: string): Promise<{
    wallet: ExpertWallet;
    transactions: WalletTransaction[];
    payoutMethods: ExpertPayoutMethod[];
    withdrawals: ExpertWithdrawal[];
  }> {
    const [walletRes, txRes, methodsRes, wdRes] = await Promise.all([
      supabase.from('expert_wallets').select('*').eq('expert_id', expertId).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('expert_id', expertId).order('created_at', { ascending: false }).limit(50),
      supabase
        .from('expert_payout_methods')
        .select('*')
        .eq('expert_id', expertId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('expert_withdrawals').select('*').eq('expert_id', expertId).order('requested_at', { ascending: false }).limit(30),
    ]);

    if (walletRes.error && !isExpertSchemaMissingError(walletRes.error)) throw new Error(walletRes.error.message);
    if (txRes.error && !isExpertSchemaMissingError(txRes.error)) throw new Error(txRes.error.message);
    if (methodsRes.error && !isExpertSchemaMissingError(methodsRes.error)) throw new Error(methodsRes.error.message);
    if (wdRes.error && !isExpertSchemaMissingError(wdRes.error)) throw new Error(wdRes.error.message);

    const wallet: ExpertWallet = (walletRes.data as ExpertWallet | null) ?? {
      expert_id: expertId,
      pending_escrow_cents: 0,
      available_balance_cents: 0,
      total_earned_cents: 0,
      total_withdrawn_cents: 0,
      currency: 'USD',
      updated_at: new Date().toISOString(),
    };

    return {
      wallet,
      transactions: (txRes.data as WalletTransaction[]) ?? [],
      payoutMethods: (methodsRes.data as ExpertPayoutMethod[]) ?? [],
      withdrawals: (wdRes.data as ExpertWithdrawal[]) ?? [],
    };
  },

  async addPayoutMethod(
    expertId: string,
    methodType: ExpertPayoutMethod['method_type'],
    accountLabel: string,
    maskedDestination: string
  ): Promise<ExpertPayoutMethod> {
    await supabase
      .from('expert_payout_methods')
      .update({ is_default: false })
      .eq('expert_id', expertId);

    const { data, error } = await supabase
      .from('expert_payout_methods')
      .insert({
        expert_id: expertId,
        method_type: methodType,
        account_label: accountLabel.trim(),
        masked_destination: maskedDestination.trim(),
        is_default: true,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message || 'Could not save payout method.');
    return data as ExpertPayoutMethod;
  },

  async setDefaultPayoutMethod(expertId: string, methodId: string): Promise<void> {
    const { error: resetError } = await supabase
      .from('expert_payout_methods')
      .update({ is_default: false })
      .eq('expert_id', expertId);
    if (resetError) throw new Error(resetError.message || 'Could not update default payout method.');

    const { error } = await supabase
      .from('expert_payout_methods')
      .update({ is_default: true })
      .eq('id', methodId)
      .eq('expert_id', expertId);
    if (error) throw new Error(error.message || 'Could not set default payout method.');
  },

  async deletePayoutMethod(methodId: string): Promise<void> {
    const { error } = await supabase.from('expert_payout_methods').delete().eq('id', methodId);
    if (error) throw new Error(error.message || 'Could not remove payout method.');
  },

  // ===========================================================================
  // EXPERT FILES & CONSULTATION RESOURCES (Auto-unlocked on Booking Purchase)
  // ===========================================================================

  async listMyExpertResources(expertId: string): Promise<ExpertResource[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('expert_resources')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });
    if (error) {
      if (isExpertSchemaMissingError(error)) return [];
      throw new Error(error.message || 'Could not load your uploaded resources.');
    }
    return (data as ExpertResource[]) ?? [];
  },

  async listExpertResourcePreviews(expertId: string, isDemo = false): Promise<ExpertResourcePreview[]> {
    if (isDemo || !isSupabaseConfigured() || expertId.startsWith('exp_demo_')) {
      return (DEMO_EXPERT_RESOURCES[expertId] ?? []).map(({ storage_path: _s, external_url: _u, ...rest }) => rest);
    }
    const { data, error } = await supabase.rpc('list_expert_resource_previews', {
      p_expert_id: expertId,
    });
    if (error) {
      if (isExpertSchemaMissingError(error)) return [];
      throw new Error(error.message || 'Could not load expert resource previews.');
    }
    return (data as ExpertResourcePreview[]) ?? [];
  },

  async listUnlockedResourcesForExperts(expertIds: string[], isDemo = false): Promise<ExpertResource[]> {
    const uniqueIds = [...new Set(expertIds.filter(Boolean))];
    if (uniqueIds.length === 0) return [];
    if (isDemo || !isSupabaseConfigured()) {
      return uniqueIds.flatMap((id) => DEMO_EXPERT_RESOURCES[id] ?? []);
    }

    const demoIds = uniqueIds.filter((id) => id.startsWith('exp_demo_'));
    const liveIds = uniqueIds.filter((id) => !id.startsWith('exp_demo_'));
    const demoRows = demoIds.flatMap((id) => DEMO_EXPERT_RESOURCES[id] ?? []);

    if (liveIds.length === 0) return demoRows;

    const { data, error } = await supabase
      .from('expert_resources')
      .select('*')
      .in('expert_id', liveIds)
      .order('created_at', { ascending: false });
    if (error) {
      if (isExpertSchemaMissingError(error)) return demoRows;
      throw new Error(error.message || 'Could not load unlocked consultation resources.');
    }
    return [...((data as ExpertResource[]) ?? []), ...demoRows];
  },

  async uploadExpertResourceFile(
    expertId: string,
    title: string,
    description: string,
    file: File
  ): Promise<ExpertResource> {
    const err = validateExpertResourceFile(file);
    if (err) throw new Error(err);

    const safeName = sanitizeFilename(file.name);
    const storagePath = `${expertId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from('expert-resources')
      .upload(storagePath, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (uploadError) {
      throw new Error(uploadError.message || 'Could not upload resource file.');
    }

    const { data, error: dbError } = await supabase
      .from('expert_resources')
      .insert({
        expert_id: expertId,
        title: title.trim(),
        description: description.trim(),
        resource_type: 'file',
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
      })
      .select('*')
      .single();

    if (dbError) {
      await supabase.storage.from('expert-resources').remove([storagePath]).catch(() => {});
      throw new Error(dbError.message || 'Could not save uploaded resource record.');
    }
    return data as ExpertResource;
  },

  async addExpertResourceLink(
    expertId: string,
    title: string,
    description: string,
    externalUrl: string
  ): Promise<ExpertResource> {
    const cleanUrl = externalUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      throw new Error('Enter a valid resource URL starting with http:// or https://');
    }
    const { data, error } = await supabase
      .from('expert_resources')
      .insert({
        expert_id: expertId,
        title: title.trim(),
        description: description.trim(),
        resource_type: 'link',
        external_url: cleanUrl,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message || 'Could not save resource link.');
    return data as ExpertResource;
  },

  async deleteExpertResource(resource: ExpertResource): Promise<void> {
    if (resource.storage_path) {
      await supabase.storage.from('expert-resources').remove([resource.storage_path]).catch(() => {});
    }
    const { error } = await supabase.from('expert_resources').delete().eq('id', resource.id);
    if (error) throw new Error(error.message || 'Could not delete resource.');
  },

  async getExpertResourceSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('expert-resources')
      .createSignedUrl(storagePath, 60 * 15);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Could not generate download link for resource.');
    }
    return data.signedUrl;
  },
};
