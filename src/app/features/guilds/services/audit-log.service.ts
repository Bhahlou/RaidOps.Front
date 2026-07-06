import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLogPage } from '../models/audit-log-page.model';
import { GuildAuditAction } from '../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../models/guild-audit-category.enum';

@Service()
export class AuditLogService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches a page of the given guild's audit log, newest-first. */
  getEntries(
    guildId: string,
    page: number,
    pageSize: number,
    actionType?: GuildAuditAction,
    category?: GuildAuditCategory,
  ): Observable<AuditLogPage> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (actionType) {
      params = params.set('actionType', actionType);
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.#http.get<AuditLogPage>(`${this.#api}/guilds/${guildId}/audit-log`, { params });
  }
}
