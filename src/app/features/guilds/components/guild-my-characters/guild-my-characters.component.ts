import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';
import { GuildRosterStore } from '../../stores/guild-roster.store';

const RANK_ORDER: CharacterRank[] = [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt];

@Component({
  selector: 'app-guild-my-characters',
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
    MatProgressSpinner,
    MatSelect,
    MatOption,
    TranslocoPipe,
    WowClassIconComponent,
    CharacterRaidSpecsComponent,
  ],
  templateUrl: './guild-my-characters.component.html',
  styleUrl: './guild-my-characters.component.scss',
})
export class GuildMyCharactersComponent {
  readonly guildId = input.required<string>();

  readonly #store = inject(CharacterStore);
  readonly #rosterStore = inject(GuildRosterStore);
  readonly #snackbar = inject(SnackbarService);

  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  // ── Store projections ─────────────────────────────────────────────────────

  readonly isLoading = this.#store.isCharactersLoading;
  readonly joiningCharacterId = this.#store.joiningCharacterId;
  readonly leavingCharacterId = this.#store.leavingCharacterId;
  readonly updatingRankCharacterId = this.#store.updatingRankCharacterId;

  // ── Derived from CharacterStore.characterList ────────────────────────────

  readonly myCharacters = computed(() =>
    this.#store.characterList()
      .filter(c => this.#isInGuild(c))
      .sort((a, b) => RANK_ORDER.indexOf(this.rankFor(a)) - RANK_ORDER.indexOf(this.rankFor(b))),
  );

  readonly addableCharacters = computed(() =>
    this.#store.characterList().filter(c => !this.#isInGuild(c)),
  );

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showAddPanel = signal(false);

  /** Rank selected per character in the add panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<number, CharacterRank>());

  #isInGuild(character: Character): boolean {
    return character.guildMemberships.some(m => m.guildId === this.guildId());
  }

  /** The character's roster rank for this guild. */
  rankFor(character: Character): CharacterRank {
    return character.guildMemberships.find(m => m.guildId === this.guildId())?.characterRank ?? CharacterRank.Main;
  }

  characterLink(character: Character): string[] {
    return ['/characters', character.branchName.toLowerCase().replace(/[\s_]+/g, '-'), character.realmSlug, character.name.toLowerCase()];
  }

  toggleAddPanel(): void {
    this.showAddPanel.update(v => !v);
  }

  getRankSelection(charId: number): CharacterRank {
    return this.#rankSelections().get(charId) ?? CharacterRank.Main;
  }

  setRankSelection(charId: number, rank: CharacterRank): void {
    this.#rankSelections.update(m => new Map(m).set(charId, rank));
  }

  joinCharacter(character: Character): void {
    this.#store.joinGuild(character.id, this.guildId(), this.getRankSelection(character.id)).subscribe({
      next: () => {
        this.showAddPanel.set(false);
        this.#snackbar.success('characterDetail.guilds.joinSuccess');
        this.#rosterStore.loadRoster(this.guildId(), true).subscribe();
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
  }

  updateRank(characterId: number, rank: CharacterRank): void {
    this.#store.updateRank(characterId, this.guildId(), rank).subscribe({
      next: () => {
        this.#snackbar.success('characterDetail.guilds.rankUpdateSuccess');
        this.#rosterStore.loadRoster(this.guildId(), true).subscribe();
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
  }

  removeCharacter(characterId: number): void {
    this.#store.leaveGuild(characterId, this.guildId()).subscribe({
      next: () => {
        this.#snackbar.success('characterDetail.guilds.leaveSuccess');
        this.#rosterStore.loadRoster(this.guildId(), true).subscribe();
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
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
