import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CharacterService } from '../services/character.service';
import { BnetAccount } from '../models/bnet-account.model';
import { Character } from '../models/character.model';
import { BnetService } from '../../../shared/services/bnet.service';
import { GuildMembershipStore } from '../../guilds/stores/guild-membership.store';

/**
 * Signal store for character-related state.
 *
 * BNet account lifecycle:
 *  - `undefined` — not yet fetched
 *  - `null`      — fetched, no account linked
 *  - `BnetAccount` — fetched, account linked
 */
@Injectable({ providedIn: 'root' })
export class CharacterStore {
  readonly #characterService = inject(CharacterService);
  readonly #bnetService = inject(BnetService);
  readonly #membershipStore = inject(GuildMembershipStore);

  readonly #bnetAccount = signal<BnetAccount | null | undefined>(undefined);

  /** The linked Battle.net account. `undefined` before first load; `null` if not linked. */
  readonly bnetAccount = this.#bnetAccount.asReadonly();

  /** True while the BNet account hasn't been fetched yet. */
  readonly isBnetLoading = computed(() => this.#bnetAccount() === undefined);

  /** True once fetched and an account is present. */
  readonly isBnetLinked = computed(() => this.#bnetAccount() != null);

  /**
   * Fetches the BNet account and updates the store.
   * Emits `null` if no account is linked (API returns 404).
   */
  loadBnetAccount(): Observable<BnetAccount | null> {
    this.#bnetAccount.set(undefined); // reset to loading state before every call
    return this.#bnetService
      .getBnetAccount()
      .pipe(tap((account) => this.#bnetAccount.set(account)));
  }

  // ── Characters ────────────────────────────────────────────────────────────

  /** `undefined` = not yet fetched / loading; `[]` = loaded, none imported yet. */
  readonly #characters = signal<Character[] | undefined>(undefined);

  /** Read-only view of the characters list. */
  readonly characters = this.#characters.asReadonly();

  /** True while characters are being fetched. */
  readonly isCharactersLoading = computed(() => this.#characters() === undefined);

  /** The current character list, defaulting to `[]` while loading. */
  readonly characterList = computed(() => this.#characters() ?? []);

  /**
   * Fetches the user's imported characters and updates the store.
   * Call this after confirming BNet is linked.
   */
  loadCharacters(): Observable<Character[]> {
    this.#characters.set(undefined); // reset to loading state
    return this.#characterService.getCharacters().pipe(tap((chars) => this.#characters.set(chars)));
  }

  /** Sets the character as inactive in RaidOps and removes it from the local list. */
  deactivateCharacter(characterId: number): Observable<{ message: string }> {
    return this.#characterService.deactivateCharacter(characterId).pipe(
      tap(() => {
        this.#characters.update((chars) => (chars ? chars.filter((c) => c.id !== characterId) : chars));
        this.#membershipStore.evictCharacter(characterId);
      }),
    );
  }

  /** Re-fetches the character's BNet data and updates it in the local list. */
  resyncCharacter(characterId: number): Observable<Character> {
    return this.#characterService.resyncCharacter(characterId).pipe(
      tap((updated) => {
        this.#characters.update((chars) =>
          chars ? chars.map((c) => (c.id === characterId ? updated : c)) : chars,
        );
      }),
    );
  }
}
