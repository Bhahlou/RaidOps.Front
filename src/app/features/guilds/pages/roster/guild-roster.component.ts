import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { GuildRosterListComponent } from '../../components/guild-roster-list/guild-roster-list.component';
import { GuildMyCharactersComponent } from '../../components/guild-my-characters/guild-my-characters.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/page-header/page-header.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

@Component({
  selector: 'app-guild-roster',
  standalone: true,
  imports: [GuildRosterListComponent, GuildMyCharactersComponent, PageHeaderComponent],
  templateUrl: './guild-roster.component.html',
  styleUrl: './guild-roster.component.scss',
})
export class GuildRosterComponent {
  readonly #authStore = inject(AuthStore);

  readonly guildId = toSignal(
    inject(ActivatedRoute).parent!.paramMap.pipe(map(p => p.get('id')!)),
    { initialValue: inject(ActivatedRoute).parent!.snapshot.paramMap.get('id')! }
  );

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const guildId = this.guildId();
    const guild = this.#authStore.user()?.guilds.find(g => g.id === guildId);
    return [
      {
        label: guild?.name ?? '…',
        discordIcon: guild
          ? { id: guild.id, hash: guild.iconHash, type: DiscordIconType.Guild }
          : undefined,
        link: ['/guilds', guildId, 'dashboard'],
      },
      { i18nKey: 'sidenav.guild.roster' },
    ];
  });
}
