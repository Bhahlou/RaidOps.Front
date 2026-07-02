import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { GuildRosterMember } from '../models/guild-roster-member.model';
import { GuildRosterService } from '../services/guild-roster.service';

interface GuildRosterStoreState {
  guildId: string | null;
  members: GuildRosterMember[] | null;
}

@Injectable({ providedIn: 'root' })
export class GuildRosterStore {
  readonly #rosterService = inject(GuildRosterService);
  readonly #state = signal<GuildRosterStoreState>({ guildId: null, members: null });

  readonly members = computed(() => this.#state().members);
  readonly isLoading = computed(() => this.#state().members === null);

  loadRoster(guildId: string, force = false): Observable<GuildRosterMember[]> {
    const current = this.#state();
    if (!force && current.guildId === guildId && current.members !== null) {
      return of(current.members);
    }
    this.#state.set({ guildId, members: null });
    return this.#rosterService
      .getRoster(guildId)
      .pipe(tap((members) => this.#state.set({ guildId, members })));
  }

  invalidate(): void {
    this.#state.set({ guildId: null, members: null });
  }
}
