import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RaidBuffDefinitionInput, RaidBuffUpsertSummary } from '../../shared/models/raid-buff-definition.model';

/** The back-end's generic command envelope; the payload of interest is `body`. */
interface CommandResponse<T> {
  message: string;
  body: T;
  status: string;
}

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

  /** Creates or overwrites one raid buff/debuff definition of an expansion, matched by its spell. */
  saveRaidBuff(expansionId: number, definition: RaidBuffDefinitionInput): Observable<RaidBuffUpsertSummary> {
    return this.#http
      .put<CommandResponse<RaidBuffUpsertSummary>>(`${this.#api}/admin/raid-buffs/${expansionId}`, definition)
      .pipe(map((response) => response.body));
  }

  /** Edits one existing raid buff/debuff definition by its ID — unlike saveRaidBuff, this can change its spell. */
  updateRaidBuff(id: number, definition: RaidBuffDefinitionInput): Observable<void> {
    return this.#http.put<void>(`${this.#api}/admin/raid-buffs/definitions/${id}`, definition);
  }

  /**
   * Writes a whole definitions file to an expansion, all-or-nothing. With `pruneMissing`, the
   * expansion's definitions absent from the file are deleted so it ends up matching the file exactly.
   */
  importRaidBuffs(expansionId: number, definitions: RaidBuffDefinitionInput[], pruneMissing: boolean): Observable<RaidBuffUpsertSummary> {
    return this.#http
      .post<CommandResponse<RaidBuffUpsertSummary>>(`${this.#api}/admin/raid-buffs/${expansionId}/import`, { definitions, pruneMissing })
      .pipe(map((response) => response.body));
  }

  /** Deletes one raid buff/debuff definition by its ID. */
  deleteRaidBuff(id: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/admin/raid-buffs/${id}`);
  }
}
