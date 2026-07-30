import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';
import { describePartialTime, formatPartialTimeLabel, ResolvedDayAvailability } from '../../models/availability.model';

export interface CalendarGridDay {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  resolved: ResolvedDayAvailability | null;
}

/** A locale-aware Monday-first month grid, one cell per day, colored by resolved availability status. */
@Component({
  selector: 'app-availability-calendar-grid',
  standalone: true,
  templateUrl: './availability-calendar-grid.component.html',
  styleUrl: './availability-calendar-grid.component.scss',
})
export class AvailabilityCalendarGridComponent {
  readonly days = input.required<CalendarGridDay[]>();

  readonly dayClick = output<CalendarGridDay>();

  readonly #transloco = inject(TranslocoService);

  readonly weekdayLabels = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    const formatter = new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { weekday: 'short' });
    // 2026-01-05 is a Monday — used purely as a stable Monday-first reference week.
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2026, 0, 5 + i)));
  });

  statusClass(day: CalendarGridDay): string {
    switch (day.resolved?.status) {
      case DayAvailabilityStatus.Absent:
        return 'status-absent';
      case DayAvailabilityStatus.Partial:
        return 'status-partial';
      default:
        return 'status-available';
    }
  }

  dayLabel(day: CalendarGridDay): string {
    return day.date.getDate().toString();
  }

  /** Reason + bounded time on one line, e.g. "Boulot (dès 21h30)" — falls back to just the time, or just the reason, when either is missing. */
  detailLabel(day: CalendarGridDay): string | null {
    const resolved = day.resolved;
    if (!resolved) return null;

    const timeLabel =
      resolved.status === DayAvailabilityStatus.Partial
        ? this.#partialTimeLabel(resolved.availableFrom, resolved.availableUntil)
        : null;

    if (resolved.reason && timeLabel) return `${resolved.reason} (${timeLabel})`;
    return resolved.reason ?? timeLabel;
  }

  #partialTimeLabel(availableFrom: string | null, availableUntil: string | null): string | null {
    const info = describePartialTime(availableFrom, availableUntil, this.#transloco.getActiveLang());
    return info ? formatPartialTimeLabel(info, (key, params) => this.#transloco.translate(key, params)) : null;
  }

  onDayClick(day: CalendarGridDay): void {
    this.dayClick.emit(day);
  }
}
