import { Component, computed } from '@angular/core';
import { UnderConstructionComponent } from '../../../../shared/components/feedback/under-construction/under-construction.component';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { BranchTabsComponent } from '../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-dashboard',
  imports: [UnderConstructionComponent, PageHeaderComponent, BranchTabsComponent],
  templateUrl: './guild-dashboard.component.html',
  styleUrl: './guild-dashboard.component.scss',
})
export class GuildDashboardComponent {
  readonly #guildContext = injectGuildContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.dashboard', false));

  constructor() {
    // Records the visit for the "last visited branch" fallback used by
    // guildDefaultBranchGuard and the sidenav.
    injectGuildBranchContext();
  }
}
