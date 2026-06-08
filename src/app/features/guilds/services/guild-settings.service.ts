import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DiscordRole } from '../../../shared/models/discord-role.model';
import { GuildSettings } from '../models/guild-settings.model';

@Injectable({ providedIn: 'root' })
export class GuildSettingsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the current settings of the given guild. */
  getSettings(guildId: string): Observable<GuildSettings> {
    return this.#http.get<GuildSettings>(`${this.#api}/guilds/${guildId}/settings`);
  }

  /** Fetches the assignable Discord roles for the given guild. */
  getDiscordRoles(guildId: string): Observable<DiscordRole[]> {
    return this.#http.get<DiscordRole[]>(`${this.#api}/guilds/${guildId}/discord-roles`);
  }

  /** Persists the guild settings (timezone, roster mode, allowed roles). */
  updateSettings(guildId: string, settings: GuildSettings): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/settings`, settings);
  }
}
