import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GuildRosterMember } from '../models/guild-roster-member.model';

/** Thin HTTP layer for the guild roster endpoint. */
@Injectable({ providedIn: 'root' })
export class GuildRosterService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Returns every active character on the given guild's roster. */
  getRoster(guildId: string): Observable<GuildRosterMember[]> {
    return this.#http.get<GuildRosterMember[]>(`${this.#api}/guilds/${guildId}/roster`);
  }
}
