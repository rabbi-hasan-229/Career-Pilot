import { describe, it, expect } from 'vitest';
import {
  getLocalDateOnly,
  addDaysToDateOnly,
  addMonthsToDateOnly,
  daysBetweenDateOnly,
} from './dateOnly';

describe('dateOnly utilities', () => {
  describe('getLocalDateOnly', () => {
    it('returns a formatted YYYY-MM-DD date string', () => {
      const fixedDate = new Date(2026, 8, 15); // Sep 15, 2026
      expect(getLocalDateOnly(fixedDate)).toBe('2026-09-15');
    });

    it('pads single-digit month and day with zero', () => {
      const singleDigit = new Date(2026, 0, 5); // Jan 5, 2026
      expect(getLocalDateOnly(singleDigit)).toBe('2026-01-05');
    });
  });

  describe('addDaysToDateOnly', () => {
    it('correctly adds days within the same month', () => {
      expect(addDaysToDateOnly('2026-05-10', 5)).toBe('2026-05-15');
    });

    it('handles month boundaries and rollover', () => {
      expect(addDaysToDateOnly('2026-05-30', 3)).toBe('2026-06-02');
    });

    it('handles year rollover', () => {
      expect(addDaysToDateOnly('2026-12-30', 3)).toBe('2027-01-02');
    });

    it('handles subtraction (negative days)', () => {
      expect(addDaysToDateOnly('2026-06-02', -3)).toBe('2026-05-30');
    });

    it('handles leap year in February 2028', () => {
      expect(addDaysToDateOnly('2028-02-28', 1)).toBe('2028-02-29');
      expect(addDaysToDateOnly('2028-02-28', 2)).toBe('2028-03-01');
    });

    it('handles non-leap year in February 2026', () => {
      expect(addDaysToDateOnly('2026-02-28', 1)).toBe('2026-03-01');
    });

    it('returns original input if invalid date format is provided', () => {
      expect(addDaysToDateOnly('invalid-date', 5)).toBe('invalid-date');
      expect(addDaysToDateOnly('2026-02-30', 5)).toBe('2026-02-30');
    });
  });

  describe('addMonthsToDateOnly', () => {
    it('correctly adds months within the same year', () => {
      expect(addMonthsToDateOnly('2026-01-15', 3)).toBe('2026-04-15');
    });

    it('handles year rollover', () => {
      expect(addMonthsToDateOnly('2026-10-15', 4)).toBe('2027-02-15');
    });

    it('clamps to the last day of target month when target has fewer days (Jan 31 -> Feb 28)', () => {
      expect(addMonthsToDateOnly('2026-01-31', 1)).toBe('2026-02-28');
    });

    it('clamps to Feb 29 in leap year (Jan 31, 2028 -> Feb 29, 2028)', () => {
      expect(addMonthsToDateOnly('2028-01-31', 1)).toBe('2028-02-29');
    });

    it('clamps to 30 for 30-day months (May 31 -> June 30)', () => {
      expect(addMonthsToDateOnly('2026-05-31', 1)).toBe('2026-06-30');
    });

    it('returns original input if invalid date is provided', () => {
      expect(addMonthsToDateOnly('invalid', 2)).toBe('invalid');
    });
  });

  describe('daysBetweenDateOnly', () => {
    it('computes positive difference between dates', () => {
      expect(daysBetweenDateOnly('2026-05-01', '2026-05-10')).toBe(9);
    });

    it('computes negative difference if start is after end', () => {
      expect(daysBetweenDateOnly('2026-05-10', '2026-05-01')).toBe(-9);
    });

    it('returns 0 for identical dates', () => {
      expect(daysBetweenDateOnly('2026-05-10', '2026-05-10')).toBe(0);
    });

    it('returns 0 if either date string is invalid', () => {
      expect(daysBetweenDateOnly('invalid', '2026-05-10')).toBe(0);
      expect(daysBetweenDateOnly('2026-05-10', 'invalid')).toBe(0);
    });
  });
});

