import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { CharacterService } from '../services/character.service';
import { BnetAccount } from '../models/bnet-account.model';
import { Character } from '../models/character.model';
import { CharacterSpec } from '../models/character-spec.model';
import { SpecService } from '../../../shared/services/spec.service';
import { Spec } from '../../../shared/models/spec.model';
import { GuildMembershipService } from '../../guilds/services/guild-membership.service';
import { EligibleGuild } from '../../guilds/models/eligible-guild.model';
import { CharacterRank } from '../../guilds/models/character-rank.enum';

/**
 * Signal store for character-related state, including the character↔guild-membership
 * relationship — a character's guild memberships travel with the character (embedded in the
 * `GET /characters` payload) rather than being fetched/cached in a separate store.
 *
 * BNet account lifecycle:
 *  - `undefined` — not yet fetched
 *  - `null`      — fetched, no account linked
 *  - `BnetAccount` — fetched, account linked
 */
@Injectable({ providedIn: 'root' })
export class CharacterStore {
  readonly #characterService = inject(CharacterService);
  readonly #specService = inject(SpecService);
  readonly #membershipService = inject(GuildMembershipService);

  readonly #bnetAccount = signal<BnetAccount | null | undefined>(undefined);

  /** The linked Battle.net account. `undefined` before first load; `null` if not linked. */
  readonly bnetAccount = this.#bnetAccount.asReadonly();

  /** True while the BNet account hasn't been fetched yet. */
  readonly isBnetLoading = computed(() => this.#bnetAccount() === undefined);

  /** True once fetched and an account is present. */
  readonly isBnetLinked = computed(() => this.#bnetAccount() != null);

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
   * Fetches the user's imported characters and their linked BNet account in a single request.
   * Cached — returns the existing list without a network call unless `force` is set (e.g. right
   * after a mutation that's known to make the cache stale: activation, BNet sync, a membership
   * change).
   */
  loadCharacters(force = false): Observable<Character[]> {
    const cached = this.#characters();
    if (!force && cached) return of(cached);

    this.#characters.set(undefined); // reset to loading state
    return this.#characterService.getCharacters().pipe(
      tap(({ bnetAccount, characters }) => {
        this.#bnetAccount.set(bnetAccount);
        this.#characters.set(characters);
      }),
      map(({ characters }) => characters),
    );
  }

  /** Sets the character as inactive in RaidOps and removes it from the local list. */
  deactivateCharacter(characterId: number): Observable<{ message: string }> {
    return this.#characterService.deactivateCharacter(characterId).pipe(
      tap(() => {
        this.#characters.update((chars) => (chars ? chars.filter((c) => c.id !== characterId) : chars));
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

  /** Replaces a single character in the local list with the result of `patch`. */
  #patchCharacter(characterId: number, patch: (character: Character) => Character): void {
    this.#characters.update((chars) => chars?.map((c) => (c.id === characterId ? patch(c) : c)));
  }

  /**
   * Sets the raid-viable specs for a character, replacing any previous set, and patches the
   * affected character in the local list using the already-cached spec reference data.
   */
  setRaidSpecs(
    characterId: number,
    payload: { mainSpecId: number; viableSpecIds: number[] },
  ): Observable<{ message: string }> {
    return this.#characterService.setRaidSpecs(characterId, payload).pipe(
      tap(() => {
        const specsById = new Map(this.#specs()?.map((s) => [s.id, s]));
        const raidSpecs: CharacterSpec[] = payload.viableSpecIds
          .map((specId): CharacterSpec | null => {
            const spec = specsById.get(specId);
            return spec
              ? { specId, name: spec.name, iconUrl: spec.iconUrl, isMain: specId === payload.mainSpecId }
              : null;
          })
          .filter((s): s is CharacterSpec => s !== null);

        this.#characters.update((chars) =>
          chars ? chars.map((c) => (c.id === characterId ? { ...c, raidSpecs } : c)) : chars,
        );
      }),
    );
  }

  // ── Guild memberships ────────────────────────────────────────────────────

  // joiningGuildId/joiningCharacterId — same join in flight, viewed from either the
  // character-detail perspective (one character, many guilds) or the roster perspective
  // (one guild, many characters); both UIs check whichever id is relevant to their row.
  readonly #joiningGuildId = signal<string | null>(null);
  readonly joiningGuildId = this.#joiningGuildId.asReadonly();
  readonly #joiningCharacterId = signal<number | null>(null);
  readonly joiningCharacterId = this.#joiningCharacterId.asReadonly();

  readonly #leavingGuildId = signal<string | null>(null);
  readonly leavingGuildId = this.#leavingGuildId.asReadonly();
  readonly #leavingCharacterId = signal<number | null>(null);
  readonly leavingCharacterId = this.#leavingCharacterId.asReadonly();

  readonly #updatingRankGuildId = signal<string | null>(null);
  readonly updatingRankGuildId = this.#updatingRankGuildId.asReadonly();
  readonly #updatingRankCharacterId = signal<number | null>(null);
  readonly updatingRankCharacterId = this.#updatingRankCharacterId.asReadonly();

  /**
   * Adds a character to a guild's roster. Refreshes the full character list afterward (forced,
   * bypassing the cache) since the new membership's guild name/icon aren't known locally.
   */
  joinGuild(characterId: number, guildId: string, rank: CharacterRank): Observable<void> {
    this.#joiningGuildId.set(guildId);
    this.#joiningCharacterId.set(characterId);

    return this.#membershipService.joinGuild(characterId, guildId, rank).pipe(
      switchMap(() => this.loadCharacters(true)),
      tap(() => {
        this.#joiningGuildId.set(null);
        this.#joiningCharacterId.set(null);
        this.#eligibleGuilds.update((g) => g?.filter((eg) => eg.guildId !== guildId));
      }),
      catchError((err) => {
        this.#joiningGuildId.set(null);
        this.#joiningCharacterId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  /** Updates a character's raid-composition rank on a guild roster, patching the local cache. */
  updateRank(characterId: number, guildId: string, rank: CharacterRank): Observable<void> {
    this.#updatingRankCharacterId.set(characterId);
    this.#updatingRankGuildId.set(guildId);

    return this.#membershipService.updateRank(characterId, guildId, rank).pipe(
      tap(() => {
        this.#updatingRankCharacterId.set(null);
        this.#updatingRankGuildId.set(null);
        this.#patchCharacter(characterId, (c) => ({
          ...c,
          guildMemberships: c.guildMemberships.map((m) => (m.guildId === guildId ? { ...m, characterRank: rank } : m)),
        }));
      }),
      catchError((err) => {
        this.#updatingRankCharacterId.set(null);
        this.#updatingRankGuildId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  /** Removes a character from a guild's roster, patching the local cache. */
  leaveGuild(characterId: number, guildId: string): Observable<void> {
    this.#leavingGuildId.set(guildId);
    this.#leavingCharacterId.set(characterId);

    return this.#membershipService.leaveGuild(characterId, guildId).pipe(
      tap(() => {
        this.#leavingGuildId.set(null);
        this.#leavingCharacterId.set(null);
        this.#patchCharacter(characterId, (c) => ({
          ...c,
          guildMemberships: c.guildMemberships.filter((m) => m.guildId !== guildId),
        }));
      }),
      catchError((err) => {
        this.#leavingGuildId.set(null);
        this.#leavingCharacterId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  // ── Eligible guilds (for a single character, shown when offering to join) ──

  readonly #eligibleGuilds = signal<EligibleGuild[] | undefined>(undefined);
  readonly eligibleGuilds = this.#eligibleGuilds.asReadonly();
  readonly isEligibleLoading = computed(() => this.#eligibleGuilds() === undefined);
  readonly eligibleGuildList = computed(() => this.#eligibleGuilds() ?? []);

  /** Fetches the guilds a character is eligible to join. */
  loadEligibleGuilds(characterId: number): void {
    this.#eligibleGuilds.set(undefined);
    this.#membershipService.getEligibleGuilds(characterId).subscribe({
      next: (g) => this.#eligibleGuilds.set(g),
      error: () => this.#eligibleGuilds.set([]),
    });
  }

  clearEligibleGuilds(): void {
    this.#eligibleGuilds.set(undefined);
  }

  // ── Specs (reference data) ──────────────────────────────────────────────────

  /** `undefined` = not yet fetched. Static reference data — fetched once and cached. */
  readonly #specs = signal<Spec[] | undefined>(undefined);

  /** Read-only view of the cached spec reference data. */
  readonly specs = this.#specs.asReadonly();

  /** Fetches all WoW specs on first call; returns the cached list on subsequent calls. */
  loadSpecs(): Observable<Spec[]> {
    const cached = this.#specs();
    if (cached) return of(cached);

    return this.#specService.getAll().pipe(tap((specs) => this.#specs.set(specs)));
  }
}
