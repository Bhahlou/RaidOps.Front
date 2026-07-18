import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Informational tag flagging that a feature requires a RaidOps account — orthogonal to guild access level. */
@Component({
  selector: 'app-requires-auth-badge',
  imports: [TranslocoPipe],
  templateUrl: './requires-auth-badge.component.html',
  styleUrl: './requires-auth-badge.component.scss',
})
export class RequiresAuthBadgeComponent {}
