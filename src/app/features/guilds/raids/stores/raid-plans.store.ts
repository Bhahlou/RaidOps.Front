import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { RaidPlan } from '../models/raid-plan.model';
import { RaidPlanPage } from '../models/raid-plan-page.model';

/**
 * Two independent resources — the boss's boards, and the currently selected board's pages.
 * Separate from the pages resource because the board is picked automatically (V1 only ever
 * surfaces one per boss) while the page tab bar reloads independently as pages are added/renamed.
 */
@Service()
export class RaidPlansStore {
  readonly #guildId = signal<string | null>(null);
  readonly #raidBossId = signal<number | null>(null);
  readonly #raidPlanId = signal<number | null>(null);

  readonly #plansResource = httpResource<RaidPlan[]>(() => {
    const guildId = this.#guildId();
    const raidBossId = this.#raidBossId();
    if (!guildId || raidBossId == null) return undefined;
    return { url: `${environment.apiUrl}/guilds/${guildId}/raid-plans`, params: { raidBossId } };
  });

  readonly #pagesResource = httpResource<RaidPlanPage[]>(() => {
    const guildId = this.#guildId();
    const raidPlanId = this.#raidPlanId();
    if (!guildId || raidPlanId == null) return undefined;
    return `${environment.apiUrl}/guilds/${guildId}/raid-plans/${raidPlanId}/pages`;
  });

  readonly plans = computed(() => this.#plansResource.value() ?? []);
  readonly isLoadingPlans = computed(() => this.#plansResource.isLoading());

  readonly pages = computed(() => this.#pagesResource.value() ?? []);
  readonly isLoadingPages = computed(() => this.#pagesResource.isLoading());

  loadPlans(guildId: string, raidBossId: number): void {
    this.#guildId.set(guildId);
    this.#raidBossId.set(raidBossId);
  }

  /** @param raidPlanId The board whose pages should load, or `null` to clear the page list (no board yet). */
  loadPages(raidPlanId: number | null): void {
    this.#raidPlanId.set(raidPlanId);
  }

  reloadPlans(): void {
    this.#plansResource.reload();
  }

  reloadPages(): void {
    this.#pagesResource.reload();
  }
}
