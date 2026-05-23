import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BnetAccount } from '../models/bnet-account.model';
import { BranchDto } from '../../../shared/models/branch.model';
import { AvailableCharacterDto, CharacterToImportDto } from '../models/available-character.model';
import { CharacterDto } from '../models/character.model';

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

  /** Returns all WoW characters imported by the authenticated user. */
  getCharacters(): Observable<CharacterDto[]> {
    return this.#http.get<CharacterDto[]>(`${this.#api}/api/v1/characters`);
  }

  /** Returns all available WoW branches ordered by ID. */
  getBranches(): Observable<BranchDto[]> {
    return this.#http.get<BranchDto[]>(`${this.#api}/api/v1/branches`);
  }

  /**
   * Returns the list of WoW characters available for import from the user's BNet account
   * for the given branch, annotated with an `alreadyImported` flag.
   */
  getAvailableCharacters(branchId: number): Observable<AvailableCharacterDto[]> {
    return this.#http.get<AvailableCharacterDto[]>(
      `${this.#api}/api/v1/characters/available`,
      { params: { branchId } },
    );
  }

  /**
   * Imports the selected characters into RaidOps.
   * Returns the server's `CommandResponse` message.
   */
  importCharacters(branchId: number, characters: CharacterToImportDto[]): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#api}/api/v1/characters/import`, {
      branchId,
      characters,
    });
  }
}
