import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminService } from '../services/admin.service';

@Service()
export class AdminStore {
  readonly #adminService = inject(AdminService);

  /** Re-syncs the spell reference table from wago.tools right now, for every tracked branch. */
  syncSpells(): Observable<void> {
    return this.#adminService.syncSpells();
  }
}
