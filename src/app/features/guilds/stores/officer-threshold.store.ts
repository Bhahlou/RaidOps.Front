import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { OfficerThreshold } from '../models/officer-threshold.model';
import { GuildSettingsService } from '../services/guild-settings.service';

interface OfficerThresholdStoreState {
  guildId: string | null;
  officerThreshold: OfficerThreshold | null;
}

@Injectable({ providedIn: 'root' })
export class OfficerThresholdStore {
  readonly #settingsService = inject(GuildSettingsService);
  readonly #state = signal<OfficerThresholdStoreState>({ guildId: null, officerThreshold: null });

  readonly officerThreshold = computed(() => this.#state().officerThreshold);

  loadOfficerThreshold(guildId: string): Observable<OfficerThreshold> {
    const current = this.#state();
    if (current.guildId === guildId && current.officerThreshold !== null) {
      return of(current.officerThreshold);
    }
    return this.#settingsService
      .getOfficerThreshold(guildId)
      .pipe(tap((officerThreshold) => this.#state.set({ guildId, officerThreshold })));
  }

  patchOfficerThreshold(guildId: string, officerThreshold: OfficerThreshold): void {
    this.#state.set({ guildId, officerThreshold });
  }

  invalidate(): void {
    this.#state.set({ guildId: null, officerThreshold: null });
  }
}
