import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { FilterMenuComponent, FilterOption } from '../../../../shared/components/form/filter-menu/filter-menu.component';
import { wowClassIconUrl } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { CharacterRank } from '../../models/character-rank.enum';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { assignableCharactersFor } from '../../utils/assignable-characters.util';

interface SpecOption {
  specId: number;
  iconUrl: string | null;
}

/**
 * Roster pool pinned to the Raids page, shared across every visible raid panel — drag source only
 * (`CdkDrag` per row, no drop target of its own). Scoped to the page's guild branch (server-side,
 * via `GuildRosterStore`). A character shows up as long as they're eligible for at least one of
 * the currently visible raid events — same `assignableCharactersFor` eligibility rules the grid's
 * own click-to-assign picker uses (absence, one-character-per-player-per-event, cross-event
 * lockout-zone conflicts), so "who can I drag where" reads identically everywhere. Two raids
 * sharing no lockout zone (e.g. an SSC/TK/Gruul split and a separate BT/Hyjal one) are independent:
 * a character already seated in the first still shows up, free for the second. Narrowing to
 * "available for raid X" via `targetEventFilter` checks eligibility for that one event specifically
 * instead of the union.
 */
@Component({
  selector: 'app-raid-roster-pool',
  standalone: true,
  imports: [CdkDrag, CdkDropList, CharacterRaidSpecsComponent, EmptyHintComponent, FilterMenuComponent, TranslocoPipe],
  templateUrl: './raid-roster-pool.component.html',
  styleUrl: './raid-roster-pool.component.scss',
})
export class RaidRosterPoolComponent {
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  readonly events = input<RaidEvent[]>([]);
  /** True for non-officer viewers — rows aren't draggable. */
  readonly disabled = input(false);
  /** Highlights the viewer's own characters (yellow outline) in the pool list. */
  readonly currentUserDiscordId = input<string | null>(null);

  readonly #store = inject(GuildRosterStore);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #transloco = inject(TranslocoService);

  readonly searchQuery = signal('');
  // Every pool filter is multi-select — several classes/specs/ranks can be picked at once.
  readonly classFilter = signal<number[]>([]);
  readonly specFilter = signal<number[]>([]);
  readonly rankFilter = signal<CharacterRank[]>([]);
  /** Narrows the pool to "available for this raid specifically" — see the class doc comment. */
  readonly targetEventFilter = signal<number | undefined>(undefined);

  /** The store is already scoped to this guild branch — no client-side branch filtering needed. */
  readonly #branchMembers = computed(() => this.#store.members() ?? []);

  readonly classFilterOptions = computed<FilterOption<number>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    const ids = new Set(this.#branchMembers().map((m) => m.classId));
    return [...ids]
      .map((classId) => ({ value: classId, label: this.#transloco.translate(`classes.${classId}`), iconUrl: wowClassIconUrl(classId) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly specOptions = computed<SpecOption[]>(() => {
    const byId = new Map<number, SpecOption>();
    for (const m of this.#branchMembers()) {
      const main = m.raidSpecs.find((s) => s.isMain);
      if (main && !byId.has(main.specId)) byId.set(main.specId, { specId: main.specId, iconUrl: main.iconUrl });
    }
    return [...byId.values()];
  });

  readonly specFilterOptions = computed<FilterOption<number>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return this.specOptions()
      .map((s) => ({ value: s.specId, label: this.#transloco.translate(`specs.${s.specId}`), iconUrl: s.iconUrl }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly rankFilterOptions = computed<FilterOption<CharacterRank>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt].map((rank) => ({
      value: rank,
      label: this.#transloco.translate(`roster.list.rank.${rank}`),
    }));
  });

  readonly eventFilterOptions = computed<FilterOption<number>[]>(() =>
    [...this.events()].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)).map((e) => ({ value: e.id, label: e.name })),
  );

  readonly poolMembers = computed(() => {
    const visibleEvents = this.events();
    const branchMembers = this.#branchMembers();

    // Per-visible-event eligible-character-ID sets, via the same rules the grid's own
    // click-to-assign picker uses — see the class doc comment.
    const assignableIdsByEvent = new Map(
      visibleEvents.map((e) => [e.id, new Set(assignableCharactersFor(e, branchMembers, visibleEvents).map((c) => c.characterId))]),
    );

    const targetEventId = this.targetEventFilter();
    let list = branchMembers.filter((m) =>
      targetEventId !== undefined
        ? (assignableIdsByEvent.get(targetEventId)?.has(m.characterId) ?? false)
        : [...assignableIdsByEvent.values()].some((ids) => ids.has(m.characterId)),
    );

    const classIds = this.classFilter();
    const specIds = this.specFilter();
    const ranks = this.rankFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (classIds.length > 0) list = list.filter((m) => classIds.includes(m.classId));
    if (specIds.length > 0) list = list.filter((m) => m.raidSpecs.some((s) => s.isMain && specIds.includes(s.specId)));
    if (ranks.length > 0) list = list.filter((m) => ranks.includes(m.characterRank));
    if (query) {
      list = list.filter(
        (m) => m.characterName.toLowerCase().includes(query) || (m.playerName ?? '').toLowerCase().includes(query),
      );
    }

    return list.sort((a, b) => a.characterName.localeCompare(b.characterName));
  });

  readonly hasActiveFilters = computed(
    () =>
      this.classFilter().length > 0 ||
      this.specFilter().length > 0 ||
      this.rankFilter().length > 0 ||
      this.targetEventFilter() !== undefined ||
      this.searchQuery().trim() !== '',
  );

  constructor() {
    // Reloads on first render and whenever guildId/guildBranchId changes — this panel stays
    // mounted across event-tab switches, so only the guild/branch identity (not the active
    // event) should retrigger a fetch.
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      this.#store.loadRoster(guildId, guildBranchId);
    });
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
  }

  clearFilters(): void {
    this.classFilter.set([]);
    this.specFilter.set([]);
    this.rankFilter.set([]);
    this.targetEventFilter.set(undefined);
    this.searchQuery.set('');
  }

  /** The pool is a drag source only — nothing may be dropped back into it (unassign is a button on the slot chip). */
  readonly rejectEnter = (): boolean => false;

  isOwnCharacter(member: GuildRosterMember): boolean {
    const currentUserId = this.currentUserDiscordId();
    return currentUserId != null && member.playerDiscordId === currentUserId;
  }

  dragItem(member: GuildRosterMember): RaidDragItem {
    return {
      characterId: member.characterId,
      characterName: member.characterName,
      classId: member.classId,
      classColor: member.classColor,
      playerDiscordId: member.playerDiscordId,
    };
  }

  onDragStarted(member: GuildRosterMember): void {
    this.#boardStore.startDrag(member.playerDiscordId, member.characterId);
  }

  onDragEnded(): void {
    this.#boardStore.endDrag();
  }
}
