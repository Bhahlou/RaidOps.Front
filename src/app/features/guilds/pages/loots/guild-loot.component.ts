import { Component, computed } from '@angular/core';
import { UnderConstructionComponent } from '../../../../shared/components/under-construction/under-construction.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { injectGuildContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-loot',
  imports: [UnderConstructionComponent, PageHeaderComponent],
  templateUrl: './guild-loot.component.html',
  styleUrl: './guild-loot.component.scss',
})
export class GuildLootComponent {
  readonly #guildContext = injectGuildContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.loot'));
}
