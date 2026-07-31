import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { CharacterRaidSpecsComponent } from '../../../characters/components/character-raid-specs/character-raid-specs.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { FilterMenuComponent, FilterOption } from '../../../../shared/components/form/filter-menu/filter-menu.component';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { CharacterRank } from '../../models/character-rank.enum';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';

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

/**
 * Roster pool pinned to the raid builder page, shared across every event tab — drag source only
 * (`CdkDrag` per row, no drop target of its own). Scoped to the page's guild branch (server-side,
 * via `GuildRosterStore`), with characters already assigned to the active event excluded.
 * Availability isn't known for a pool member
 * until it's actually assigned (the backend only resolves it per slot assignment) — the server
 * still rejects an assignment against a declared absence (`MemberDeclaredAbsent`).
 */
@Component({
  selector: 'app-raid-roster-pool',
  standalone: true,
  imports: [CdkDrag, CdkDropList, WowClassIconComponent, CharacterRaidSpecsComponent, EmptyHintComponent, FilterMenuComponent, TranslocoPipe],
  templateUrl: './raid-roster-pool.component.html',
  styleUrl: './raid-roster-pool.component.scss',
})
export class RaidRosterPoolComponent {
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  readonly activeEvent = input<RaidEvent | null>(null);
  /** True for non-officer viewers — rows aren't draggable. */
  readonly disabled = input(false);

  readonly #store = inject(GuildRosterStore);
  readonly #transloco = inject(TranslocoService);

  readonly isLoading = this.#store.isLoading;

  readonly searchQuery = signal('');
  readonly classFilter = signal<number | undefined>(undefined);
  readonly specFilter = signal<number | undefined>(undefined);
  readonly rankFilter = signal<CharacterRank | undefined>(undefined);

  /** The store is already scoped to this guild branch — no client-side branch filtering needed. */
  readonly #branchMembers = computed(() => this.#store.members() ?? []);

  readonly classOptions = computed<ClassOption[]>(() => {
    const byId = new Map<number, ClassOption>();
    for (const m of this.#branchMembers()) {
      if (!byId.has(m.classId)) byId.set(m.classId, { classId: m.classId, className: m.className, classColor: m.classColor });
    }
    return [...byId.values()].sort((a, b) => a.className.localeCompare(b.className));
  });

  readonly classFilterOptions = computed<FilterOption<number>[]>(() =>
    this.classOptions().map((c) => ({ value: c.classId, label: c.className })),
  );

  readonly specOptions = computed<SpecOption[]>(() => {
    const byId = new Map<number, SpecOption>();
    for (const m of this.#branchMembers()) {
      const main = m.raidSpecs.find((s) => s.isMain);
      if (main && !byId.has(main.specId)) byId.set(main.specId, { specId: main.specId, name: main.name, iconUrl: main.iconUrl });
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly specFilterOptions = computed<FilterOption<number>[]>(() =>
    this.specOptions().map((s) => ({ value: s.specId, label: s.name })),
  );

  readonly rankFilterOptions = computed<FilterOption<CharacterRank>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt].map((rank) => ({
      value: rank,
      label: this.#transloco.translate(`roster.list.rank.${rank}`),
    }));
  });

  readonly poolMembers = computed(() => {
    const assignedIds = new Set((this.activeEvent()?.assignments ?? []).map((a) => a.characterId));
    let list = this.#branchMembers().filter((m) => !assignedIds.has(m.characterId));

    const classId = this.classFilter();
    const specId = this.specFilter();
    const rank = this.rankFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (classId !== undefined) list = list.filter((m) => m.classId === classId);
    if (specId !== undefined) list = list.filter((m) => m.raidSpecs.some((s) => s.isMain && s.specId === specId));
    if (rank !== undefined) list = list.filter((m) => m.characterRank === rank);
    if (query) {
      list = list.filter(
        (m) => m.characterName.toLowerCase().includes(query) || (m.playerName ?? '').toLowerCase().includes(query),
      );
    }

    return list.sort((a, b) => a.characterName.localeCompare(b.characterName));
  });

  readonly hasActiveFilters = computed(
    () => this.classFilter() !== undefined || this.specFilter() !== undefined || this.rankFilter() !== undefined || this.searchQuery().trim() !== '',
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
    this.classFilter.set(undefined);
    this.specFilter.set(undefined);
    this.rankFilter.set(undefined);
    this.searchQuery.set('');
  }

  /** The pool is a drag source only — nothing may be dropped back into it (unassign is a button on the slot chip). */
  readonly rejectEnter = (): boolean => false;

  dragItem(member: GuildRosterMember): RaidDragItem {
    return {
      characterId: member.characterId,
      characterName: member.characterName,
      classId: member.classId,
      classColor: member.classColor,
    };
  }
}
