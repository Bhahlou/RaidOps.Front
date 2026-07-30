import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GuildBranch, GuildBranchRosterSettings } from '../models/guild-branch.model';

@Service()
export class GuildBranchesService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches every WoW branch activated on the guild (active and deactivated). */
  getBranches(guildId: string): Observable<GuildBranch[]> {
    return this.#http.get<GuildBranch[]>(`${this.#api}/guilds/${guildId}/branches`);
  }

  /** Activates a WoW branch on the guild, or reactivates a previously deactivated one. */
  activateBranch(guildId: string, branchId: number): Observable<void> {
    return this.#http.post<void>(`${this.#api}/guilds/${guildId}/branches`, { branchId });
  }

  /** Deactivates a guild branch. Never hard-deletes — its role-set configuration is preserved. */
  deactivateBranch(guildId: string, guildBranchId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#api}/guilds/${guildId}/branches/${guildBranchId}`);
  }

  /** Persists the roster/officer role-set configuration for one guild branch. */
  updateRosterSettings(
    guildId: string,
    guildBranchId: number,
    settings: GuildBranchRosterSettings,
  ): Observable<void> {
    return this.#http.patch<void>(
      `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/roster-settings`,
      settings,
    );
  }
}
