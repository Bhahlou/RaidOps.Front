import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { GuildMembershipService } from '../services/guild-membership.service';
import { GuildMembership } from '../models/guild-membership.model';
import { EligibleGuild } from '../models/eligible-guild.model';
import { CharacterInGuild } from '../models/character-in-guild.model';
import { CharacterRank } from '../models/character-rank.enum';

/**
 * Signal store for character ↔ guild membership state.
 *
 * Membership list lifecycle:
 *  - `undefined` — not yet fetched / loading
 *  - `T[]`       — fetched (may be empty)
 */
@Injectable({ providedIn: 'root' })
export class GuildMembershipStore {
  readonly #service = inject(GuildMembershipService);

  // ── Character's memberships (character-detail perspective) ────────────────

  readonly #memberships = signal<GuildMembership[] | undefined>(undefined);

  readonly memberships = this.#memberships.asReadonly();
  readonly isMembershipsLoading = computed(() => this.#memberships() === undefined);
  readonly membershipList = computed(() => this.#memberships() ?? []);

  loadMemberships(characterId: number): void {
    this.#memberships.set(undefined);
    this.#service.getCharacterMemberships(characterId).subscribe({
      next: m => this.#memberships.set(m),
      error: () => this.#memberships.set([]),
    });
  }

  // ── Eligible guilds ───────────────────────────────────────────────────────

  readonly #eligibleGuilds = signal<EligibleGuild[] | undefined>(undefined);

  readonly eligibleGuilds = this.#eligibleGuilds.asReadonly();
  readonly isEligibleLoading = computed(() => this.#eligibleGuilds() === undefined);
  readonly eligibleGuildList = computed(() => this.#eligibleGuilds() ?? []);

  loadEligibleGuilds(characterId: number): void {
    this.#eligibleGuilds.set(undefined);
    this.#service.getEligibleGuilds(characterId).subscribe({
      next: g => this.#eligibleGuilds.set(g),
      error: () => this.#eligibleGuilds.set([]),
    });
  }

  clearEligibleGuilds(): void {
    this.#eligibleGuilds.set(undefined);
  }

  // ── My characters in guild (roster perspective) ───────────────────────────

  readonly #currentGuildId = signal<string | null>(null);
  readonly #myCharactersInGuild = signal<CharacterInGuild[] | undefined>(undefined);

  readonly myCharactersInGuild = this.#myCharactersInGuild.asReadonly();
  readonly isMyCharactersLoading = computed(() => this.#myCharactersInGuild() === undefined);
  readonly myCharacterList = computed(() => this.#myCharactersInGuild() ?? []);

  loadMyCharactersInGuild(guildId: string): void {
    this.#currentGuildId.set(guildId);
    this.#myCharactersInGuild.set(undefined);
    this.#service.getMyCharactersInGuild(guildId).subscribe({
      next: chars => this.#myCharactersInGuild.set(chars),
      error: () => this.#myCharactersInGuild.set([]),
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  // joiningGuildId — spinner for character-detail view (which guild is being joined)
  readonly #joiningGuildId = signal<string | null>(null);
  readonly joiningGuildId = this.#joiningGuildId.asReadonly();

  // joiningCharacterId — spinner for roster view (which character is being added)
  readonly #joiningCharacterId = signal<number | null>(null);
  readonly joiningCharacterId = this.#joiningCharacterId.asReadonly();

  // leavingGuildId — spinner for character-detail view
  readonly #leavingGuildId = signal<string | null>(null);
  readonly leavingGuildId = this.#leavingGuildId.asReadonly();

  // leavingCharacterId — spinner for roster view
  readonly #leavingCharacterId = signal<number | null>(null);
  readonly leavingCharacterId = this.#leavingCharacterId.asReadonly();

  // updatingRankCharacterId — spinner for rank change in roster view (one guild, many chars)
  readonly #updatingRankCharacterId = signal<number | null>(null);
  readonly updatingRankCharacterId = this.#updatingRankCharacterId.asReadonly();

  // updatingRankGuildId — spinner for rank change in character-detail view (one char, many guilds)
  readonly #updatingRankGuildId = signal<string | null>(null);
  readonly updatingRankGuildId = this.#updatingRankGuildId.asReadonly();

  joinGuild(characterId: number, guildId: string, rank: CharacterRank): Observable<void> {
    this.#joiningGuildId.set(guildId);
    this.#joiningCharacterId.set(characterId);
    return this.#service.joinGuild(characterId, guildId, rank).pipe(
      tap(() => {
        this.#joiningGuildId.set(null);
        this.#joiningCharacterId.set(null);
        this.loadMemberships(characterId);
        this.#eligibleGuilds.update(g => g?.filter(eg => eg.guildId !== guildId));
        if (this.#currentGuildId() === guildId) {
          this.loadMyCharactersInGuild(guildId);
        }
      }),
      catchError(err => {
        this.#joiningGuildId.set(null);
        this.#joiningCharacterId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  updateRank(characterId: number, guildId: string, rank: CharacterRank): Observable<void> {
    this.#updatingRankCharacterId.set(characterId);
    this.#updatingRankGuildId.set(guildId);
    return this.#service.updateRank(characterId, guildId, rank).pipe(
      tap(() => {
        this.#updatingRankCharacterId.set(null);
        this.#updatingRankGuildId.set(null);
        this.#myCharactersInGuild.update(chars =>
          chars?.map(c => c.characterId === characterId ? { ...c, characterRank: rank } : c)
        );
        this.#memberships.update(m =>
          m?.map(me => me.guildId === guildId ? { ...me, characterRank: rank } : me)
        );
      }),
      catchError(err => {
        this.#updatingRankCharacterId.set(null);
        this.#updatingRankGuildId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }

  /** Removes a character from all in-memory membership caches (called on character deactivation). */
  evictCharacter(characterId: number): void {
    this.#myCharactersInGuild.update(chars => chars?.filter(c => c.characterId !== characterId));
    this.#memberships.set(undefined);
  }

  leaveGuild(characterId: number, guildId: string): Observable<void> {
    this.#leavingGuildId.set(guildId);
    this.#leavingCharacterId.set(characterId);
    return this.#service.leaveGuild(characterId, guildId).pipe(
      tap(() => {
        this.#leavingGuildId.set(null);
        this.#leavingCharacterId.set(null);
        this.#memberships.update(m => m?.filter(me => me.guildId !== guildId));
        this.#myCharactersInGuild.update(chars => chars?.filter(c => c.characterId !== characterId));
      }),
      catchError(err => {
        this.#leavingGuildId.set(null);
        this.#leavingCharacterId.set(null);
        return throwError(() => err);
      }),
      map(() => undefined),
    );
  }
}
