import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-card',
  imports: [NgOptimizedImage],
  templateUrl: './icon-card.component.html',
  styleUrl: './icon-card.component.scss',
})
export class IconCardComponent {
  /** Material icon name displayed in the card header. Ignored when `iconSrc` is set. */
  readonly icon = input<string>();

  /** Image URL displayed instead of the Material icon (e.g. a brand logo). */
  readonly iconSrc = input<string>();

  /** Card title, already translated by the caller. */
  readonly title = input.required<string>();

  /** Optional subtitle, already translated by the caller. */
  readonly subtitle = input<string>();

  /** Material card appearance. Defaults to 'outlined'. */
  readonly appearance = input<'outlined' | 'raised'>('outlined');
}
