import { computed, inject, Service, signal } from '@angular/core';
import { AuthStore } from '../../../core/stores/auth.store';
import { CHANGELOG_ENTRIES, CHANGELOG_EPOCHS, CHANGELOG_GROUPS } from '../data/changelog-entries.data';
import { ChangelogEntry, ChangelogEpoch, ChangelogGroup } from '../models/changelog-entry.model';

const STORAGE_KEY = 'changelog-seen-entry-ids';

interface GroupedGroup {
  group: ChangelogGroup;
  entries: ChangelogEntry[];
}

interface GroupedEpoch {
  epoch: ChangelogEpoch;
  groups: GroupedGroup[];
}

@Service()
export class ChangelogStore {
  readonly #authStore = inject(AuthStore);

  readonly entries: readonly ChangelogEntry[] = CHANGELOG_ENTRIES;
  readonly epochs: readonly ChangelogEpoch[] = CHANGELOG_EPOCHS;
  readonly groups: readonly ChangelogGroup[] = CHANGELOG_GROUPS;

  /** `epochs`, each paired with its `groups` (curated order), each paired with its entries (newest first). */
  readonly groupedEntries: readonly GroupedEpoch[] = this.epochs.map((epoch) => ({
    epoch,
    groups: this.groups
      .filter((group) => group.epochId === epoch.id)
      .map((group) => ({
        group,
        entries: this.entries.filter((e) => e.groupId === group.id),
      })),
  }));

  /** Unauthenticated fallback only — `/changelog` is a public route with no account to sync to. */
  readonly #anonymousSeenEntryIds = signal<ReadonlySet<string>>(new Set(readAnonymousSeenIds()));

  /** Backend-synced for authenticated users (multi-device), `localStorage` otherwise. */
  readonly #seenEntryIds = computed<ReadonlySet<string>>(() => {
    const user = this.#authStore.user();
    return user ? new Set(user.seenChangelogEntryIds) : this.#anonymousSeenEntryIds();
  });

  /** Snapshot taken *before* any marking happens this visit — keeps unseen highlights stable while the user opens groups. */
  readonly #seenEntryIdsSnapshot: ReadonlySet<string> = this.#seenEntryIds();

  /** Number of groups containing at least one entry not yet seen (live — reflects marks made during this visit). */
  readonly unseenCount = computed(() => {
    const seen = this.#seenEntryIds();
    return this.groups.filter((group) =>
      this.entries.some((e) => e.groupId === group.id && !seen.has(e.id)),
    ).length;
  });

  readonly hasUnseenEntries = computed(() => this.unseenCount() > 0);

  /** True when `entryId` wasn't seen as of this visit's snapshot. */
  isUnseen(entryId: string): boolean {
    return !this.#seenEntryIdsSnapshot.has(entryId);
  }

  /** True when the group contains at least one unseen entry, per the load-time snapshot. */
  isGroupUnseen(groupId: string): boolean {
    return this.entries.some((e) => e.groupId === groupId && this.isUnseen(e.id));
  }

  /** True when any of the epoch's groups contains at least one unseen entry. */
  isEpochUnseen(epochId: string): boolean {
    return this.groups.some((g) => g.epochId === epochId && this.isGroupUnseen(g.id));
  }

  /** Marks every entry in the given group as seen — call when the group is expanded (default or by click). */
  markGroupSeen(groupId: string): void {
    const entryIds = this.entries.filter((e) => e.groupId === groupId).map((e) => e.id);
    if (entryIds.length === 0) return;

    if (this.#authStore.isAuthenticated()) {
      this.#authStore.markChangelogSeen(entryIds).subscribe();
      return;
    }

    const next = new Set([...this.#anonymousSeenEntryIds(), ...entryIds]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    this.#anonymousSeenEntryIds.set(next);
  }
}

function readAnonymousSeenIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}
