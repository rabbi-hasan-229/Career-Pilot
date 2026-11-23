import type { CareerCategory } from '../roadmap/careerCatalog';
import type {
  ExpertAvailabilitySlot,
  ExpertBooking,
  ExpertProfile,
  ExpertRegistrationDraft,
} from '../../types';

export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

export function createInitialExpertDraft(
  overrides: Partial<ExpertRegistrationDraft> = {}
): ExpertRegistrationDraft {
  const browserTz =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC';
  return {
    display_name: '',
    headline: '',
    bio: '',
    current_company: '',
    location: '',
    timezone: browserTz,
    years_experience: 5,
    categories: ['Software & Web'],
    target_roles: [],
    skills: [],
    experiences: [{ title: '', company: '', period: '', summary: '' }],
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
    cv_summary: '',
    cv_filename: '',
    cv_file_data_url: undefined,
    hourly_rate_cents: 5000,
    meeting_modes: 'both',
    offline_cities: [],
    offline_notes: '',
    default_meeting_url: '',
    max_hours_per_session: 4,
    ...overrides,
  };
}

export interface ExpertMatchResult {
  score: number;
  matchReasons: string[];
  isStrongMatch: boolean;
}

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

export function formatCurrencyCents(cents: number): string {
  const value = (cents / 100).toFixed(2);
  return `$${value}`;
}

export function formatHourlyRate(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}/hr` : `$${dollars.toFixed(2)}/hr`;
}

/**
 * Deterministic relevance scorer matching an industry expert to the learner's
 * currently selected career path (target_role, target_role_category, skills).
 */
export function scoreExpertForCareerPath(
  expert: Pick<ExpertProfile, 'categories' | 'target_roles' | 'headline' | 'skills' | 'rating_avg'>,
  targetRole: string,
  targetCategory?: CareerCategory,
  learnerSkills: string[] = []
): ExpertMatchResult {
  let score = 0;
  const matchReasons: string[] = [];

  if (targetCategory && expert.categories.includes(targetCategory)) {
    score += 50;
    matchReasons.push(`Matches ${targetCategory}`);
  }

  const normalizedRole = targetRole.trim().toLowerCase();
  const roleTokens = new Set(normalizeTokens(targetRole));

  const expertRolesLower = expert.target_roles.map((r) => r.trim().toLowerCase());
  const exactRoleMatch = normalizedRole
    ? expertRolesLower.some(
        (r) => r === normalizedRole || r.includes(normalizedRole) || normalizedRole.includes(r)
      )
    : false;

  if (exactRoleMatch) {
    score += 35;
    matchReasons.push(`Mentors ${targetRole}`);
  } else if (roleTokens.size > 0) {
    const expertRoleText = `${expert.headline} ${expert.target_roles.join(' ')}`;
    const expertTokens = new Set(normalizeTokens(expertRoleText));
    let overlap = 0;
    for (const token of roleTokens) {
      if (expertTokens.has(token)) overlap += 1;
    }
    if (overlap > 0) {
      const tokenPoints = Math.min(28, Math.round((overlap / roleTokens.size) * 28));
      score += tokenPoints;
      if (tokenPoints >= 14) {
        matchReasons.push(`Relevant to ${targetRole}`);
      }
    }
  }

  if (learnerSkills.length > 0 && expert.skills.length > 0) {
    const expertSkillsNorm = expert.skills.map((s) => s.trim().toLowerCase());
    const sharedSkills = learnerSkills.filter((skill) => {
      const needle = skill.trim().toLowerCase();
      return needle.length >= 2 && expertSkillsNorm.some((es) => es === needle || es.includes(needle) || needle.includes(es));
    });
    if (sharedSkills.length > 0) {
      score += Math.min(15, sharedSkills.length * 5);
      matchReasons.push(`Skills: ${sharedSkills.slice(0, 2).join(', ')}`);
    }
  }

  if (expert.rating_avg >= 4.7) {
    score += 4;
  }

  return {
    score: Math.min(100, score),
    matchReasons,
    isStrongMatch: score >= 45,
  };
}

export interface BookableTimeSlot {
  startIso: string;
  endIso: string;
  label: string;
}

function parseTimeParts(timeStr: string): { hours: number; minutes: number } {
  const [hStr = '9', mStr = '0'] = timeStr.split(':');
  return {
    hours: Math.max(0, Math.min(23, Number.parseInt(hStr, 10) || 0)),
    minutes: Math.max(0, Math.min(59, Number.parseInt(mStr, 10) || 0)),
  };
}

/**
 * Generates non-overlapping hourly start slots on a given YYYY-MM-DD date
 * from an expert's weekly availability and existing active bookings.
 */
export function generateBookableSlotsForDate(
  availabilitySlots: ExpertAvailabilitySlot[],
  existingBookings: Pick<ExpertBooking, 'scheduled_start' | 'scheduled_end' | 'status'>[],
  dateOnly: string,
  durationHours: number,
  now: Date = new Date()
): BookableTimeSlot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) || durationHours < 1) return [];

  const [year, month, day] = dateOnly.split('-').map((n) => Number.parseInt(n, 10));
  const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayOfWeek = localMidnight.getDay();

  const matchingWindows = availabilitySlots.filter(
    (slot) => slot.is_active && slot.day_of_week === dayOfWeek
  );
  if (matchingWindows.length === 0) return [];

  const activeBookings = existingBookings
    .filter((b) => b.status === 'pending_confirmation' || b.status === 'confirmed')
    .map((b) => ({
      startMs: new Date(b.scheduled_start).getTime(),
      endMs: new Date(b.scheduled_end).getTime(),
    }));

  const minStartMs = now.getTime() + 15 * 60 * 1000;
  const durationMs = durationHours * 60 * 60 * 1000;
  const slots: BookableTimeSlot[] = [];
  const seenStarts = new Set<number>();

  for (const windowItem of matchingWindows) {
    const startParts = parseTimeParts(windowItem.start_time);
    const endParts = parseTimeParts(windowItem.end_time);
    const windowStart = new Date(year, month - 1, day, startParts.hours, startParts.minutes, 0, 0).getTime();
    const windowEnd = new Date(year, month - 1, day, endParts.hours, endParts.minutes, 0, 0).getTime();

    for (let cursor = windowStart; cursor + durationMs <= windowEnd; cursor += 60 * 60 * 1000) {
      if (cursor < minStartMs || seenStarts.has(cursor)) continue;
      const candidateEnd = cursor + durationMs;
      const conflicts = activeBookings.some(
        (booking) => cursor < booking.endMs && candidateEnd > booking.startMs
      );
      if (conflicts) continue;

      seenStarts.add(cursor);
      const startDate = new Date(cursor);
      const endDate = new Date(candidateEnd);
      const fmt = (d: Date) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      slots.push({
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString(),
        label: `${fmt(startDate)} – ${fmt(endDate)}`,
      });
    }
  }

  return slots.sort((a, b) => a.startIso.localeCompare(b.startIso));
}
