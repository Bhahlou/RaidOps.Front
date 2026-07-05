import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { GuildSettingsFormComponent } from '../../components/guild-settings-form/guild-settings-form.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { injectGuildContext } from '../../inject-guild-context';

@Component({
  selector: 'app-guild-settings',
  imports: [GuildSettingsFormComponent, PageHeaderComponent],
  templateUrl: './guild-settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guild-settings.component.scss',
})
export class GuildSettingsComponent {
  readonly #guildContext = injectGuildContext();

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.settings'));
}
