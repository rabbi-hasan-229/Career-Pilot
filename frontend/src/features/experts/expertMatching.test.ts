import { describe, expect, it } from 'vitest';
import {
  formatCurrencyCents,
  formatHourlyRate,
  generateBookableSlotsForDate,
  scoreExpertForCareerPath,
} from './expertMatching';
import type { ExpertAvailabilitySlot, ExpertBooking, ExpertProfile } from '../../types';

function makeExpert(overrides: Partial<ExpertProfile> = {}): ExpertProfile {
  return {
    user_id: 'exp-1',
    display_name: 'Nadia Rahman',
    headline: 'Staff Full Stack Engineer',
    bio: 'Web & backend mentor',
    timezone: 'UTC',
    years_experience: 9,
    categories: ['Software & Web'],
    target_roles: ['Full Stack Engineer'],
    skills: ['TypeScript', 'React 19', 'PostgreSQL'],
    experiences: [],
    hourly_rate_cents: 6500,
    currency: 'USD',
    meeting_modes: 'both',
    offline_cities: ['Dhaka'],
    max_hours_per_session: 4,
    status: 'active',
    verification_tier: 'verified',
    rating_avg: 4.9,
    review_count: 20,
    completed_sessions_count: 50,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('expertMatching', () => {
  it('formats currency cents and hourly rates cleanly', () => {
    expect(formatCurrencyCents(6500)).toBe('$65.00');
    expect(formatCurrencyCents(1055)).toBe('$10.55');
    expect(formatHourlyRate(6500)).toBe('$65/hr');
    expect(formatHourlyRate(6550)).toBe('$65.50/hr');
  });

  it('ranks experts matching target_role, target_role_category, and skills highest', () => {
    const strong = makeExpert();
    const unrelated = makeExpert({
      user_id: 'exp-2',
      display_name: 'Alex',
      headline: 'Robotics Hardware Lead',
      categories: ['Hardware & Robotics'],
      target_roles: ['Embedded Engineer'],
      skills: ['C++', 'RTOS'],
      rating_avg: 4.2,
    });

    const strongScore = scoreExpertForCareerPath(
      strong,
      'Full Stack Engineer',
      'Software & Web',
      ['TypeScript', 'PostgreSQL']
    );
    const unrelatedScore = scoreExpertForCareerPath(
      unrelated,
      'Full Stack Engineer',
      'Software & Web',
      ['TypeScript', 'PostgreSQL']
    );

    expect(strongScore.score).toBeGreaterThan(unrelatedScore.score);
    expect(strongScore.isStrongMatch).toBe(true);
    expect(strongScore.matchReasons).toContain('Matches Software & Web');
    expect(strongScore.matchReasons).toContain('Mentors Full Stack Engineer');
  });

  it('generates non-overlapping multi-hour bookable slots and excludes existing bookings', () => {
    // Pick a future Monday in local time
    const targetDate = '2027-01-04'; // Monday (day_of_week = 1)
    const now = new Date(2027, 0, 3, 10, 0, 0, 0);

    const availability: ExpertAvailabilitySlot[] = [
      {
        id: 'slot-1',
        expert_id: 'exp-1',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '13:00',
        is_active: true,
      },
    ];

    const existingBookingStart = new Date(2027, 0, 4, 10, 0, 0, 0).toISOString();
    const existingBookingEnd = new Date(2027, 0, 4, 11, 0, 0, 0).toISOString();

    const existingBookings: Pick<ExpertBooking, 'scheduled_start' | 'scheduled_end' | 'status'>[] = [
      {
        scheduled_start: existingBookingStart,
        scheduled_end: existingBookingEnd,
        status: 'confirmed',
      },
    ];

    const oneHourSlots = generateBookableSlotsForDate(
      availability,
      existingBookings,
      targetDate,
      1,
      now
    );
    // Available hours in 09:00-13:00 excluding 10:00-11:00 -> 09:00, 11:00, 12:00 (3 slots)
    expect(oneHourSlots).toHaveLength(3);

    const twoHourSlots = generateBookableSlotsForDate(
      availability,
      existingBookings,
      targetDate,
      2,
      now
    );
    // 09-11 conflicts with 10-11; 10-12 conflicts with 10-11; only 11-13 fits cleanly (1 slot)
    expect(twoHourSlots).toHaveLength(1);
    expect(new Date(twoHourSlots[0].startIso).getHours()).toBe(11);
    expect(new Date(twoHourSlots[0].endIso).getHours()).toBe(13);
  });
});
