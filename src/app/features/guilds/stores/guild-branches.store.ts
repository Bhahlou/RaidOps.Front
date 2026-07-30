import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GuildBranch } from '../models/guild-branch.model';

@Service()
export class GuildBranchesStore {
  readonly #guildId = signal<string | null>(null);

  readonly #branchesResource = httpResource<GuildBranch[]>(() => {
    const guildId = this.#guildId();
    return guildId ? `${environment.apiUrl}/guilds/${guildId}/branches` : undefined;
  });

  readonly branches = computed(() => this.#branchesResource.value() ?? []);
  readonly isLoading = this.#branchesResource.isLoading;

  load(guildId: string): void {
    if (this.#guildId() === guildId) {
      this.#branchesResource.reload();
    } else {
      this.#guildId.set(guildId);
    }
  }

  /** Re-fetches the branch list after an activate/deactivate/roster-settings mutation. */
  reload(): void {
    this.#branchesResource.reload();
  }
}
