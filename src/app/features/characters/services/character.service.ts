import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BnetAccount } from '../models/bnet-account.model';

/**
 * Thin HTTP layer for character-related endpoints.
 * Holds no state — use CharacterStore for state management.
 */
@Injectable({ providedIn: 'root' })
export class CharacterService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /**
   * Returns the linked Battle.net account, or `null` if none has been linked yet (404).
   * Other HTTP errors are propagated as-is.
   */
  getBnetAccount(): Observable<BnetAccount | null> {
    return this.#http
      .get<BnetAccount>(`${this.#api}/api/v1/bnet/account`)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(null);
          }
          throw err;
        }),
      );
  }
}
