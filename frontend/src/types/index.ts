// Career Pilot: Professional Material 3 Data Models
import type { CareerCategory } from '../features/roadmap/careerCatalog';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  target_role: string;
  target_role_category?: CareerCategory;
  target_timeline_months?: number; // e.g. 3, 6, 9, 12, 18
  target_completion_date?: string; // ISO date string e.g. '2027-04-17'
  experience_level?: 'beginner' | 'switcher' | 'junior' | 'mid';
  plan: 'free' | 'premium';
  daily_minutes: number;
  streak_days: number;
  created_at: string;
  is_guest?: boolean;
  is_demo?: boolean;
  has_completed_onboarding?: boolean;
  bio?: string;
  username?: string;
  location?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  notification_daily_reminder?: boolean;
  notification_daily_reminder_time?: string;
  notification_milestone_alerts?: boolean;
  notification_streak_alerts?: boolean;
  notification_weekly_digest?: boolean;
  notification_sound?: boolean;
  weekly_reminder_frequency?: '2x' | '3x' | '4x';
  learning_style?: 'hands_on' | 'balanced' | 'fast_track';
  account_role?: 'learner' | 'expert';
}

export interface Role {
  id: string;
  slug: string;
  title: string;
  category: string;
  effort_hours: number;
  source: 'curated' | 'ai';
  description?: string;
  icon_name?: string;
}

export interface Milestone {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  position: number;
  start_date: string;
  end_date: string;
  status: 'todo' | 'doing' | 'done';
  effort_hours?: number;
  week_range?: string; // e.g. "Week 1 - 3"
  skills_covered?: string[];
}

export type TaskActionType = 'Learn' | 'Build' | 'Practice' | 'Checkpoint';

export interface Task {
  id: string;
  milestone_id: string;
  user_id: string;
  title: string;
  subject: string; // e.g. 'Frontend Architecture', 'PostgreSQL RLS', 'System Design'
  type: TaskActionType;
  due_date: string;
  est_minutes: number;
  progress_pct: number; // 0 to 100
  done_at?: string | null;
  quiz?: TaskQuiz;
  quiz_template_id?: string;
  deliverable?: string; // e.g. 'Build and test JWT + RLS policy in Supabase'
  resource?: {
    id: string;
    title: string;
    url: string | null;
    provider: string | null;
  };
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

export interface TaskQuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  requiresServerRpc?: boolean;
}

export interface TaskQuiz {
  id: string;
  task_id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  time_limit_sec?: number;
  questions?: TaskQuizQuestion[];
}

export interface AICoachMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  proposal?: {
    action: 'behind' | 'early' | 'pause';
    title: string;
    description: string;
    days?: number;
  };
}

export interface InterviewQuestion {
  id: string;
  role_category?: string | null;
  round: 'Behavioral' | 'Technical' | 'System Design';
  difficulty: 'Junior' | 'Mid' | 'Senior';
  question: string;
  expected_keywords: string[];
  rubric: {
    situation?: boolean;
    task?: boolean;
    action?: boolean;
    result?: boolean;
  };
  model_answer: string;
}

export interface InterviewAttempt {
  id: string;
  question_id: string;
  user_answer: string;
  score: number;
  matched_keywords: string[];
  rubric_feedback: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  ai_feedback?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  is_acquired: boolean;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  match_pct: number | null;
  required_skills: string[];
  missing_skills: string[];
  source_type?: 'sample' | 'remoteok' | 'jooble';
  source_url?: string;
  published_at?: string | null;
}

export type CVTemplateId = 'modern' | 'minimalist' | 'executive' | 'creative' | 'compact';

export interface CVData {
  template_id?: CVTemplateId;
  full_name: string;
  email: string;
  phone: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'reminder' | 'milestone' | 'streak' | 'system';
  read: boolean;
  actionLabel?: string;
  actionTab?: ActiveNavTab | ExpertDashboardTab;
  bookingId?: string;
  kind?: string;
}

export type ActiveNavTab = 'home' | 'plan' | 'overview' | 'coach' | 'interview' | 'cv' | 'skills' | 'experts' | 'profile';

export type ExpertDashboardTab = 'overview' | 'sessions' | 'messages' | 'availability' | 'resources' | 'wallet' | 'profile';

export interface ExpertResource {
  id: string;
  expert_id: string;
  title: string;
  description: string;
  resource_type: 'file' | 'link';
  storage_path?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  external_url?: string | null;
  created_at: string;
}

export type ExpertResourcePreview = Omit<ExpertResource, 'storage_path' | 'external_url'>;

export type ExpertMeetingModes = 'online' | 'offline' | 'both';

export interface ExpertExperienceItem {
  title: string;
  company: string;
  period: string;
  summary: string;
}

export interface ExpertProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  headline: string;
  bio: string;
  current_company?: string | null;
  location?: string | null;
  timezone: string;
  years_experience: number;
  categories: CareerCategory[];
  target_roles: string[];
  skills: string[];
  experiences: ExpertExperienceItem[];
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  cv_storage_path?: string | null;
  cv_filename?: string | null;
  cv_summary?: string | null;
  hourly_rate_cents: number;
  currency: 'USD';
  meeting_modes: ExpertMeetingModes;
  offline_cities: string[];
  offline_notes?: string | null;
  default_meeting_url?: string | null;
  max_hours_per_session: number;
  status: 'draft' | 'active' | 'paused';
  verification_tier: 'standard' | 'verified';
  rating_avg: number;
  review_count: number;
  completed_sessions_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExpertAvailabilitySlot {
  id: string;
  expert_id: string;
  day_of_week: number; // 0 (Sun) - 6 (Sat)
  start_time: string; // HH:MM or HH:MM:SS
  end_time: string;
  is_active: boolean;
}

export type ExpertBookingStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'completed'
  | 'cancelled_by_learner'
  | 'cancelled_by_expert';

export type ExpertPaymentStatus = 'escrow_held' | 'released_to_expert' | 'refunded';

export interface ExpertBooking {
  id: string;
  learner_id: string | null;
  expert_id: string | null;
  learner_name_snapshot: string;
  expert_name_snapshot: string;
  expert_headline_snapshot: string;
  hours: number;
  hourly_rate_cents: number;
  gross_amount_cents: number;
  platform_fee_cents: number;
  expert_payout_cents: number;
  meeting_mode: 'online' | 'offline';
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  meeting_url?: string | null;
  offline_city?: string | null;
  offline_venue?: string | null;
  topic: string;
  status: ExpertBookingStatus;
  payment_status: ExpertPaymentStatus;
  payment_method?: string | null;
  payment_reference?: string | null;
  expert_completed_at?: string | null;
  learner_confirmed_at?: string | null;
  released_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
}

export interface ExpertSessionMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface ExpertReview {
  id: string;
  booking_id: string;
  expert_id: string;
  learner_id: string;
  learner_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ExpertWallet {
  expert_id: string;
  pending_escrow_cents: number;
  available_balance_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  currency: 'USD';
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  expert_id: string;
  booking_id?: string | null;
  withdrawal_id?: string | null;
  tx_type: 'escrow_hold' | 'session_release' | 'withdrawal_debit' | 'refund_reversal';
  amount_cents: number;
  available_balance_after_cents: number;
  pending_escrow_after_cents: number;
  description: string;
  created_at: string;
}

export interface ExpertPayoutMethod {
  id: string;
  expert_id: string;
  method_type: 'bank_transfer' | 'paypal' | 'mobile_banking';
  account_label: string;
  masked_destination: string;
  is_default: boolean;
  created_at: string;
}

export interface ExpertWithdrawal {
  id: string;
  expert_id: string;
  payout_method_id?: string | null;
  payout_summary: string;
  amount_cents: number;
  status: 'processing' | 'paid' | 'failed';
  reference_code: string;
  requested_at: string;
  processed_at?: string | null;
}

export interface ExpertRegistrationDraft {
  display_name: string;
  avatar_url?: string;
  headline: string;
  bio: string;
  current_company: string;
  location: string;
  timezone: string;
  years_experience: number;
  categories: CareerCategory[];
  target_roles: string[];
  skills: string[];
  experiences: ExpertExperienceItem[];
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
  cv_summary: string;
  cv_filename?: string;
  cv_file_data_url?: string;
  hourly_rate_cents: number;
  meeting_modes: ExpertMeetingModes;
  offline_cities: string[];
  offline_notes: string;
  default_meeting_url: string;
  max_hours_per_session: number;
}
