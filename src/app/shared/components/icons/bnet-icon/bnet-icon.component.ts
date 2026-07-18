import { Component, input } from '@angular/core';

/** Renders the Battle.net logo mark as an inline SVG. Color follows the host's `color` (currentColor). */
@Component({
  selector: 'app-bnet-icon',
  standalone: true,
  imports: [],
  templateUrl: './bnet-icon.component.html',
  styleUrl: './bnet-icon.component.scss',
})
export class BnetIconComponent {
  /** Side length in pixels. The icon is always square. */
  readonly size = input(20);
}
