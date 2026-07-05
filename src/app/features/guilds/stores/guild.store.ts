import { computed, inject, Service, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { GuildSettings } from '../models/guild-settings.model';
import { GuildSettingsService } from '../services/guild-settings.service';

interface GuildStoreState {
  guildId: string | null;
  settings: GuildSettings | null;
}

@Service()
export class GuildStore {
  readonly #settingsService = inject(GuildSettingsService);
  readonly #state = signal<GuildStoreState>({ guildId: null, settings: null });

  readonly settings = computed(() => this.#state().settings);

  loadSettings(guildId: string): Observable<GuildSettings> {
    const current = this.#state();
    if (current.guildId === guildId && current.settings !== null) {
      return of(current.settings);
    }
    return this.#settingsService
      .getSettings(guildId)
      .pipe(tap((settings) => this.#state.set({ guildId, settings })));
  }

  patchSettings(guildId: string, settings: GuildSettings): void {
    this.#state.set({ guildId, settings });
  }

  invalidate(): void {
    this.#state.set({ guildId: null, settings: null });
  }
}
