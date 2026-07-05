import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { CharacterRank } from '../../models/character-rank.enum';
import { ConfirmKickDialogComponent } from '../confirm-kick-dialog/confirm-kick-dialog.component';
import { characterLink } from '../../../../shared/utils/character-link.util';

type SortColumn = 'player' | 'character' | 'class' | 'level' | 'rank' | 'joinedAt';
type SortDirection = 'asc' | 'desc';

interface ClassOption {
  classId: number;
  className: string;
  classColor: string;
}

interface SpecOption {
  specId: number;
  name: string;
  iconUrl: string | null;
}

const RANK_ORDER: CharacterRank[] = [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt];

@Component({
  selector: 'app-guild-roster-list',
  standalone: true,
  imports: [
    RouterLink,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatDatepickerModule,
    MatFormField,
    MatSuffix,
    MatPrefix,
    MatIcon,
    MatInput,
    MatMenuModule,
    MatOption,
    MatSelect,
    MatProgressSpinner,
    MatTableModule,
    TranslocoPipe,
    WowClassIconComponent,
    DiscordIconComponent,
    CharacterRaidSpecsComponent,
  ],
  templateUrl: './guild-roster-list.component.html',
  styleUrl: './guild-roster-list.component.scss',
})
export class GuildRosterListComponent {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildRosterStore);
  readonly #characterStore = inject(CharacterStore);
  readonly #transloco = inject(TranslocoService);
  readonly #authStore = inject(AuthStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(MatDialog);

  readonly DiscordIconType = DiscordIconType;
  readonly ranks = RANK_ORDER;

  readonly columns = [
    'player',
    'character',
    'class',
    'specs',
    'level',
    'rank',
    'joinedAt',
    'actions',
  ];

  readonly isLoading = this.#store.isLoading;

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  readonly updatingRankCharacterId = this.#characterStore.updatingRankCharacterId;
  readonly kickingCharacterId = this.#characterStore.leavingCharacterId;

  readonly searchQuery = signal('');

  // ── Filters ───────────────────────────────────────────────────────────────

  readonly #selectedClassIds = signal<Set<number>>(new Set());
  readonly #selectedSpecIds = signal<Set<number>>(new Set());
  readonly #selectedRanks = signal<Set<CharacterRank>>(new Set());
  readonly dateRangeStart = signal<Date | null>(null);
  readonly dateRangeEnd = signal<Date | null>(null);

  readonly availableClasses = computed<ClassOption[]>(() => {
    const byId = new Map<number, ClassOption>();
    for (const m of this.#store.members() ?? []) {
      if (!byId.has(m.classId)) {
        byId.set(m.classId, {
          classId: m.classId,
          className: m.className,
          classColor: m.classColor,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.className.localeCompare(b.className));
  });

  readonly availableSpecs = computed<SpecOption[]>(() => {
    const byId = new Map<number, SpecOption>();
    for (const m of this.#store.members() ?? []) {
      const mainSpec = m.raidSpecs.find((s) => s.isMain);
      if (mainSpec && !byId.has(mainSpec.specId)) {
        byId.set(mainSpec.specId, {
          specId: mainSpec.specId,
          name: mainSpec.name,
          iconUrl: mainSpec.iconUrl,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly hasActiveFilters = computed(
    () =>
      this.#selectedClassIds().size > 0 ||
      this.#selectedSpecIds().size > 0 ||
      this.#selectedRanks().size > 0 ||
      this.dateRangeStart() !== null ||
      this.dateRangeEnd() !== null ||
      this.searchQuery().trim() !== '',
  );

  readonly filteredMembers = computed(() => {
    const members = this.#store.members();
    if (!members) return null;

    let list = members;
    const classIds = this.#selectedClassIds();
    const specIds = this.#selectedSpecIds();
    const ranks = this.#selectedRanks();
    const start = this.dateRangeStart();
    const end = this.dateRangeEnd();
    const query = this.searchQuery().trim().toLowerCase();

    if (classIds.size > 0) list = list.filter((m) => classIds.has(m.classId));
    if (specIds.size > 0)
      list = list.filter((m) => m.raidSpecs.some((s) => s.isMain && specIds.has(s.specId)));
    if (ranks.size > 0) list = list.filter((m) => ranks.has(m.characterRank));
    if (start) {
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      list = list.filter((m) => new Date(m.joinedAt) >= from);
    }
    if (end) {
      const to = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
      list = list.filter((m) => new Date(m.joinedAt) <= to);
    }
    if (query) {
      list = list.filter(
        (m) =>
          m.characterName.toLowerCase().includes(query) ||
          (m.playerName ?? '').toLowerCase().includes(query),
      );
    }

    return list;
  });

  /** Count of members matching the active filters — null while the roster hasn't loaded yet. */
  readonly filteredCount = computed(() => this.filteredMembers()?.length ?? null);

  // ── Sorting ───────────────────────────────────────────────────────────────

  readonly #sortColumn = signal<SortColumn | null>(null);
  readonly #sortDirection = signal<SortDirection>('asc');

  readonly sortedMembers = computed(() => {
    const members = this.filteredMembers();
    if (!members) return null;

    const column = this.#sortColumn();
    if (!column) return members;

    const dir = this.#sortDirection() === 'asc' ? 1 : -1;
    return [...members].sort((a, b) => dir * this.#compare(a, b, column));
  });

  constructor() {
    // Reloads on first render and whenever guildId changes — the parent leaf route component
    // is reused (not recreated) when only the guild switches, so ngOnInit alone would miss that.
    // loadRoster() always forces a fresh fetch (the roster can be edited by other officers/players
    // between visits, so the store's cache can't be trusted) and only writes signals, so no
    // self-triggering-loop risk here — no untracked() needed.
    effect(() => {
      const guildId = this.guildId();
      this.#store.loadRoster(guildId);
    });
  }

  toggleSort(column: SortColumn): void {
    if (this.#sortColumn() === column) {
      this.#sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.#sortColumn.set(column);
      this.#sortDirection.set('asc');
    }
  }

  sortIcon(column: SortColumn): string | null {
    if (this.#sortColumn() !== column) return null;
    return this.#sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleClass(classId: number): void {
    this.#selectedClassIds.update((ids) => toggleInSet(ids, classId));
  }

  toggleSpec(specId: number): void {
    this.#selectedSpecIds.update((ids) => toggleInSet(ids, specId));
  }

  toggleRank(rank: CharacterRank): void {
    this.#selectedRanks.update((ranks) => toggleInSet(ranks, rank));
  }

  isClassSelected(classId: number): boolean {
    return this.#selectedClassIds().has(classId);
  }

  isSpecSelected(specId: number): boolean {
    return this.#selectedSpecIds().has(specId);
  }

  isRankSelected(rank: CharacterRank): boolean {
    return this.#selectedRanks().has(rank);
  }

  setDateRangeStart(date: Date | null): void {
    this.dateRangeStart.set(date);
  }

  setDateRangeEnd(date: Date | null): void {
    this.dateRangeEnd.set(date);
  }

  clearDateRange(): void {
    this.dateRangeStart.set(null);
    this.dateRangeEnd.set(null);
  }

  clearAllFilters(): void {
    this.#selectedClassIds.set(new Set());
    this.#selectedSpecIds.set(new Set());
    this.#selectedRanks.set(new Set());
    this.searchQuery.set('');
    this.clearDateRange();
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
  }

  /** Formats a timestamp using the app's current language, not a hardcoded locale. */
  formatDate(joinedAt: string): string {
    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { dateStyle: 'medium' }).format(
      new Date(joinedAt),
    );
  }

  characterLink(member: GuildRosterMember): string[] {
    return characterLink(member.branchName, member.realmSlug, member.characterName);
  }

  canEditRank(member: GuildRosterMember): boolean {
    return this.isOfficer() || member.playerDiscordId === this.#authStore.user()?.discordId;
  }

  updateRank(member: GuildRosterMember, rank: CharacterRank): void {
    this.#characterStore.updateRank(member.characterId, this.guildId(), rank).subscribe({
      next: () => {
        this.#snackbar.success('characterDetail.guilds.rankUpdateSuccess');
        this.#store.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.#snackbar.error(this.#characterStore.membershipErrorKey(err));
      },
    });
  }

  kickMember(member: GuildRosterMember): void {
    this.#dialog
      .open(ConfirmKickDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { characterName: member.characterName },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.#characterStore.leaveGuild(member.characterId, this.guildId()).subscribe({
          next: () => {
            this.#snackbar.success('roster.list.kickSuccess');
            this.#store.reload();
          },
          error: (err: HttpErrorResponse) => {
            this.#snackbar.error(this.#characterStore.membershipErrorKey(err));
          },
        });
      });
  }

  #compare(a: GuildRosterMember, b: GuildRosterMember, column: SortColumn): number {
    switch (column) {
      case 'player':
        return (a.playerName ?? a.playerDiscordId).localeCompare(b.playerName ?? b.playerDiscordId);
      case 'character':
        return a.characterName.localeCompare(b.characterName);
      case 'class':
        return a.className.localeCompare(b.className);
      case 'level':
        return a.level - b.level;
      case 'rank':
        return RANK_ORDER.indexOf(a.characterRank) - RANK_ORDER.indexOf(b.characterRank);
      case 'joinedAt':
        return a.joinedAt.localeCompare(b.joinedAt);
    }
  }
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
