import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-icon-card',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './icon-card.component.html',
  styleUrl: './icon-card.component.scss',
})
export class IconCardComponent {
  /** Material icon name displayed in the card header. */
  readonly icon = input.required<string>();

  /** Card title, already translated by the caller. */
  readonly title = input.required<string>();

  /** Optional subtitle, already translated by the caller. */
  readonly subtitle = input<string>();

  /** Material card appearance. Defaults to 'outlined'. */
  readonly appearance = input<'outlined' | 'raised'>('outlined');
}
