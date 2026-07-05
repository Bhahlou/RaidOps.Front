import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/** Renders the Discord logo mark as an inline SVG. Color follows the host's `color` (currentColor). */
@Component({
  selector: 'app-discord-brand-icon',
  standalone: true,
  imports: [],
  templateUrl: './discord-brand-icon.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './discord-brand-icon.component.scss',
})
export class DiscordBrandIconComponent {
  /** Side length in pixels. The icon is always square. */
  readonly size = input(20);
}
