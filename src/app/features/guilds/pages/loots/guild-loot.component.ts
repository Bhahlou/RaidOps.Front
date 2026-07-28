import { Component, computed } from '@angular/core';
import { UnderConstructionComponent } from '../../../../shared/components/feedback/under-construction/under-construction.component';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { BranchTabsComponent } from '../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-loot',
  imports: [UnderConstructionComponent, PageHeaderComponent, BranchTabsComponent],
  templateUrl: './guild-loot.component.html',
  styleUrl: './guild-loot.component.scss',
})
export class GuildLootComponent {
  readonly #guildContext = injectGuildContext();
  // Not read directly — calling this records the visit for the "last visited branch" fallback
  // used by guildDefaultBranchGuard and the sidenav (see injectGuildBranchContext).
  readonly #branchContext = injectGuildBranchContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.loot'));
}
