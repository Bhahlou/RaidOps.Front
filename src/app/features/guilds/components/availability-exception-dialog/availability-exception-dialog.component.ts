import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, switchMap } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { DateRangeInputComponent } from '../../../../shared/components/form/date-range-input/date-range-input.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AvailabilityStore } from '../../stores/availability.store';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';
import { AvailabilityException, removeDateFromRange } from '../../models/availability.model';

export interface AvailabilityExceptionDialogData {
  guildId: string;
  /** ISO date string (`yyyy-MM-dd`) to preselect, e.g. the day clicked in the calendar grid. */
  date: string;
  /** The exception already covering that date, if any — edits/removes it instead of creating a new one. */
  existing?: AvailabilityException | null;
  /**
   * Whether "remove" should only drop `date` out of a multi-day range (splitting/shrinking it),
   * rather than deleting the whole declaration. Defaults to `true` — set `false` when opening this
   * dialog from a list of declarations rather than from a specific calendar day, where `date` isn't
   * a meaningful single day to remove.
   */
  allowSingleDayRemoval?: boolean;
}

/** Dialog for declaring a one-off availability exception on a single date or date range. */
@Component({
  selector: 'app-availability-exception-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, DateRangeInputComponent],
  templateUrl: './availability-exception-dialog.component.html',
  styleUrl: './availability-exception-dialog.component.scss',
})
export class AvailabilityExceptionDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #store = inject(AvailabilityStore);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<AvailabilityExceptionDialogData>(DIALOG_DATA);

  readonly Status = DayAvailabilityStatus;

  readonly isEditing = !!this.data.existing;
  readonly canRemoveDay = !!this.data.existing && this.data.allowSingleDayRemoval !== false;

  readonly startDate = signal<Date | null>(
    parseIsoDate(this.data.existing?.startDate ?? this.data.date),
  );
  readonly endDate = signal<Date | null>(
    parseIsoDate(this.data.existing?.endDate ?? this.data.date),
  );
  readonly status = signal<DayAvailabilityStatus>(this.data.existing?.status ?? DayAvailabilityStatus.Absent);
  readonly reason = signal(this.data.existing?.reason ?? '');
  readonly availableFrom = signal(toTimeInputValue(this.data.existing?.availableFrom));
  readonly availableUntil = signal(toTimeInputValue(this.data.existing?.availableUntil));

  readonly submitting = signal(false);

  readonly isPartial = computed(() => this.status() === DayAvailabilityStatus.Partial);

  readonly canSubmit = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    return !!start && !!end && end.getTime() >= start.getTime() && !this.submitting();
  });

  setStartDate(date: Date | null): void {
    this.startDate.set(date);
  }

  setEndDate(date: Date | null): void {
    this.endDate.set(date);
  }

  setStatus(status: DayAvailabilityStatus): void {
    this.status.set(status);
  }

  submit(): void {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end || !this.canSubmit()) return;

    const payload = {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
      status: this.status(),
      reason: this.reason().trim() || null,
      availableFrom: this.isPartial() && this.availableFrom() ? `${this.availableFrom()}:00` : null,
      availableUntil: this.isPartial() && this.availableUntil() ? `${this.availableUntil()}:00` : null,
    };

    this.submitting.set(true);

    const existing = this.data.existing;
    const request = existing
      ? this.#store
          .deleteException(this.data.guildId, existing.id)
          .pipe(switchMap(() => this.#store.createException(this.data.guildId, payload)))
      : this.#store.createException(this.data.guildId, payload);

    request.subscribe({
      next: () => {
        this.#snackbar.success('calendar.exceptionDialog.saveSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(this.#errorKeyFor(err));
      },
    });
  }

  /**
   * Removes only `data.date` from the existing declaration: shrinks the range by one day when
   * `date` is at either end, splits it in two around `date` when it's strictly in the middle, or
   * deletes it outright when it was the range's only day — going back to a fully available day
   * (or the recurring pattern's default) for that date specifically.
   */
  removeDay(): void {
    const existing = this.data.existing;
    if (!existing) return;

    const remainingRanges = removeDateFromRange(existing, this.data.date);
    const recreations = remainingRanges.map((range) =>
      this.#store.createException(this.data.guildId, {
        startDate: range.startDate,
        endDate: range.endDate,
        status: existing.status,
        reason: existing.reason,
        availableFrom: existing.availableFrom,
        availableUntil: existing.availableUntil,
      }),
    );

    this.submitting.set(true);
    this.#store
      .deleteException(this.data.guildId, existing.id)
      .pipe(switchMap(() => (recreations.length > 0 ? forkJoin(recreations) : of(null))))
      .subscribe({
        next: () => {
          this.#snackbar.success('calendar.exceptionDialog.removeDaySuccess');
          this.#dialogRef.close(true);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.#snackbar.error(this.#errorKeyFor(err));
        },
      });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }

  #errorKeyFor(err: HttpErrorResponse): string {
    switch (err.error?.error) {
      case 'InvalidRequest':
        return 'calendar.exceptionDialog.invalidRange';
      case 'PastDeclarationLocked':
        return 'calendar.exceptions.pastLocked';
      default:
        return 'errors.server';
    }
  }
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

/** Bridges a back-end `HH:mm:ss` time string to the `HH:mm` value a native `<input type="time">` expects. */
function toTimeInputValue(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : '';
}
