import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { GuildRosterListComponent } from '../../components/guild-roster-list/guild-roster-list.component';
import { GuildMyCharactersComponent } from '../../components/guild-my-characters/guild-my-characters.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { injectGuildContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-roster',
  standalone: true,
  imports: [GuildRosterListComponent, GuildMyCharactersComponent, PageHeaderComponent],
  templateUrl: './guild-roster.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guild-roster.component.scss',
})
export class GuildRosterComponent {
  readonly #guildContext = injectGuildContext();

  // currentGuildId (not the static guildId snapshot) — this leaf route component is reused
  // (not recreated) when only the parent's :id param changes, e.g. switching guilds.
  readonly guildId = this.#guildContext.currentGuildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.roster'));
}
