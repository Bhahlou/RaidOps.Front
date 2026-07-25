import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DiscordChannel } from '../../../shared/models/discord-channel.model';
import { DiscordRole } from '../../../shared/models/discord-role.model';
import { GuildNotificationSetting } from '../models/guild-notification-setting.model';
import { GuildSettings } from '../models/guild-settings.model';
import { OfficerThreshold } from '../models/officer-threshold.model';

@Service()
export class GuildSettingsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the assignable Discord roles for the given guild. */
  getDiscordRoles(guildId: string): Observable<DiscordRole[]> {
    return this.#http.get<DiscordRole[]>(`${this.#api}/guilds/${guildId}/discord-roles`);
  }

  /** Persists the guild settings (timezone, roster mode, allowed roles). */
  updateSettings(guildId: string, settings: GuildSettings): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/settings`, settings);
  }

  /** Persists the guild's Officer access threshold, independently of the rest of guild settings. */
  updateOfficerThreshold(guildId: string, officerThreshold: OfficerThreshold): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/officer-threshold`, officerThreshold);
  }

  /** Fetches the guild's Discord notification settings (one entry per event type). */
  getNotificationSettings(guildId: string): Observable<GuildNotificationSetting[]> {
    return this.#http.get<GuildNotificationSetting[]>(`${this.#api}/guilds/${guildId}/notification-settings`);
  }

  /** Fetches the guild's text-postable Discord channels, for the notification settings channel picker. */
  getNotificationChannels(guildId: string): Observable<DiscordChannel[]> {
    return this.#http.get<DiscordChannel[]>(`${this.#api}/guilds/${guildId}/notification-channels`);
  }

  /** Persists the guild's Discord notification settings in bulk. */
  updateNotificationSettings(guildId: string, settings: GuildNotificationSetting[]): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/notification-settings`, { settings });
  }
}
