import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateRaidCompositionPreviewPayload,
  RaidCompositionPreview,
  RaidCompositionPreviewSummary,
  UpdateRaidCompositionPreviewSlotPayload,
} from '../models/raid-composition-preview.model';

/** Thin HTTP wrapper over `api/v1/guilds/{guildId}/branches/{guildBranchId}/composition-previews/...`. */
@Service()
export class RaidCompositionPreviewsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string, guildBranchId: number): string {
    return `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/composition-previews`;
  }

  getPreviews(guildId: string, guildBranchId: number): Observable<RaidCompositionPreviewSummary[]> {
    return this.#http.get<RaidCompositionPreviewSummary[]>(this.#base(guildId, guildBranchId));
  }

  getPreview(guildId: string, guildBranchId: number, previewId: number): Observable<RaidCompositionPreview> {
    return this.#http.get<RaidCompositionPreview>(`${this.#base(guildId, guildBranchId)}/${previewId}`);
  }

  createPreview(guildId: string, guildBranchId: number, payload: CreateRaidCompositionPreviewPayload): Observable<{ body: { id: number } }> {
    return this.#http.post<{ body: { id: number } }>(this.#base(guildId, guildBranchId), payload);
  }

  renamePreview(guildId: string, guildBranchId: number, previewId: number, name: string): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/${previewId}`, { name });
  }

  duplicatePreview(guildId: string, guildBranchId: number, previewId: number, newName: string): Observable<{ body: { id: number } }> {
    return this.#http.post<{ body: { id: number } }>(`${this.#base(guildId, guildBranchId)}/${previewId}/duplicate`, { newName });
  }

  deletePreview(guildId: string, guildBranchId: number, previewId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#base(guildId, guildBranchId)}/${previewId}`);
  }

  updateSlot(guildId: string, guildBranchId: number, previewId: number, payload: UpdateRaidCompositionPreviewSlotPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/${previewId}/slots`, payload);
  }
}
