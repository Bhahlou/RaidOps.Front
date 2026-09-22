import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WowClass } from '../models/wow-class.model';

@Service()
export class WowClassService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/wowclasses';

  /**
   * Returns WoW classes ordered by Blizzard ID. When `availableForExpansionId` is given, the
   * server already filters out classes not actually available on that expansion (handles forked
   * branches like "Forever" correctly — don't re-filter client-side by `firstExpansionId`).
   */
  getAll(availableForExpansionId?: number) {
    const params = availableForExpansionId != null
      ? new HttpParams().set('availableForExpansionId', availableForExpansionId)
      : undefined;

    return this.#http.get<WowClass[]>(this.#api, { params });
  }
}
