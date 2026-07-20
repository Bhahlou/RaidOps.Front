import { DayAvailabilityStatus } from './day-availability-status.enum';

/** One-off availability exception for a single date or date range, as returned for editing. */
export interface AvailabilityException {
  id: number;
  /** ISO date string (`yyyy-MM-dd`). */
  startDate: string;
  /** ISO date string (`yyyy-MM-dd`). */
  endDate: string;
  status: DayAvailabilityStatus;
  reason: string | null;
  /** Time string (`HH:mm:ss`), set only when `status` is `Partial`. */
  availableFrom: string | null;
  /** Time string (`HH:mm:ss`), set only when `status` is `Partial`. */
  availableUntil: string | null;
}

/** Payload for declaring a new one-off availability exception. */
export interface CreateAvailabilityExceptionPayload {
  startDate: string;
  endDate: string;
  status: DayAvailabilityStatus;
  reason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

/** One day of a recurring pattern's cycle that is not fully available. */
export interface RecurringAvailabilityPatternDay {
  offsetInCycle: number;
  status: DayAvailabilityStatus;
  reason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

/**
 * A recurring availability pattern (weekly recurrence, or a shift rotation), as returned for
 * editing — always the current, still-open version. Editing or stopping it never touches past
 * resolved days: the back-end closes this version and (for edits) inserts a new one, instead of
 * mutating it in place.
 */
export interface RecurringAvailabilityPattern {
  id: number;
  label: string | null;
  cycleLengthDays: number;
  /** ISO date string (`yyyy-MM-dd`) at which offset 0 of the cycle begins. */
  anchorDate: string;
  days: RecurringAvailabilityPatternDay[];
}

/** Payload for creating or replacing a recurring availability pattern (effective from today onward). */
export interface RecurringAvailabilityPatternPayload {
  label: string | null;
  cycleLengthDays: number;
  anchorDate: string;
  days: RecurringAvailabilityPatternDay[];
}

/** The resolved availability status for a single date. */
export interface ResolvedDayAvailability {
  /** ISO date string (`yyyy-MM-dd`). */
  date: string;
  status: DayAvailabilityStatus;
  reason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  isException: boolean;
}

/** The resolved calendar for a date range, plus the raw exceptions/patterns backing it. */
export interface AvailabilityCalendar {
  days: ResolvedDayAvailability[];
  exceptions: AvailabilityException[];
  patterns: RecurringAvailabilityPattern[];
}

/** Finds the exception (if any) whose date range covers `iso`, e.g. to edit/remove it from a calendar cell. */
export function findExceptionForDate(exceptions: AvailabilityException[], iso: string): AvailabilityException | null {
  return exceptions.find((e) => iso >= e.startDate && iso <= e.endDate) ?? null;
}

/** Which side(s) of a `Partial` day are bounded — drives which wording applies. */
export type PartialTimeKind = 'late' | 'earlyLeave' | 'window';

export interface PartialTimeInfo {
  kind: PartialTimeKind;
  /** Formatted `availableFrom`, or `null` when unbounded on that side. */
  from: string | null;
  /** Formatted `availableUntil`, or `null` when unbounded on that side. */
  until: string | null;
}

/**
 * Describes a `Partial` status's time bounds for display. `late` (only `availableFrom` set) means
 * arriving late; `earlyLeave` (only `availableUntil` set) means leaving early; `window` (both set)
 * is a plain bounded slot. Returns `null` when neither bound is set.
 */
export function describePartialTime(
  availableFrom: string | null,
  availableUntil: string | null,
  locale: string,
): PartialTimeInfo | null {
  if (!availableFrom && !availableUntil) return null;

  const from = availableFrom ? formatTime(availableFrom, locale) : null;
  const until = availableUntil ? formatTime(availableUntil, locale) : null;

  let kind: PartialTimeKind;
  if (from && until) kind = 'window';
  else if (from) kind = 'late';
  else kind = 'earlyLeave';

  return { kind, from, until };
}

/**
 * Renders a {@link PartialTimeInfo} as plain words instead of a directional arrow (e.g. "dès
 * 21h30", "jusqu'à 21h30", or "9h00 – 17h00" for a bounded window) — `translate` supplies the
 * locale's "from"/"until" phrasing via `calendar.time.from`/`calendar.time.until`.
 */
export function formatPartialTimeLabel(
  info: PartialTimeInfo,
  translate: (key: string, params: Record<string, string>) => string,
): string {
  if (info.kind === 'window') return `${info.from} – ${info.until}`;
  return info.kind === 'late'
    ? translate('calendar.time.from', { time: info.from! })
    : translate('calendar.time.until', { time: info.until! });
}

/** French reads clock times as "21h30"; every other supported locale keeps the plain "21:30". */
function formatTime(time: string, locale: string): string {
  const [hh, mm] = time.slice(0, 5).split(':');
  return locale.startsWith('fr') ? `${hh}h${mm}` : `${hh}:${mm}`;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Removes a single date from a range, returning the remaining sub-range(s) — shrunk by one day when
 * `date` is at either end, split in two when it's strictly in the middle, or empty when `date` was
 * the range's only day. `date` outside the range is returned unchanged.
 */
export function removeDateFromRange(range: DateRange, date: string): DateRange[] {
  if (date < range.startDate || date > range.endDate) return [range];

  const remaining: DateRange[] = [];
  if (date > range.startDate) {
    remaining.push({ startDate: range.startDate, endDate: addDaysToIsoDate(date, -1) });
  }
  if (date < range.endDate) {
    remaining.push({ startDate: addDaysToIsoDate(date, 1), endDate: range.endDate });
  }
  return remaining;
}

function addDaysToIsoDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
