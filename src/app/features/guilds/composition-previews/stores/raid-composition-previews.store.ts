import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RaidCompositionPreviewsService } from '../services/raid-composition-previews.service';
import {
  CreateRaidCompositionPreviewPayload,
  RaidCompositionPreview,
  RaidCompositionPreviewSummary,
  UpdateRaidCompositionPreviewSlotPayload,
} from '../models/raid-composition-preview.model';

interface BranchKey {
  guildId: string;
  guildBranchId: number;
}

interface PreviewKey extends BranchKey {
  previewId: number;
}

/**
 * The raid composition previews of a guild branch. Supports two mutually-exclusive loading modes
 * — the list (for the list page) and a single preview (for the composer page) — same
 * "setting one clears the other" shape as `RaidBoardStore`.
 */
@Service()
export class RaidCompositionPreviewsStore {
  readonly #service = inject(RaidCompositionPreviewsService);

  readonly #listKey = signal<BranchKey | null>(null);

  readonly #listResource = httpResource<RaidCompositionPreviewSummary[]>(() => {
    const key = this.#listKey();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/composition-previews`;
  });

  readonly #previewKey = signal<PreviewKey | null>(null);

  readonly #previewResource = httpResource<RaidCompositionPreview>(() => {
    const key = this.#previewKey();
    if (!key) return undefined;
    return `${environment.apiUrl}/guilds/${key.guildId}/branches/${key.guildBranchId}/composition-previews/${key.previewId}`;
  });

  readonly previews = computed(() => this.#listResource.value() ?? []);
  readonly preview = computed(() => this.#previewResource.value() ?? null);
  readonly isLoading = computed(() => this.#listResource.isLoading() || this.#previewResource.isLoading());

  loadList(guildId: string, guildBranchId: number): void {
    this.#previewKey.set(null);
    this.#listKey.set({ guildId, guildBranchId });
  }

  loadPreview(guildId: string, guildBranchId: number, previewId: number): void {
    this.#listKey.set(null);
    this.#previewKey.set({ guildId, guildBranchId, previewId });
  }

  /** Re-fetches whichever of list/single-preview is currently tracked, without changing it. */
  reload(): void {
    if (this.#previewKey()) {
      this.#previewResource.reload();
    } else {
      this.#listResource.reload();
    }
  }

  createPreview(guildId: string, guildBranchId: number, payload: CreateRaidCompositionPreviewPayload): Observable<{ body: { id: number } }> {
    return this.#service.createPreview(guildId, guildBranchId, payload);
  }

  renamePreview(guildId: string, guildBranchId: number, previewId: number, name: string): Observable<void> {
    return this.#service.renamePreview(guildId, guildBranchId, previewId, name);
  }

  duplicatePreview(guildId: string, guildBranchId: number, previewId: number, newName: string): Observable<{ body: { id: number } }> {
    return this.#service.duplicatePreview(guildId, guildBranchId, previewId, newName);
  }

  deletePreview(guildId: string, guildBranchId: number, previewId: number): Observable<void> {
    return this.#service.deletePreview(guildId, guildBranchId, previewId);
  }

  updateSlot(guildId: string, guildBranchId: number, previewId: number, payload: UpdateRaidCompositionPreviewSlotPayload): Observable<void> {
    return this.#service.updateSlot(guildId, guildBranchId, previewId, payload);
  }
}
