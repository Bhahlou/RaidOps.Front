import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CharacterService } from '../services/character.service';
import { BnetAccount } from '../models/bnet-account.model';

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
    return this.#characterService.getBnetAccount().pipe(
      tap((account) => this.#bnetAccount.set(account)),
    );
  }
}
