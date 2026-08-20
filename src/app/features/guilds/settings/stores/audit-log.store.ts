import { computed, inject, Service, signal } from '@angular/core';
import { tap } from 'rxjs';
import { AuditLogEntry } from '../models/audit-log-entry.model';
import { GuildAuditAction } from '../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../models/guild-audit-category.enum';
import { AuditLogService } from '../services/audit-log.service';

const PAGE_SIZE = 25;

interface AuditLogStoreState {
  guildId: string | null;
  actionType: GuildAuditAction | undefined;
  category: GuildAuditCategory | undefined;
  page: number;
  entries: AuditLogEntry[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
}

const INITIAL_STATE: AuditLogStoreState = {
  guildId: null,
  actionType: undefined,
  category: undefined,
  page: 1,
  entries: [],
  hasMore: false,
  loading: false,
  loadingMore: false,
};

@Service()
export class AuditLogStore {
  readonly #auditLogService = inject(AuditLogService);
  readonly #state = signal<AuditLogStoreState>(INITIAL_STATE);

  readonly entries = computed(() => this.#state().entries);
  readonly hasMore = computed(() => this.#state().hasMore);
  readonly loading = computed(() => this.#state().loading);
  readonly loadingMore = computed(() => this.#state().loadingMore);

  /** Loads the first page for the given guild/filter, replacing any existing entries. */
  load(guildId: string, actionType?: GuildAuditAction, category?: GuildAuditCategory) {
    this.#state.set({ ...INITIAL_STATE, guildId, actionType, category, loading: true });

    return this.#auditLogService.getEntries(guildId, 1, PAGE_SIZE, actionType, category).pipe(
      tap((result) =>
        this.#state.set({
          guildId,
          actionType,
          category,
          page: 1,
          entries: result.entries,
          hasMore: result.hasMore,
          loading: false,
          loadingMore: false,
        }),
      ),
    );
  }

  /** Loads the next page and appends it to the current entries. */
  loadMore() {
    const current = this.#state();
    if (!current.guildId || current.loadingMore || !current.hasMore) return undefined;

    this.#state.set({ ...current, loadingMore: true });
    const nextPage = current.page + 1;

    return this.#auditLogService
      .getEntries(current.guildId, nextPage, PAGE_SIZE, current.actionType, current.category)
      .pipe(
        tap((result) =>
          this.#state.set({
            ...current,
            page: nextPage,
            entries: [...current.entries, ...result.entries],
            hasMore: result.hasMore,
            loadingMore: false,
          }),
        ),
      );
  }
}
