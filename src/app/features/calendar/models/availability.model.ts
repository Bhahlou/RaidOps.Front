import { DayAvailabilityStatus } from './day-availability-status.enum';

/** One-off availability exception for a single date or date range, as returned for editing. */
export interface AvailabilityException {
  id: number;
  /** The guild of this exception's branch scope, or `null` if it's Global. */
  guildId: string | null;
  /** This exception's specific branch scope, or `null` if it's Global. */
  guildBranchId: number | null;
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

/** Payload for declaring a new one-off availability exception, either Global or scoped to a branch. */
export interface CreateAvailabilityExceptionPayload {
  /** The guild of the target branch scope, or `null` for a Global declaration. Set together with `guildBranchId`. */
  guildId: string | null;
  /** The specific branch scope, or `null` for a Global declaration. Set together with `guildId`. */
  guildBranchId: number | null;
  startDate: string;
  endDate: string;
  status: DayAvailabilityStatus;
  reason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

/** Payload for replacing the dates/status of an existing one-off availability exception. Scope is immutable, not part of this request. */
export type UpdateAvailabilityExceptionPayload = Omit<CreateAvailabilityExceptionPayload, 'guildId' | 'guildBranchId'>;

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
  /** The guild of this pattern's branch scope, or `null` if it's Global. */
  guildId: string | null;
  /** This pattern's specific branch scope, or `null` if it's Global. */
  guildBranchId: number | null;
  label: string | null;
  cycleLengthDays: number;
  /** ISO date string (`yyyy-MM-dd`) at which offset 0 of the cycle begins. */
  anchorDate: string;
  days: RecurringAvailabilityPatternDay[];
}

/** Payload for creating a recurring availability pattern (effective from today onward), either Global or scoped to a branch. */
export interface CreateRecurringAvailabilityPatternPayload {
  /** The guild of the target branch scope, or `null` for a Global pattern. Set together with `guildBranchId`. */
  guildId: string | null;
  /** The specific branch scope, or `null` for a Global pattern. Set together with `guildId`. */
  guildBranchId: number | null;
  label: string | null;
  cycleLengthDays: number;
  anchorDate: string;
  days: RecurringAvailabilityPatternDay[];
}

/** Payload for replacing an existing recurring pattern's settings and full day set. Scope is immutable, not part of this request. */
export type UpdateRecurringAvailabilityPatternPayload = Omit<CreateRecurringAvailabilityPatternPayload, 'guildId' | 'guildBranchId'>;

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
