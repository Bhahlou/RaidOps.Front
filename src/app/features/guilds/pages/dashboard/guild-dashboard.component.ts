import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { UnderConstructionComponent } from '../../../../shared/components/under-construction/under-construction.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { injectGuildContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-dashboard',
  imports: [UnderConstructionComponent, PageHeaderComponent],
  templateUrl: './guild-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guild-dashboard.component.scss',
})
export class GuildDashboardComponent {
  readonly #guildContext = injectGuildContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() =>
    this.#guildContext.breadcrumbs('sidenav.guild.dashboard', false),
  );
}
