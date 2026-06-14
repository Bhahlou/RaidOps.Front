import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnderConstructionComponent } from '../../../../shared/components/under-construction/under-construction.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

@Component({
  selector: 'app-guild-loot',
  imports: [UnderConstructionComponent, PageHeaderComponent],
  templateUrl: './guild-loot.component.html',
  styleUrl: './guild-loot.component.scss',
})
export class GuildLootComponent {
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
        link: ['/guilds', this.guildId, 'dashboard'],
      },
      { i18nKey: 'sidenav.guild.loot' },
    ];
  });
}
