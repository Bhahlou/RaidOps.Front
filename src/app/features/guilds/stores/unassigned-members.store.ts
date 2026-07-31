import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UnassignedMember } from '../models/raid-event.model';

interface RangeKey {
  guildId: string;
  guildBranchId: number;
  rangeStart: string;
  rangeEnd: string;
}

/** Guild members assigned to no raid event within a date range — feeds the "unassigned" side panel. */
@Service()
export class UnassignedMembersStore {
  readonly #key = signal<RangeKey | null>(null);

  readonly #membersResource = httpResource<UnassignedMember[]>(() => {
    const key = this.#key();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/raids/unassigned-members?rangeStart=${key.rangeStart}&rangeEnd=${key.rangeEnd}`;
  });

  readonly members = computed(() => this.#membersResource.value() ?? []);
  readonly isLoading = this.#membersResource.isLoading;

  /** Points the store at a guild branch's unassigned members over a date range and forces a fresh fetch — assignments change constantly while the board is being built. */
  loadRange(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): void {
    const next: RangeKey = { guildId, guildBranchId, rangeStart, rangeEnd };
    const current = this.#key();
    if (current && sameRange(current, next)) {
      this.#membersResource.reload();
    } else {
      this.#key.set(next);
    }
  }

  /** Re-fetches the current range without changing which guild branch/range is tracked. */
  reload(): void {
    this.#membersResource.reload();
  }
}

function sameRange(a: RangeKey, b: RangeKey): boolean {
  return a.guildId === b.guildId && a.guildBranchId === b.guildBranchId && a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}
