import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EligibleGuild } from '../models/eligible-guild.model';
import { CharacterRank } from '../models/character-rank.enum';

/** Thin HTTP layer for guild roster membership endpoints. */
@Injectable({ providedIn: 'root' })
export class GuildMembershipService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Returns the guilds the given character is eligible to join. */
  getEligibleGuilds(characterId: number): Observable<EligibleGuild[]> {
    return this.#http.get<EligibleGuild[]>(`${this.#api}/characters/${characterId}/eligible-guilds`);
  }

  /** Adds a character to a guild's roster. */
  joinGuild(characterId: number, guildId: string, characterRank: CharacterRank): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(
      `${this.#api}/characters/${characterId}/memberships/${guildId}`,
      { characterRank },
    );
  }

  /** Updates the raid-composition rank of a character on a guild roster. */
  updateRank(characterId: number, guildId: string, characterRank: CharacterRank): Observable<{ message: string }> {
    return this.#http.patch<{ message: string }>(
      `${this.#api}/characters/${characterId}/memberships/${guildId}`,
      { characterRank },
    );
  }

  /** Removes a character from a guild's roster. */
  leaveGuild(characterId: number, guildId: string): Observable<{ message: string }> {
    return this.#http.delete<{ message: string }>(
      `${this.#api}/characters/${characterId}/memberships/${guildId}`,
    );
  }
}
