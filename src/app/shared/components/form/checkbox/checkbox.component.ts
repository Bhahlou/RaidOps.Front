import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Custom checkbox replacing mat-checkbox — a real native `<input type="checkbox">` (kept for
 * accessibility/keyboard semantics) visually hidden under a styled box, matching the app's other
 * custom form controls. `indeterminate` is a DOM property (no HTML attribute equivalent), so it's
 * pushed onto the native element imperatively via an effect rather than a template binding.
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent {
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly disabled = input(false);

  readonly change = output<boolean>();

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  constructor() {
    effect(() => {
      const el = this.nativeInput()?.nativeElement;
      if (el) el.indeterminate = this.indeterminate();
    });
  }

  onChange(event: Event): void {
    this.change.emit((event.target as HTMLInputElement).checked);
  }
}
