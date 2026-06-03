import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Character } from '../models/character.model';
import { SyncedCharacter } from '../models/synced-character.model';


/**
 * Thin HTTP layer for character-related endpoints.
 * Holds no state — use CharacterStore for state management.
 */
@Injectable({ providedIn: 'root' })
export class CharacterService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/characters';

  /** Returns all WoW characters activated in RaidOps by the authenticated user. */
  getCharacters(): Observable<Character[]> {
    return this.#http.get<Character[]>(`${this.#api}`);
  }

  /** Returns all WoW characters synced from BNet, including inactive ones. */
  getSyncedCharacters(): Observable<SyncedCharacter[]> {
    return this.#http.get<SyncedCharacter[]>(`${this.#api}/synced`);
  }

  /**
   * Syncs all WoW characters from the user's BNet account for the given branch.
   * Requires a fresh BNet token obtained via the OAuth iframe flow beforehand.
   */
  syncCharacters(branchId: number): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#api}/sync`, {
      branchId,
    });
  }

  /** Marks the given RaidOps character IDs as active (imported into the roster). */
  activateCharacters(characterIds: number[]): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#api}/activate`, {
      characterIds,
    });
  }

  /** Sets IsActiveInRaidOps = false for the given character. Does not delete any related data. */
  deactivateCharacter(characterId: number): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#api}/${characterId}/deactivate`, {});
  }

  /** Re-fetches the character's data from the BNet API and returns the updated character. */
  resyncCharacter(characterId: number): Observable<Character> {
    return this.#http.post<Character>(`${this.#api}/${characterId}/resync`, {});
  }
}
