import { computed, Injectable, signal } from '@angular/core';
import { CHANGELOG_ENTRIES } from '../data/changelog-entries.data';
import { ChangelogEntry } from '../models/changelog-entry.model';

const STORAGE_KEY = 'changelog-last-seen';

@Injectable({ providedIn: 'root' })
export class ChangelogStore {
  readonly entries: readonly ChangelogEntry[] = CHANGELOG_ENTRIES;

  readonly #lastSeenId = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  /** Number of entries newer than the last one the user has seen (all of them if never visited). */
  readonly unseenCount = computed(() => this.#countUnseen(this.#lastSeenId()));

  readonly hasUnseenEntries = computed(() => this.unseenCount() > 0);

  /** Snapshot of the last-seen id *before* `markAllSeen()` runs — lets the page highlight what's new. */
  readonly lastSeenIdSnapshot = this.#lastSeenId();

  /** True when `entryId` is newer than what was last seen, per the load-time snapshot. */
  isUnseen(entryId: string): boolean {
    const entryIndex = this.entries.findIndex((e) => e.id === entryId);
    return entryIndex !== -1 && entryIndex < this.#countUnseen(this.lastSeenIdSnapshot);
  }

  markAllSeen(): void {
    const latest = this.entries[0]?.id ?? null;
    if (!latest) return;
    localStorage.setItem(STORAGE_KEY, latest);
    this.#lastSeenId.set(latest);
  }

  /** Entries are newest-first; everything before the last-seen id's index counts as unseen. */
  #countUnseen(lastSeenId: string | null): number {
    if (lastSeenId === null) return this.entries.length;
    const lastSeenIndex = this.entries.findIndex((e) => e.id === lastSeenId);
    return lastSeenIndex === -1 ? this.entries.length : lastSeenIndex;
  }
}
