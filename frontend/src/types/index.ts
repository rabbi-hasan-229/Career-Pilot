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

export interface TaskQuiz {
  id: string;
  task_id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  time_limit_sec?: number;
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
  actionTab?: ActiveNavTab;
}

export type ActiveNavTab = 'home' | 'plan' | 'overview' | 'coach' | 'interview' | 'cv' | 'skills' | 'profile';
