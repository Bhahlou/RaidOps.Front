import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { RaidEventAttributions } from '../models/raid-event-attributions.model';

@Service()
export class RaidAttributionsStore {
  readonly #guildId = signal<string | null>(null);
  readonly #guildBranchId = signal<number | null>(null);
  readonly #eventId = signal<number | null>(null);

  readonly #resource = httpResource<RaidEventAttributions>(() => {
    const guildId = this.#guildId();
    const guildBranchId = this.#guildBranchId();
    const eventId = this.#eventId();
    if (!guildId || guildBranchId == null || eventId == null) return undefined;
    return `${environment.apiUrl}/guilds/${guildId}/branches/${guildBranchId}/raids/events/${eventId}/attributions`;
  });

  readonly data = computed(() => this.#resource.value());
  readonly isLoading = computed(() => this.#resource.isLoading());

  load(guildId: string, guildBranchId: number, eventId: number): void {
    this.#guildId.set(guildId);
    this.#guildBranchId.set(guildBranchId);
    this.#eventId.set(eventId);
  }

  reload(): void {
    this.#resource.reload();
  }
}
