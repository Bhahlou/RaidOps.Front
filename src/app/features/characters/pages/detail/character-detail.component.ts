import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { WowFactionIconComponent } from '../../../../shared/components/wow-faction-icon/wow-faction-icon.component';
import {
  PageHeaderComponent,
  BreadcrumbItem,
} from '../../../../shared/components/page-header/page-header.component';
import { CharacterStore } from '../../stores/character.store';
import { CharacterGuildsComponent } from '../../components/character-guilds/character-guilds.component';
import { CharacterGearComponent } from '../../components/character-gear/character-gear.component';
import { CharacterBisListComponent } from '../../components/character-bis-list/character-bis-list.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    WowClassIconComponent,
    WowFactionIconComponent,
    PageHeaderComponent,
    CharacterGuildsComponent,
    CharacterGearComponent,
    CharacterBisListComponent,
  ],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss',
})
export class CharacterDetailComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #characterStore = inject(CharacterStore);
  readonly #authStore = inject(AuthStore);

  readonly #branch = this.#route.snapshot.paramMap.get('branch') ?? '';
  readonly #realm = this.#route.snapshot.paramMap.get('realm') ?? '';
  readonly #name = this.#route.snapshot.paramMap.get('name') ?? '';

  readonly character = computed(() =>
    this.#characterStore
      .characterList()
      .find(
        (c) =>
          c.branchName.toLowerCase().replace(/[\s_]+/g, '-') === this.#branch &&
          c.realmSlug === this.#realm &&
          c.name.toLowerCase() === this.#name,
      ),
  );

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const user = this.#authStore.user();
    const char = this.character();
    return [
      {
        label: user?.name ?? '…',
        discordIcon: user
          ? { id: user.discordId, hash: user.avatarHash, type: DiscordIconType.User }
          : undefined,
      },
      { i18nKey: 'sidenav.account.characters', link: ['/characters'] },
      { label: char?.name ?? '…' },
    ];
  });

  ngOnInit(): void {
    if (!this.character()) {
      this.#router.navigate(['/characters']);
    }
  }
}
