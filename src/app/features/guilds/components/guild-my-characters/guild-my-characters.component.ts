import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { GuildMembershipStore } from '../../stores/guild-membership.store';
import { CharacterStore } from '../../../characters/stores/character.store';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';

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
  ],
  templateUrl: './guild-my-characters.component.html',
  styleUrl: './guild-my-characters.component.scss',
})
export class GuildMyCharactersComponent {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildMembershipStore);
  readonly #characterStore = inject(CharacterStore);

  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  // ── Store projections ─────────────────────────────────────────────────────

  readonly myCharacters = this.#store.myCharacterList;
  readonly isLoading = this.#store.isMyCharactersLoading;
  readonly joiningCharacterId = this.#store.joiningCharacterId;
  readonly leavingCharacterId = this.#store.leavingCharacterId;
  readonly updatingRankCharacterId = this.#store.updatingRankCharacterId;

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showAddPanel = signal(false);

  /** Rank selected per character in the add panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<number, CharacterRank>());

  readonly addableCharacters = computed(() => {
    const inGuild = new Set(this.myCharacters().map(c => c.characterId));
    return this.#characterStore.characterList().filter(c => !inGuild.has(c.id));
  });

  readonly #characterById = computed(() =>
    new Map(this.#characterStore.characterList().map(c => [c.id, c]))
  );

  characterLink(characterId: number): string[] | null {
    const c = this.#characterById().get(characterId);
    if (!c) return null;
    return ['/characters', c.branchName.toLowerCase().replace(/[\s_]+/g, '-'), c.realmSlug, c.name.toLowerCase()];
  }

  constructor() {
    effect(() => this.#store.loadMyCharactersInGuild(this.guildId()));
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
      next: () => this.showAddPanel.set(false),
    });
  }

  updateRank(characterId: number, rank: CharacterRank): void {
    this.#store.updateRank(characterId, this.guildId(), rank).subscribe();
  }

  removeCharacter(characterId: number): void {
    this.#store.leaveGuild(characterId, this.guildId()).subscribe();
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
