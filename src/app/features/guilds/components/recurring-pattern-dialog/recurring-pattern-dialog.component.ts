import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AvailabilityStore } from '../../stores/availability.store';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';
import {
  RecurringAvailabilityPattern,
  RecurringAvailabilityPatternDay,
  RecurringAvailabilityPatternPayload,
} from '../../models/availability.model';

export interface RecurringPatternDialogData {
  guildId: string;
  /** The pattern to edit, or `null` to create a new one. */
  pattern: RecurringAvailabilityPattern | null;
}

type DialogMode = 'weekly' | 'advanced';

/** A single cycle offset's declared availability — same shape as a pattern day, minus the offset itself. */
type Slot = Omit<RecurringAvailabilityPatternDay, 'offsetInCycle'>;

/**
 * Canonical Monday used to anchor every pattern created via the weekly editor — only the weekday
 * (not the actual date) matters for a 7-day cycle, so any Monday works and this keeps every
 * weekly-mode pattern's offsets aligned to Mon=0..Sun=6 without the user ever picking a date.
 */
const WEEKLY_ANCHOR = new Date(2026, 0, 5);

const MAX_CYCLE_LENGTH = 60;

/** Dialog for creating or editing a recurring availability pattern (weekly recurrence, or a custom cycle). */
@Component({
  selector: 'app-recurring-pattern-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './recurring-pattern-dialog.component.html',
  styleUrl: './recurring-pattern-dialog.component.scss',
})
export class RecurringPatternDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #store = inject(AvailabilityStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<RecurringPatternDialogData>(DIALOG_DATA);

  readonly Status = DayAvailabilityStatus;
  readonly isEditMode = !!this.data.pattern;

  readonly mode = signal<DialogMode>(this.data.pattern && this.data.pattern.cycleLengthDays !== 7 ? 'advanced' : 'weekly');

  readonly label = signal(this.data.pattern?.label ?? '');

  // ── Weekly mode ──────────────────────────────────────────────────────────

  readonly weeklySlots = signal<Slot[]>(
    this.data.pattern?.cycleLengthDays === 7
      ? slotsFromPatternDays(7, this.data.pattern.days, weekdayIndex(parseIsoDate(this.data.pattern.anchorDate)))
      : defaultSlots(7),
  );

  readonly weekdayNames = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    const formatter = new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { weekday: 'long' });
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2026, 0, 5 + i)));
  });

  // ── Advanced mode (custom cycle length, one slot per offset, pre-populated) ─

  readonly cycleLengthDays = signal(this.data.pattern?.cycleLengthDays ?? 10);
  readonly anchorDate = signal<Date | null>(
    this.data.pattern ? parseIsoDate(this.data.pattern.anchorDate) : new Date(),
  );
  readonly advancedSlots = signal<Slot[]>(
    this.data.pattern && this.data.pattern.cycleLengthDays !== 7
      ? slotsFromPatternDays(this.data.pattern.cycleLengthDays, this.data.pattern.days, 0)
      : defaultSlots(this.cycleLengthDays()),
  );

  /** "Jour 1", "Jour 2", ... — 1-indexed for display; `offsetInCycle` itself stays 0-indexed internally. */
  readonly advancedLabels = computed(() =>
    this.advancedSlots().map((_, i) => this.#transloco.translate('calendar.patternDialog.dayNumber', { n: i + 1 })),
  );

  setCycleLengthDays(value: number): void {
    const length = Math.min(MAX_CYCLE_LENGTH, Math.max(1, Math.floor(value) || 1));
    this.cycleLengthDays.set(length);
    this.advancedSlots.update((slots) =>
      length <= slots.length ? slots.slice(0, length) : [...slots, ...defaultSlots(length - slots.length)],
    );
  }

  setAnchorDate(value: string): void {
    this.anchorDate.set(value ? parseIsoDate(value) : null);
  }

  anchorDateInputValue(): string {
    const date = this.anchorDate();
    return date ? toIsoDate(date) : '';
  }

  // ── Shared slot editor (chips + detail rows), driven by whichever mode is active ─

  readonly activeSlots = computed(() => (this.mode() === 'weekly' ? this.weeklySlots() : this.advancedSlots()));
  readonly activeLabels = computed(() => (this.mode() === 'weekly' ? this.weekdayNames() : this.advancedLabels()));

  updateSlot(index: number, patch: Partial<Slot>): void {
    this.#updateActiveSlots((slots) => slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  #updateActiveSlots(fn: (slots: Slot[]) => Slot[]): void {
    if (this.mode() === 'weekly') {
      this.weeklySlots.update(fn);
    } else {
      this.advancedSlots.update(fn);
    }
  }

  // ── Submission ───────────────────────────────────────────────────────────

  readonly submitting = signal(false);

  readonly canSubmit = computed(() => !this.submitting() && (this.mode() === 'weekly' || !!this.anchorDate()));

  submit(): void {
    if (!this.canSubmit()) return;

    // canSubmit already guarantees anchorDate is set once in advanced mode, so
    // #buildAdvancedPayload never actually needs to handle a missing anchor here.
    const payload = this.mode() === 'weekly' ? this.#buildWeeklyPayload() : this.#buildAdvancedPayload();

    this.submitting.set(true);
    const request = this.data.pattern
      ? this.#store.updatePattern(this.data.guildId, this.data.pattern.id, payload)
      : this.#store.createPattern(this.data.guildId, payload);

    request.subscribe({
      next: () => {
        this.#snackbar.success('calendar.patternDialog.saveSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(err.error?.error === 'InvalidRequest' ? 'calendar.patternDialog.invalidPattern' : 'errors.server');
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }

  #buildWeeklyPayload(): RecurringAvailabilityPatternPayload {
    return {
      label: this.label().trim() || null,
      cycleLengthDays: 7,
      anchorDate: toIsoDate(WEEKLY_ANCHOR),
      days: patternDaysFromSlots(this.weeklySlots()),
    };
  }

  /** Only ever called once `canSubmit` has confirmed `anchorDate` is set in advanced mode. */
  #buildAdvancedPayload(): RecurringAvailabilityPatternPayload {
    return {
      label: this.label().trim() || null,
      cycleLengthDays: this.cycleLengthDays(),
      anchorDate: toIsoDate(this.anchorDate()!),
      days: patternDaysFromSlots(this.advancedSlots()),
    };
  }
}

function defaultSlots(length: number): Slot[] {
  return Array.from({ length }, () => ({
    status: DayAvailabilityStatus.Available,
    reason: null,
    availableFrom: null,
    availableUntil: null,
  }));
}

/**
 * Builds `length` dense slots (one per offset, `Available` by default) from a pattern's sparse day
 * list. `weekdayShift` re-bases offsets onto weekday indices (0=Mon) for the weekly editor, coming
 * from the pattern's own anchor date — pass `0` for the advanced editor, where offsets are used as-is.
 */
function slotsFromPatternDays(length: number, days: RecurringAvailabilityPatternDay[], weekdayShift: number): Slot[] {
  const slots = defaultSlots(length);
  for (const day of days) {
    const index = (day.offsetInCycle + weekdayShift) % length;
    slots[index] = { status: day.status, reason: day.reason, availableFrom: day.availableFrom, availableUntil: day.availableUntil };
  }
  return slots;
}

function patternDaysFromSlots(slots: Slot[]): RecurringAvailabilityPatternDay[] {
  return slots
    .map((slot, offsetInCycle) => ({ offsetInCycle, ...slot }))
    .filter((day) => day.status !== DayAvailabilityStatus.Available);
}

/** 0 = Monday, ..., 6 = Sunday. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
