import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RaidBuffDefinition } from '../../shared/models/raid-buff-definition.model';

/**
 * The curated raid buff/debuff definitions of one expansion — public reference data read by the
 * admin screen (and, later, by the raid composition preview).
 */
@Service()
export class RaidBuffsStore {
  readonly #expansionId = signal<number | null>(null);

  readonly #definitionsResource = httpResource<RaidBuffDefinition[]>(() => {
    const expansionId = this.#expansionId();
    if (expansionId == null) return undefined;
    return { url: `${environment.apiUrl}/raidbuffs`, params: { expansionId } };
  });

  readonly definitions = computed(() => this.#definitionsResource.value() ?? []);
  readonly isLoading = computed(() => this.#definitionsResource.isLoading());

  /** Points the store at an expansion, loading its definitions. */
  load(expansionId: number): void {
    this.#expansionId.set(expansionId);
  }

  reload(): void {
    this.#definitionsResource.reload();
  }
}
