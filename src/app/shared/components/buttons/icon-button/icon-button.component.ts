import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Generic icon-only button replacing raw `<button class="icon-btn">`/`<a class="icon-btn">` call
 * sites — same route-vs-click duality as {@link ButtonComponent}. Projected content is for the
 * rare extra element sitting next to the icon (e.g. a count badge).
 */
@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './icon-button.component.html',
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly route = input<string | unknown[]>();
  readonly disabled = input(false);
  readonly ariaLabel = input<string>();
  readonly type = input<'button' | 'submit'>('button');
  /** Escape hatch for the rare per-site override (e.g. an active/highlighted state). */
  readonly extraClass = input('');

  readonly classes = computed(() => `icon-btn ${this.extraClass()}`.trim());
}
