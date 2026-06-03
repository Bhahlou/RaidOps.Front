import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { BnetAccount } from '../../features/characters/models/bnet-account.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BnetService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/bnet';

  /**
   * Returns the linked Battle.net account, or `null` if none has been linked yet (404).
   * Other HTTP errors are propagated as-is.
   */
  getBnetAccount(): Observable<BnetAccount | null> {
    return this.#http.get<BnetAccount>(`${this.#api}/account`).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          return of(null);
        }
        throw err;
      }),
    );
  }
}
