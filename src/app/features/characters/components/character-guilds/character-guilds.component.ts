import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { CharacterStore } from '../../stores/character.store';
import { Character } from '../../models/character.model';
import { CharacterRank } from '../../../guilds/models/character-rank.enum';

@Component({
  selector: 'app-character-guilds',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatOption,
    MatSelect,
    MatProgressSpinner,
    TranslocoPipe,
    DiscordIconComponent,
  ],
  templateUrl: './character-guilds.component.html',
  styleUrl: './character-guilds.component.scss',
})
export class CharacterGuildsComponent {
  readonly character = input.required<Character>();

  readonly #store = inject(CharacterStore);

  readonly DiscordIconType = DiscordIconType;
  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  // ── Derived from the character input ─────────────────────────────────────

  readonly memberships = computed(() => this.character().guildMemberships);

  // ── Store projections ─────────────────────────────────────────────────────

  readonly eligibleGuilds = this.#store.eligibleGuildList;
  readonly isEligibleLoading = this.#store.isEligibleLoading;
  readonly joiningGuildId = this.#store.joiningGuildId;
  readonly leavingGuildId = this.#store.leavingGuildId;
  readonly updatingRankGuildId = this.#store.updatingRankGuildId;

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showEligible = signal(false);

  /** Rank selected per guild in the eligible panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<string, CharacterRank>());

  toggleEligible(): void {
    if (this.showEligible()) {
      this.showEligible.set(false);
      return;
    }
    this.showEligible.set(true);
    this.#store.loadEligibleGuilds(this.character().id);
  }

  getRankSelection(guildId: string): CharacterRank {
    return this.#rankSelections().get(guildId) ?? CharacterRank.Main;
  }

  setRankSelection(guildId: string, rank: CharacterRank): void {
    this.#rankSelections.update(m => new Map(m).set(guildId, rank));
  }

  joinGuild(guildId: string): void {
    this.#store.joinGuild(this.character().id, guildId, this.getRankSelection(guildId)).subscribe({
      next: () => this.showEligible.set(false),
    });
  }

  updateRank(guildId: string, rank: CharacterRank): void {
    this.#store.updateRank(this.character().id, guildId, rank).subscribe();
  }

  leaveGuild(guildId: string): void {
    this.#store.leaveGuild(this.character().id, guildId).subscribe();
  }

  rankLabel(rank: CharacterRank): string {
    const map: Record<CharacterRank, string> = {
      [CharacterRank.Main]: 'Main',
      [CharacterRank.Split]: 'Split',
      [CharacterRank.Alt]: 'Alt',
    };
    return map[rank];
  }
}
