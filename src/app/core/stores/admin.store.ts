import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { RaidBuffDefinitionInput, RaidBuffUpsertSummary } from '../../shared/models/raid-buff-definition.model';

@Service()
export class AdminStore {
  readonly #adminService = inject(AdminService);

  /** Re-syncs the spell reference table from wago.tools right now, for every tracked branch. */
  syncSpells(): Observable<void> {
    return this.#adminService.syncSpells();
  }

  /** Creates or overwrites one raid buff/debuff definition of an expansion, matched by its spell. */
  saveRaidBuff(expansionId: number, definition: RaidBuffDefinitionInput): Observable<RaidBuffUpsertSummary> {
    return this.#adminService.saveRaidBuff(expansionId, definition);
  }

  /** Edits one existing raid buff/debuff definition by its ID, including its spell. */
  updateRaidBuff(id: number, definition: RaidBuffDefinitionInput): Observable<void> {
    return this.#adminService.updateRaidBuff(id, definition);
  }

  /** Writes a whole definitions file to an expansion, all-or-nothing, optionally pruning what the file lacks. */
  importRaidBuffs(expansionId: number, definitions: RaidBuffDefinitionInput[], pruneMissing: boolean): Observable<RaidBuffUpsertSummary> {
    return this.#adminService.importRaidBuffs(expansionId, definitions, pruneMissing);
  }

  /** Deletes one raid buff/debuff definition by its ID. */
  deleteRaidBuff(id: number): Observable<void> {
    return this.#adminService.deleteRaidBuff(id);
  }
}
