import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { GuildMembershipStore } from '../../../guilds/stores/guild-membership.store';
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
  readonly characterId = input.required<number>();

  readonly #store = inject(GuildMembershipStore);

  readonly DiscordIconType = DiscordIconType;
  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  // ── Store projections ─────────────────────────────────────────────────────

  readonly memberships = this.#store.membershipList;
  readonly isMembershipsLoading = this.#store.isMembershipsLoading;
  readonly eligibleGuilds = this.#store.eligibleGuildList;
  readonly isEligibleLoading = this.#store.isEligibleLoading;
  readonly joiningGuildId = this.#store.joiningGuildId;
  readonly leavingGuildId = this.#store.leavingGuildId;
  readonly updatingRankGuildId = this.#store.updatingRankGuildId;

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showEligible = signal(false);

  /** Rank selected per guild in the eligible panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<string, CharacterRank>());

  constructor() {
    effect(() => this.#store.loadMemberships(this.characterId()));
  }

  toggleEligible(): void {
    if (this.showEligible()) {
      this.showEligible.set(false);
      return;
    }
    this.showEligible.set(true);
    this.#store.loadEligibleGuilds(this.characterId());
  }

  getRankSelection(guildId: string): CharacterRank {
    return this.#rankSelections().get(guildId) ?? CharacterRank.Main;
  }

  setRankSelection(guildId: string, rank: CharacterRank): void {
    this.#rankSelections.update(m => new Map(m).set(guildId, rank));
  }

  joinGuild(guildId: string): void {
    this.#store.joinGuild(this.characterId(), guildId, this.getRankSelection(guildId)).subscribe({
      next: () => this.showEligible.set(false),
    });
  }

  updateRank(guildId: string, rank: CharacterRank): void {
    this.#store.updateRank(this.characterId(), guildId, rank).subscribe();
  }

  leaveGuild(guildId: string): void {
    this.#store.leaveGuild(this.characterId(), guildId).subscribe();
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
