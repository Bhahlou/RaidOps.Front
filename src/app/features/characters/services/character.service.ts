import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Character } from '../models/character.model';
import { CharacterDetail } from '../models/character-detail.model';
import { SyncedCharacter } from '../models/synced-character.model';
import { BnetAccount } from '../models/bnet-account.model';

/** Response envelope for {@link CharacterService.getCharacters}. */
export interface GetCharactersResponse {
  bnetAccount: BnetAccount | null;
  characters: Character[];
}

/** Raw response envelope for {@link CharacterService.getCharacter}, flattened into CharacterDetail. */
interface CharacterDetailResponse {
  character: Character;
  isOwner: boolean;
  canEditRaidSpecs: boolean;
}

/**
 * Thin HTTP layer for character-related endpoints.
 * Holds no state — use CharacterStore for state management.
 */
@Service()
export class CharacterService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/characters';

  /**
   * Returns all WoW characters activated in RaidOps by the authenticated user, along with
   * their linked Battle.net account, in a single request.
   */
  getCharacters(): Observable<GetCharactersResponse> {
    return this.#http.get<GetCharactersResponse>(`${this.#api}`);
  }

  /**
   * Returns a single character's detail by branch/realm/name, regardless of owner — used to
   * view a teammate's character from the guild roster. The requester must own the character or
   * have at least Roster access to a guild it belongs to.
   */
  getCharacter(branch: string, realm: string, name: string): Observable<CharacterDetail> {
    return this.#http.get<CharacterDetailResponse>(`${this.#api}/${branch}/${realm}/${name}`).pipe(
      map(({ character, isOwner, canEditRaidSpecs }) => ({ ...character, isOwner, canEditRaidSpecs })),
    );
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

  /**
   * Sets the specs the character is viable to raid with, replacing any previous set.
   * Usable right after activation or later as an edit.
   */
  setRaidSpecs(
    characterId: number,
    payload: { mainSpecId: number; viableSpecIds: number[] },
  ): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#api}/${characterId}/raid-specs`, payload);
  }
}
