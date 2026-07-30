import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { CharacterRank } from '../../models/character-rank.enum';
import { Character } from '../../../characters/models/character.model';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { characterLink } from '../../../../shared/utils/character-link.util';

const RANK_ORDER: CharacterRank[] = [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt];

@Component({
  selector: 'app-guild-my-characters',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterLink,
    SelectComponent,
    TranslocoPipe,
    WowClassIconComponent,
    CharacterRaidSpecsComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyHintComponent,
  ],
  templateUrl: './guild-my-characters.component.html',
  styleUrl: './guild-my-characters.component.scss',
})
export class GuildMyCharactersComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();

  readonly #store = inject(CharacterStore);
  readonly #rosterStore = inject(GuildRosterStore);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #snackbar = inject(SnackbarService);

  ngOnInit(): void {
    this.#branchesStore.load(this.guildId());
  }

  /** The WoW branch name (e.g. "The War Within") backing the currently-viewed guild branch. */
  readonly #currentBranchName = computed(
    () => this.#branchesStore.branches().find((b) => b.id === this.guildBranchId())?.branchName,
  );

  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  readonly rankSelectOptions = computed<SelectOption<CharacterRank>[]>(() =>
    this.ranks.map((r) => ({ value: r, label: this.rankLabel(r) })),
  );

  // ── Store projections ─────────────────────────────────────────────────────

  readonly isLoading = this.#store.isCharactersLoading;
  readonly joiningCharacterId = this.#store.joiningCharacterId;
  readonly leavingCharacterId = this.#store.leavingCharacterId;
  readonly updatingRankCharacterId = this.#store.updatingRankCharacterId;

  // ── Derived from CharacterStore.characterList ────────────────────────────

  readonly myCharacters = computed(() =>
    this.#store
      .characterList()
      .filter((c) => this.#isInGuild(c))
      .sort((a, b) => RANK_ORDER.indexOf(this.rankFor(a)) - RANK_ORDER.indexOf(this.rankFor(b))),
  );

  // Only characters whose own WoW version matches the branch being viewed — a character can only
  // ever join the guild branch matching its own version (see JoinGuildCommandHandler), so listing
  // e.g. a Retail character as "addable" while viewing the Classic roster would be misleading even
  // though the join itself would still land it on the right branch server-side.
  readonly addableCharacters = computed(() => {
    const branchName = this.#currentBranchName();
    if (!branchName) return [];
    return this.#store.characterList().filter((c) => !this.#isInGuild(c) && c.branchName === branchName);
  });

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showAddPanel = signal(false);

  /** Narrow-viewport only (see .expand-toggle in the stylesheet) — always expanded above it. */
  readonly isExpanded = signal(false);

  /** Rank selected per character in the add panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<number, CharacterRank>());

  #isInGuild(character: Character): boolean {
    return character.guildMemberships.some(
      (m) => m.guildId === this.guildId() && m.guildBranchId === this.guildBranchId(),
    );
  }

  /** The character's roster rank for this guild branch. */
  rankFor(character: Character): CharacterRank {
    return (
      character.guildMemberships.find(
        (m) => m.guildId === this.guildId() && m.guildBranchId === this.guildBranchId(),
      )?.characterRank ?? CharacterRank.Main
    );
  }

  characterLink(character: Character): string[] {
    return characterLink(character.branchName, character.realmSlug, character.name);
  }

  toggleAddPanel(): void {
    this.showAddPanel.update((v) => !v);
  }

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  getRankSelection(charId: number): CharacterRank {
    return this.#rankSelections().get(charId) ?? CharacterRank.Main;
  }

  setRankSelection(charId: number, rank: CharacterRank): void {
    this.#rankSelections.update((m) => new Map(m).set(charId, rank));
  }

  joinCharacter(character: Character): void {
    this.#store
      .joinGuild(character.id, this.guildId(), this.getRankSelection(character.id))
      .subscribe({
        next: () => {
          this.showAddPanel.set(false);
          this.#snackbar.success('characterDetail.guilds.joinSuccess');
          this.#rosterStore.loadRoster(this.guildId(), this.guildBranchId());
        },
        error: (err: HttpErrorResponse) =>
          this.#snackbar.error(this.#store.membershipErrorKey(err)),
      });
  }

  updateRank(characterId: number, rank: CharacterRank): void {
    this.#store.updateRank(characterId, this.guildId(), rank).subscribe({
      next: () => {
        this.#snackbar.success('characterDetail.guilds.rankUpdateSuccess');
        this.#rosterStore.loadRoster(this.guildId(), this.guildBranchId());
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
  }

  removeCharacter(characterId: number): void {
    this.#store.leaveGuild(characterId, this.guildId()).subscribe({
      next: () => {
        this.#snackbar.success('characterDetail.guilds.leaveSuccess');
        this.#rosterStore.loadRoster(this.guildId(), this.guildBranchId());
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
