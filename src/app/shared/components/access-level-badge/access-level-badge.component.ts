import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const LABEL_KEYS: Record<GuildAccessLevel, string> = {
  [GuildAccessLevel.Public]: 'accessLevelBadge.public',
  [GuildAccessLevel.Roster]: 'accessLevelBadge.roster',
  [GuildAccessLevel.Officer]: 'accessLevelBadge.officer',
};

const ICONS: Record<GuildAccessLevel, string> = {
  [GuildAccessLevel.Public]: 'public',
  [GuildAccessLevel.Roster]: 'groups',
  [GuildAccessLevel.Officer]: 'shield',
};

/** Informational tag showing which guild access level a feature requires — doesn't gate anything. */
@Component({
  selector: 'app-access-level-badge',
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './access-level-badge.component.html',
  styleUrl: './access-level-badge.component.scss',
})
export class AccessLevelBadgeComponent {
  readonly level = input.required<GuildAccessLevel>();

  readonly labelKey = computed(() => LABEL_KEYS[this.level()]);
  readonly icon = computed(() => ICONS[this.level()]);
  readonly cssClass = computed(() => `level-${this.level().toLowerCase()}`);
}
