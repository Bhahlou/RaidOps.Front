import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditLogEntry } from '../models/audit-log-entry.model';
import { GuildAuditAction } from '../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../models/guild-audit-category.enum';
import { AuditLogPage } from '../models/audit-log-page.model';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogStore } from './audit-log.store';

const entry = (overrides?: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: 1,
  actorDiscordId: 'actor-1',
  actorUsername: 'Bhahlou',
  actorAvatarHash: null,
  actionType: GuildAuditAction.GuildRegistered,
  category: GuildAuditCategory.Guild,
  variables: null,
  occurredAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('AuditLogStore', () => {
  let store: AuditLogStore;
  let service: { getEntries: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { getEntries: vi.fn().mockReturnValue(of<AuditLogPage>({ entries: [], hasMore: false })) };

    TestBed.configureTestingModule({
      providers: [
        AuditLogStore,
        { provide: AuditLogService, useValue: service },
      ],
    });
    store = TestBed.inject(AuditLogStore);
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it('starts with no entries and hasMore false', () => {
    expect(store.entries()).toEqual([]);
    expect(store.hasMore()).toBe(false);
  });

  it('sets loading to true while the request is in flight, false once resolved', () => {
    const obs = store.load('g1');
    expect(store.loading()).toBe(true);

    obs.subscribe();
    expect(store.loading()).toBe(false);
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('fetches page 1 and replaces entries', () => {
      const page: AuditLogPage = { entries: [entry()], hasMore: true };
      service.getEntries.mockReturnValue(of(page));

      store.load('g1').subscribe();

      expect(service.getEntries).toHaveBeenCalledWith('g1', 1, 25, undefined, undefined);
      expect(store.entries()).toEqual(page.entries);
      expect(store.hasMore()).toBe(true);
    });

    it('passes the actionType filter through', () => {
      store.load('g1', GuildAuditAction.MemberRankUpdated).subscribe();

      expect(service.getEntries).toHaveBeenCalledWith('g1', 1, 25, GuildAuditAction.MemberRankUpdated, undefined);
    });

    it('passes the category filter through', () => {
      store.load('g1', undefined, GuildAuditCategory.Roster).subscribe();

      expect(service.getEntries).toHaveBeenCalledWith('g1', 1, 25, undefined, GuildAuditCategory.Roster);
    });

    it('replaces previous entries rather than appending', () => {
      service.getEntries.mockReturnValue(of({ entries: [entry({ id: 1 })], hasMore: false }));
      store.load('g1').subscribe();

      service.getEntries.mockReturnValue(of({ entries: [entry({ id: 2 })], hasMore: false }));
      store.load('g1').subscribe();

      expect(store.entries()).toEqual([entry({ id: 2 })]);
    });
  });

  // ── loadMore ──────────────────────────────────────────────────────────────

  describe('loadMore', () => {
    it('appends the next page to existing entries', () => {
      service.getEntries.mockReturnValue(of({ entries: [entry({ id: 1 })], hasMore: true }));
      store.load('g1').subscribe();

      service.getEntries.mockReturnValue(of({ entries: [entry({ id: 2 })], hasMore: false }));
      store.loadMore()?.subscribe();

      expect(service.getEntries).toHaveBeenCalledWith('g1', 2, 25, undefined, undefined);
      expect(store.entries()).toEqual([entry({ id: 1 }), entry({ id: 2 })]);
      expect(store.hasMore()).toBe(false);
    });

    it('does nothing when there is no guild loaded yet', () => {
      expect(store.loadMore()).toBeUndefined();
      expect(service.getEntries).not.toHaveBeenCalled();
    });

    it('does nothing when hasMore is false', () => {
      service.getEntries.mockReturnValue(of({ entries: [entry()], hasMore: false }));
      store.load('g1').subscribe();

      expect(store.loadMore()).toBeUndefined();
    });

    it('does nothing when a loadMore request is already in flight', () => {
      service.getEntries.mockReturnValue(of({ entries: [entry()], hasMore: true }));
      store.load('g1').subscribe();

      store.loadMore(); // left unsubscribed — loadingMore stays true
      const second = store.loadMore();

      expect(second).toBeUndefined();
      expect(service.getEntries).toHaveBeenCalledTimes(2); // load + the first loadMore only
    });

    it('sets loadingMore to true while the request is in flight, false once resolved', () => {
      service.getEntries.mockReturnValue(of({ entries: [entry()], hasMore: true }));
      store.load('g1').subscribe();

      const obs = store.loadMore();
      expect(store.loadingMore()).toBe(true);

      obs?.subscribe();
      expect(store.loadingMore()).toBe(false);
    });
  });
});
