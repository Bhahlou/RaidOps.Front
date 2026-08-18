import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DiscordChannel } from '../../../shared/models/discord-channel.model';
import { GuildCategories } from '../../../shared/models/discord-category.model';
import { DiscordRole } from '../../../shared/models/discord-role.model';
import { GuildNotificationEventType, GuildNotificationSetting } from '../models/guild-notification-setting.model';
import { GuildSettings } from '../models/guild-settings.model';

@Service()
export class GuildSettingsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the assignable Discord roles for the given guild. */
  getDiscordRoles(guildId: string): Observable<DiscordRole[]> {
    return this.#http.get<DiscordRole[]>(`${this.#api}/guilds/${guildId}/discord-roles`);
  }

  /** Persists the guild-level identity settings (timezone, language). */
  updateSettings(guildId: string, settings: GuildSettings): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/settings`, settings);
  }

  /** Fetches the guild's Discord notification settings (one entry per event type). */
  getNotificationSettings(guildId: string): Observable<GuildNotificationSetting[]> {
    return this.#http.get<GuildNotificationSetting[]>(`${this.#api}/guilds/${guildId}/notification-settings`);
  }

  /** Fetches the guild's text-postable Discord channels, for the notification settings channel picker. */
  getNotificationChannels(guildId: string): Observable<DiscordChannel[]> {
    return this.#http.get<DiscordChannel[]>(`${this.#api}/guilds/${guildId}/notification-channels`);
  }

  /** Fetches the guild's Discord channel categories, for picking where a bot-created channel should be nested. */
  getCategories(guildId: string): Observable<GuildCategories> {
    return this.#http.get<GuildCategories>(`${this.#api}/guilds/${guildId}/categories`);
  }

  /** Persists the guild's Discord notification settings in bulk, scoped to a branch or guild-wide (null). */
  updateNotificationSettings(guildId: string, guildBranchId: number | null, settings: GuildNotificationSetting[]): Observable<void> {
    return this.#http.patch<void>(`${this.#api}/guilds/${guildId}/notification-settings`, { guildBranchId, settings });
  }

  /** Removes the branch's override for one event type, reverting just that setting to the guild-wide fallback. */
  resetNotificationSetting(guildId: string, guildBranchId: number, eventType: GuildNotificationEventType): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/guilds/${guildId}/notification-settings/${guildBranchId}/${eventType}`);
  }
}
