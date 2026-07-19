import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Thin HTTP interface for Battle.net account endpoints — called only by CharacterStore. */
@Service()
export class BnetService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/bnet';

  /** Unlinks a Battle.net account and deletes any characters synced from it (backend cascade). */
  unlinkBnetAccount(bnetId: string): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/accounts/${bnetId}`);
  }
}
