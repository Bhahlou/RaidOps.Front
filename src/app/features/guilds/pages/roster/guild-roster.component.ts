import { Component, computed } from '@angular/core';
import { GuildRosterListComponent } from '../../components/guild-roster-list/guild-roster-list.component';
import { GuildMyCharactersComponent } from '../../components/guild-my-characters/guild-my-characters.component';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { BranchTabsComponent } from '../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-roster',
  standalone: true,
  imports: [GuildRosterListComponent, GuildMyCharactersComponent, PageHeaderComponent, BranchTabsComponent],
  templateUrl: './guild-roster.component.html',
  styleUrl: './guild-roster.component.scss',
})
export class GuildRosterComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();

  // currentGuildId/currentBranchId (not the static snapshots) — this leaf route component is
  // reused (not recreated) when only the parent's :id or :branchId param changes, e.g.
  // switching guilds or branches.
  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.roster'));
}
