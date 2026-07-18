import { Component, computed } from '@angular/core';
import { UnderConstructionComponent } from '../../../../shared/components/feedback/under-construction/under-construction.component';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { injectGuildContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-calendar',
  imports: [UnderConstructionComponent, PageHeaderComponent],
  templateUrl: './guild-calendar.component.html',
  styleUrl: './guild-calendar.component.scss',
})
export class GuildCalendarComponent {
  readonly #guildContext = injectGuildContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.calendar'));
}
