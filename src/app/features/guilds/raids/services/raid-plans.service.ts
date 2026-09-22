import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RaidPlan } from '../models/raid-plan.model';
import { RaidPlanPage } from '../models/raid-plan-page.model';

/** Thin HTTP wrapper over `api/v1/guilds/{guildId}/raid-plans` and its nested pages. */
@Service()
export class RaidPlansService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #plansBase(guildId: string): string {
    return `${this.#api}/guilds/${guildId}/raid-plans`;
  }

  #planBase(guildId: string, raidPlanId: number): string {
    return `${this.#plansBase(guildId)}/${raidPlanId}`;
  }

  /** Returns every strategy board the guild has for one boss. */
  getPlansForBoss(guildId: string, raidBossId: number): Observable<RaidPlan[]> {
    return this.#http.get<RaidPlan[]>(this.#plansBase(guildId), { params: { raidBossId } });
  }

  createPlan(guildId: string, raidBossId: number, name: string): Observable<void> {
    return this.#http.post<void>(this.#plansBase(guildId), { raidBossId, name });
  }

  /** Returns a board's page-tab list (no elements). */
  getPages(guildId: string, raidPlanId: number): Observable<RaidPlanPage[]> {
    return this.#http.get<RaidPlanPage[]>(`${this.#planBase(guildId, raidPlanId)}/pages`);
  }

  createPage(guildId: string, raidPlanId: number, name: string): Observable<void> {
    return this.#http.post<void>(`${this.#planBase(guildId, raidPlanId)}/pages`, { name });
  }

  renamePage(guildId: string, raidPlanId: number, pageId: number, name: string): Observable<void> {
    return this.#http.patch<void>(`${this.#planBase(guildId, raidPlanId)}/pages/${pageId}`, { name });
  }

  deletePage(guildId: string, raidPlanId: number, pageId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#planBase(guildId, raidPlanId)}/pages/${pageId}`);
  }

  /** Sets or clears a page's background image. `backgroundImageKey: null` clears it. */
  setPageBackground(guildId: string, raidPlanId: number, pageId: number, backgroundImageKey: string | null): Observable<void> {
    return this.#http.post<void>(`${this.#planBase(guildId, raidPlanId)}/pages/${pageId}/background`, { backgroundImageKey });
  }
}
