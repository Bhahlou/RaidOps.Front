import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'stroked' | 'text' | 'danger';

/**
 * Generic button replacing raw `<button class="btn ...">`/`<a class="btn ...">` call sites —
 * renders as `<a routerLink>` when `route` is set, `<button>` otherwise, so callers don't have
 * to pick the element type by hand at every site. Styling comes entirely from the existing
 * global `.btn`/`.btn-*` classes (no new CSS introduced here).
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  /** Material icon name, optional. */
  readonly icon = input<string>();
  readonly iconPosition = input<'start' | 'end'>('start');
  /** Renders as `<a [routerLink]>` instead of `<button>` when set. */
  readonly route = input<string | unknown[]>();
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');
  /** Escape hatch for the rare per-site override (e.g. a brand color). */
  readonly extraClass = input('');

  readonly classes = computed(() => `btn btn-${this.variant()} ${this.extraClass()}`.trim());
}
