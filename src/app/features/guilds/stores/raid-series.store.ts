import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { RaidsService } from '../services/raids.service';

/** Raid series (recurring templates) configured for a guild — active and inactive alike. */
@Service()
export class RaidSeriesStore {
  readonly #service = inject(RaidsService);

  readonly #guildId = signal<string | null>(null);

  readonly #seriesResource = httpResource<RaidSeries[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/raids/series` : undefined;
  });

  readonly series = computed(() => this.#seriesResource.value() ?? null);
  readonly isLoading = this.#seriesResource.isLoading;

  /** Points the store at a guild's raid series and forces a fresh fetch. */
  load(guildId: string): void {
    if (this.#guildId() === guildId) {
      this.#seriesResource.reload();
    } else {
      this.#guildId.set(guildId);
    }
  }

  /** Re-fetches the current guild's series without changing which guild is tracked. */
  reload(): void {
    this.#seriesResource.reload();
  }

  createSeries(guildId: string, payload: RaidSeriesPayload): Observable<void> {
    return this.#service.createSeries(guildId, payload);
  }

  updateSeries(guildId: string, seriesId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#service.updateSeries(guildId, seriesId, payload);
  }

  deactivateSeries(guildId: string, seriesId: number): Observable<void> {
    return this.#service.deactivateSeries(guildId, seriesId);
  }
}
