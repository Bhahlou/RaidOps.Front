import { Component, input } from '@angular/core';

/**
 * Small numeric badge replacing matBadge — positions itself in the top-right corner of
 * whatever `position: relative` element it's placed inside (typically an icon button), and
 * hides itself entirely at count 0, mirroring matBadge's `[matBadge]="count() || null"` pattern.
 */
@Component({
  selector: 'app-count-badge',
  standalone: true,
  templateUrl: './count-badge.component.html',
  styleUrl: './count-badge.component.scss',
})
export class CountBadgeComponent {
  readonly count = input(0);
}
