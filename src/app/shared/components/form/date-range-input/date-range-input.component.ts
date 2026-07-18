import { Component, input, output } from '@angular/core';

/**
 * Two native `<input type="date">` fields replacing mat-date-range-picker — there's no CDK
 * datepicker primitive, and the browser's own date input is accessible and zero-dependency.
 * `input[type=date]` works in plain 'YYYY-MM-DD' strings, bridged here to/from `Date`.
 */
@Component({
  selector: 'app-date-range-input',
  standalone: true,
  templateUrl: './date-range-input.component.html',
  styleUrl: './date-range-input.component.scss',
})
export class DateRangeInputComponent {
  readonly start = input<Date | null>(null);
  readonly end = input<Date | null>(null);
  readonly startAriaLabel = input('');
  readonly endAriaLabel = input('');

  readonly startChange = output<Date | null>();
  readonly endChange = output<Date | null>();

  dateInputValue(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onStartInput(value: string): void {
    this.startChange.emit(value ? parseDateInputValue(value) : null);
  }

  onEndInput(value: string): void {
    this.endChange.emit(value ? parseDateInputValue(value) : null);
  }
}

function parseDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}
