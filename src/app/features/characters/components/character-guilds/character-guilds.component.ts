import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
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
    WowClassIconComponent,
  ],
  templateUrl: './character-guilds.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './character-guilds.component.scss',
})
export class CharacterGuildsComponent implements OnInit {
  readonly character = input.required<Character>();
  /** When true, pre-opens the eligible-guilds panel and loads it immediately — used by the
   * get-started stepper so the user doesn't have to discover the "+" button themselves. */
  readonly autoExpand = input(false);

  readonly #store = inject(CharacterStore);
  readonly #snackbar = inject(SnackbarService);

  readonly DiscordIconType = DiscordIconType;
  readonly CharacterRank = CharacterRank;
  readonly ranks = Object.values(CharacterRank);

  // ── Derived from the character input ─────────────────────────────────────

  readonly memberships = computed(() => this.character().guildMemberships);

  // ── Store projections ─────────────────────────────────────────────────────

  readonly eligibleGuilds = computed(() => this.#store.eligibleGuildList(this.character().id));
  readonly isEligibleLoading = computed(() => this.#store.isEligibleLoading(this.character().id));
  readonly joiningGuildId = this.#store.joiningGuildId;
  readonly leavingGuildId = this.#store.leavingGuildId;
  readonly updatingRankGuildId = this.#store.updatingRankGuildId;

  // ── UI state ──────────────────────────────────────────────────────────────

  readonly showEligible = signal(false);

  /** Rank selected per guild in the eligible panel, defaults to Main. */
  readonly #rankSelections = signal(new Map<string, CharacterRank>());

  ngOnInit(): void {
    if (this.autoExpand()) {
      this.showEligible.set(true);
      this.#store.loadEligibleGuilds(this.character().id);
    }
  }

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
    this.#rankSelections.update((m) => new Map(m).set(guildId, rank));
  }

  joinGuild(guildId: string): void {
    this.#store.joinGuild(this.character().id, guildId, this.getRankSelection(guildId)).subscribe({
      next: () => {
        this.showEligible.set(false);
        this.#snackbar.success('characterDetail.guilds.joinSuccess');
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
  }

  updateRank(guildId: string, rank: CharacterRank): void {
    this.#store.updateRank(this.character().id, guildId, rank).subscribe({
      next: () => this.#snackbar.success('characterDetail.guilds.rankUpdateSuccess'),
      error: (err: HttpErrorResponse) => this.#snackbar.error(this.#store.membershipErrorKey(err)),
    });
  }

  leaveGuild(guildId: string): void {
    this.#store.leaveGuild(this.character().id, guildId).subscribe({
      next: () => this.#snackbar.success('characterDetail.guilds.leaveSuccess'),
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
