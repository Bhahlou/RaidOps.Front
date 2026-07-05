import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

/** Informational tag flagging that a feature requires a RaidOps account — orthogonal to guild access level. */
@Component({
  selector: 'app-requires-auth-badge',
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './requires-auth-badge.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './requires-auth-badge.component.scss',
})
export class RequiresAuthBadgeComponent {}
