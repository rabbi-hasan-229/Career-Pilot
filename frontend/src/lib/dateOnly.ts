const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

function formatDateOnly(date: Date): string {
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0')].join('-');
}

export function getLocalDateOnly(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function addDaysToDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date || !Number.isFinite(days)) return value;
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return formatDateOnly(date);
}

export function addMonthsToDateOnly(value: string, months: number): string {
  const date = parseDateOnly(value);
  if (!date || !Number.isFinite(months)) return value;

  const targetMonth = date.getUTCMonth() + Math.trunc(months);
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  date.setUTCFullYear(targetYear, normalizedMonth, Math.min(date.getUTCDate(), lastDayOfTargetMonth));
  return formatDateOnly(date);
}

export function daysBetweenDateOnly(start: string, end: string): number {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) return 0;
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
}
