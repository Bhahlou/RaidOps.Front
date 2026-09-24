import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Thin HTTP layer for owner-only admin endpoints.
 * Holds no state — use AdminStore for state management.
 */
@Service()
export class AdminService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Re-syncs the spell reference table from wago.tools right now, for every tracked branch. */
  syncSpells(): Observable<void> {
    return this.#http.post<void>(`${this.#api}/admin/sync-spells`, {});
  }
}
