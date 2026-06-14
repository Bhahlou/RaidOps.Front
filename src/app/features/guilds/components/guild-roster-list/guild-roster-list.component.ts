import { Component, input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-guild-roster-list',
  standalone: true,
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardTitle, TranslocoPipe],
  templateUrl: './guild-roster-list.component.html',
  styleUrl: './guild-roster-list.component.scss',
})
export class GuildRosterListComponent {
  readonly guildId = input.required<string>();
}
