import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { RaidsService } from '../services/raids.service';

interface SeriesKey {
  guildId: string;
  guildBranchId: number;
}

/** Raid series (recurring templates) configured for a guild branch — active and inactive alike. */
@Service()
export class RaidSeriesStore {
  readonly #service = inject(RaidsService);

  readonly #key = signal<SeriesKey | null>(null);

  readonly #seriesResource = httpResource<RaidSeries[]>(() => {
    const key = this.#key();
    return key ? `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/raids/series` : undefined;
  });

  readonly series = computed(() => this.#seriesResource.value() ?? null);
  readonly isLoading = this.#seriesResource.isLoading;

  /** Points the store at a guild branch's raid series and forces a fresh fetch. */
  load(guildId: string, guildBranchId: number): void {
    const next: SeriesKey = { guildId, guildBranchId };
    const current = this.#key();
    if (current?.guildId === next.guildId && current?.guildBranchId === next.guildBranchId) {
      this.#seriesResource.reload();
    } else {
      this.#key.set(next);
    }
  }

  /** Re-fetches the current guild branch's series without changing which one is tracked. */
  reload(): void {
    this.#seriesResource.reload();
  }

  createSeries(guildId: string, guildBranchId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#service.createSeries(guildId, guildBranchId, payload);
  }

  updateSeries(guildId: string, guildBranchId: number, seriesId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#service.updateSeries(guildId, guildBranchId, seriesId, payload);
  }

  deactivateSeries(guildId: string, guildBranchId: number, seriesId: number, deleteEmptyOccurrences: boolean): Observable<void> {
    return this.#service.deactivateSeries(guildId, guildBranchId, seriesId, deleteEmptyOccurrences);
  }
}
