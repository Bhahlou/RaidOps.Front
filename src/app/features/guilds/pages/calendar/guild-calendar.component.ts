import { Component, computed, effect, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { injectGuildContext } from '../../inject-guild-context';
import { AvailabilityStore } from '../../stores/availability.store';
import {
  AvailabilityException,
  describePartialTime,
  findExceptionForDate,
  formatPartialTimeLabel,
  RecurringAvailabilityPattern,
} from '../../models/availability.model';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';
import {
  AvailabilityCalendarGridComponent,
  CalendarGridDay,
} from '../../components/availability-calendar-grid/availability-calendar-grid.component';
import {
  AvailabilityExceptionDialogComponent,
} from '../../components/availability-exception-dialog/availability-exception-dialog.component';
import {
  RecurringPatternDialogComponent,
} from '../../components/recurring-pattern-dialog/recurring-pattern-dialog.component';

@Component({
  selector: 'app-guild-calendar',
  imports: [
    PageHeaderComponent,
    AvailabilityCalendarGridComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyHintComponent,
    TranslocoPipe,
  ],
  templateUrl: './guild-calendar.component.html',
  styleUrl: './guild-calendar.component.scss',
})
export class GuildCalendarComponent {
  readonly #guildContext = injectGuildContext();
  readonly #store = inject(AvailabilityStore);
  readonly #dialog = inject(Dialog);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.calendar'));

  readonly currentMonth = signal(startOfMonth(new Date()));

  readonly monthLabel = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { month: 'long', year: 'numeric' }).format(
      this.currentMonth(),
    );
  });

  readonly isLoading = this.#store.isLoading;
  readonly patterns = computed<RecurringAvailabilityPattern[]>(() => this.#store.calendar()?.patterns ?? []);
  readonly exceptions = computed<AvailabilityException[]>(() =>
    [...(this.#store.calendar()?.exceptions ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)),
  );

  readonly calendarDays = computed<CalendarGridDay[]>(() => {
    const gridStart = startOfGrid(this.currentMonth());
    const resolvedByDate = new Map((this.#store.calendar()?.days ?? []).map((d) => [d.date, d]));
    const today = toIsoDate(new Date());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = toIsoDate(date);
      return {
        date,
        iso,
        inCurrentMonth: date.getMonth() === this.currentMonth().getMonth(),
        isToday: iso === today,
        resolved: resolvedByDate.get(iso) ?? null,
      };
    });
  });

  constructor() {
    effect(() => {
      const gridStart = startOfGrid(this.currentMonth());
      const gridEnd = new Date(gridStart);
      gridEnd.setDate(gridStart.getDate() + 41);
      this.#store.loadRange(this.guildId, toIsoDate(gridStart), toIsoDate(gridEnd));
    });
  }

  prevMonth(): void {
    this.currentMonth.update((m) => addMonths(m, -1));
  }

  nextMonth(): void {
    this.currentMonth.update((m) => addMonths(m, 1));
  }

  goToday(): void {
    this.currentMonth.set(startOfMonth(new Date()));
  }

  openExceptionDialog(day?: CalendarGridDay): void {
    const date = day?.iso ?? toIsoDate(new Date());
    const existing = findExceptionForDate(this.#store.calendar()?.exceptions ?? [], date);

    // A day with no declaration yet can't be backdated, and an existing declaration that already
    // started in the past can't be edited (the back-end would reject the save either way) — the
    // list further down still shows it, just without an edit/remove action.
    if (existing ? this.isExceptionEditLocked(existing) : date < todayIso()) {
      this.#snackbar.error('calendar.exceptions.pastLocked');
      return;
    }

    this.#dialog
      .open<boolean>(AvailabilityExceptionDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { guildId: this.guildId, date, existing },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  /** Opens the exception dialog to edit a whole declaration from the list — no single day to remove here. */
  editException(exception: AvailabilityException): void {
    if (this.isExceptionEditLocked(exception)) {
      this.#snackbar.error('calendar.exceptions.pastLocked');
      return;
    }

    this.#dialog
      .open<boolean>(AvailabilityExceptionDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { guildId: this.guildId, date: exception.startDate, existing: exception, allowSingleDayRemoval: false },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  deleteException(exception: AvailabilityException): void {
    if (this.isExceptionDeleteLocked(exception)) {
      this.#snackbar.error('calendar.exceptions.pastLocked');
      return;
    }

    this.#store.deleteException(this.guildId, exception.id).subscribe({
      next: () => {
        this.#snackbar.success('calendar.exceptions.deleteSuccess');
        this.#store.reload();
      },
      error: () => this.#snackbar.error('errors.server'),
    });
  }

  /** True once editing would just fail server-side — saving always recreates the declaration from `startDate`, which the back-end refuses once it's in the past. */
  isExceptionEditLocked(exception: AvailabilityException): boolean {
    return exception.startDate < todayIso();
  }

  /** True once the declaration has fully elapsed — the back-end locks it as a historical record. */
  isExceptionDeleteLocked(exception: AvailabilityException): boolean {
    return exception.endDate < todayIso();
  }

  exceptionRangeLabel(exception: AvailabilityException): string {
    const lang = this.#transloco.getActiveLang();
    const formatter = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
    const start = formatter.format(parseIsoDate(exception.startDate));
    if (exception.startDate === exception.endDate) return start;
    return `${start} – ${formatter.format(parseIsoDate(exception.endDate))}`;
  }

  /** e.g. "Boulot (dès 21h30)", "Motif (jusqu'à 21h30)", "Absent · Vacances", or "Présence exceptionnelle · ..." for an Available override. */
  exceptionDetailLabel(exception: AvailabilityException): string {
    if (exception.status !== DayAvailabilityStatus.Partial) {
      const statusKey = exception.status === DayAvailabilityStatus.Available ? 'availableOverride' : exception.status.toLowerCase();
      const statusWord = this.#transloco.translate(`calendar.status.${statusKey}`);
      return exception.reason ? `${statusWord} · ${exception.reason}` : statusWord;
    }

    const info = describePartialTime(exception.availableFrom, exception.availableUntil, this.#transloco.getActiveLang());
    const timeLabel = info ? formatPartialTimeLabel(info, (key, params) => this.#transloco.translate(key, params)) : null;
    if (exception.reason && timeLabel) return `${exception.reason} (${timeLabel})`;
    return exception.reason ?? timeLabel ?? this.#transloco.translate('calendar.status.partial');
  }

  openPatternDialog(pattern: RecurringAvailabilityPattern | null): void {
    this.#dialog
      .open<boolean>(RecurringPatternDialogComponent, {
        // Wide on large screens so a Partial row's status + time fields + reason fit on one line
        // instead of wrapping onto extra lines — that wrapping was the main driver of needing to
        // scroll the cycle-day list. Narrow-screen behavior is a separate pass, not this one.
        width: 'min(960px, 95vw)',
        data: { guildId: this.guildId, pattern },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  deletePattern(pattern: RecurringAvailabilityPattern): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'calendar.patternDialog.stopConfirmTitle',
          message: 'calendar.patternDialog.stopConfirmMessage',
          messageParams: { label: pattern.label || this.#transloco.translate('calendar.patternDialog.unnamed') },
          confirmLabel: 'calendar.patternDialog.stopPattern',
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#store.deletePattern(this.guildId, pattern.id).subscribe({
          next: () => {
            this.#snackbar.success('calendar.patternDialog.deleteSuccess');
            this.#store.reload();
          },
          error: () => this.#snackbar.error('errors.server'),
        });
      });
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Monday of the week containing the first day of `month`'s month. */
function startOfGrid(month: Date): Date {
  const first = startOfMonth(month);
  const dayOfWeek = (first.getDay() + 6) % 7; // 0 = Monday, ..., 6 = Sunday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - dayOfWeek);
  return gridStart;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
