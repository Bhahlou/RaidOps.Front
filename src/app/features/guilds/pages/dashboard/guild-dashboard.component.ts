import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnderConstructionComponent } from '../../../../shared/components/under-construction/under-construction.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

@Component({
  selector: 'app-guild-dashboard',
  imports: [UnderConstructionComponent, PageHeaderComponent],
  templateUrl: './guild-dashboard.component.html',
  styleUrl: './guild-dashboard.component.scss',
})
export class GuildDashboardComponent {
  readonly #authStore = inject(AuthStore);

  readonly guildId = inject(ActivatedRoute).parent!.snapshot.paramMap.get('id')!;

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const guild = this.#authStore.user()?.guilds.find(g => g.id === this.guildId);
    return [
      {
        label: guild?.name ?? '…',
        discordIcon: guild
          ? { id: guild.id, hash: guild.iconHash, type: DiscordIconType.Guild }
          : undefined,
      },
      { i18nKey: 'sidenav.guild.dashboard' },
    ];
  });
}
