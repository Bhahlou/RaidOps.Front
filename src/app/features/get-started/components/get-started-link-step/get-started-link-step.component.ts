import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterStore } from '../../../characters/stores/character.store';
import { GuildEligibility } from '../../../../features/guilds/models/guild-eligibility.model';
import { CharacterRank } from '../../../guilds/models/character-rank.enum';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';

/**
 * Step 4 of get-started: link each eligible guild to one or more of the user's characters.
 * Guild-centric view — one card per guild, with a checklist of eligible characters pre-checked
 * as Main. One "Rejoindre" button per guild fires all selected joins in parallel.
 */
@Component({
  selector: 'app-get-started-link-step',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
    TranslocoPipe,
    DiscordIconComponent,
    WowClassIconComponent,
  ],
  templateUrl: './get-started-link-step.component.html',
  styleUrl: './get-started-link-step.component.scss',
})
export class GetStartedLinkStepComponent {
  readonly #characterStore = inject(CharacterStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #router = inject(Router);

  readonly DiscordIconType = DiscordIconType;
  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  readonly isLoading = this.#characterStore.isEligibleBulkLoading;
  readonly guilds = this.#characterStore.eligibleGuildsBulk;
  readonly canFinish = computed(() => this.#characterStore.characterList().some((c) => c.guildMemberships.length > 0));

  /** characterId → rank (undefined = unchecked) per guild */
  readonly #selections = signal<Map<string, Map<number, CharacterRank | undefined>>>(new Map());

  /** Which guild currently has a join in flight */
  readonly #joiningGuildId = signal<string | null>(null);

  constructor() {
    this.#characterStore.loadEligibleGuildsBulk();

    effect(() => {
      if (!this.isLoading() && this.guilds().length === 0 && this.canFinish()) {
        this.#router.navigate(['/guilds']);
      }
    });

    effect(() => {
      const guilds = this.guilds();
      if (!guilds.length) return;
      this.#selections.update((current) => {
        const next = new Map(current);
        for (const guild of guilds) {
          if (!next.has(guild.guildId)) {
            const chars = new Map<number, CharacterRank | undefined>();
            for (const char of guild.eligibleCharacters) {
              chars.set(char.id, CharacterRank.Main);
            }
            next.set(guild.guildId, chars);
          }
        }
        return next;
      });
    });
  }

  isChecked(guildId: string, characterId: number): boolean {
    return this.#selections().get(guildId)?.get(characterId) !== undefined;
  }

  getRank(guildId: string, characterId: number): CharacterRank {
    return this.#selections().get(guildId)?.get(characterId) ?? CharacterRank.Main;
  }

  toggle(guildId: string, characterId: number, checked: boolean): void {
    this.#selections.update((m) => {
      const next = new Map(m);
      const chars = new Map(next.get(guildId) ?? []);
      chars.set(characterId, checked ? CharacterRank.Main : undefined);
      next.set(guildId, chars);
      return next;
    });
  }

  setRank(guildId: string, characterId: number, rank: CharacterRank): void {
    this.#selections.update((m) => {
      const next = new Map(m);
      const chars = new Map(next.get(guildId) ?? []);
      chars.set(characterId, rank);
      next.set(guildId, chars);
      return next;
    });
  }

  canJoinGuild(guildId: string): boolean {
    const chars = this.#selections().get(guildId);
    if (!chars) return false;
    return [...chars.values()].some((r) => r !== undefined);
  }

  isJoining(guildId: string): boolean {
    return this.#joiningGuildId() === guildId;
  }

  joinGuild(guild: GuildEligibility): void {
    const chars = this.#selections().get(guild.guildId);
    if (!chars) return;

    const entries = [...chars.entries()]
      .filter(([, rank]) => rank !== undefined)
      .map(([characterId, rank]) => ({ characterId, rank: rank! }));

    this.#joiningGuildId.set(guild.guildId);
    this.#characterStore.joinGuildBulk(guild.guildId, entries).subscribe({
      next: () => {
        this.#joiningGuildId.set(null);
        if (this.guilds().length === 0) {
          this.#router.navigate(['/guilds', guild.guildId, 'dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.#joiningGuildId.set(null);
        this.#snackbar.error(this.#characterStore.membershipErrorKey(err));
      },
    });
  }

  finish(): void {
    this.#router.navigate(['/guilds']);
  }
}
