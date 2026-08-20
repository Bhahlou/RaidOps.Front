import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ChangelogStore } from './changelog.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { CHANGELOG_ENTRIES, CHANGELOG_EPOCHS, CHANGELOG_GROUPS } from '../data/changelog-entries.data';

interface FakeUser {
  seenChangelogEntryIds: string[];
}

const STORAGE_KEY = 'changelog-seen-entry-ids';

// A group with >= 2 real entries, so "some seen, some not" states are exercisable.
const MULTI_ENTRY_GROUP = CHANGELOG_GROUPS.find(
  (g) => CHANGELOG_ENTRIES.filter((e) => e.groupId === g.id).length >= 2,
)!;
const multiEntryGroupEntryIds = CHANGELOG_ENTRIES.filter((e) => e.groupId === MULTI_ENTRY_GROUP.id).map((e) => e.id);

describe('ChangelogStore', () => {
  // A real signal, not a vi.fn — `#seenEntryIds` reads it inside a `computed()`, which only
  // reacts to genuine Angular signal dependencies, not plain mock function return values.
  let authUser: WritableSignal<FakeUser | null>;
  let isAuthenticated: ReturnType<typeof vi.fn>;
  let markChangelogSeen: ReturnType<typeof vi.fn>;

  const setup = (): ChangelogStore => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { user: authUser, isAuthenticated, markChangelogSeen } },
      ],
    });
    return TestBed.inject(ChangelogStore);
  };

  beforeEach(() => {
    localStorage.clear();
    authUser = signal<FakeUser | null>(null);
    isAuthenticated = vi.fn().mockReturnValue(false);
    markChangelogSeen = vi.fn().mockReturnValue(of(undefined));
  });

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── static data exposure ──────────────────────────────────────────────────

  describe('entries / epochs / groups', () => {
    it('exposes the static data as-is', () => {
      const store = setup();
      expect(store.entries).toBe(CHANGELOG_ENTRIES);
      expect(store.epochs).toBe(CHANGELOG_EPOCHS);
      expect(store.groups).toBe(CHANGELOG_GROUPS);
    });
  });

  // ── groupedEntries ────────────────────────────────────────────────────────

  describe('groupedEntries', () => {
    it('nests groups under their epoch and entries under their group', () => {
      const store = setup();

      for (const groupedEpoch of store.groupedEntries) {
        expect(groupedEpoch.epoch).toBe(CHANGELOG_EPOCHS.find((e) => e.id === groupedEpoch.epoch.id));
        for (const groupedGroup of groupedEpoch.groups) {
          expect(groupedGroup.group.epochId).toBe(groupedEpoch.epoch.id);
          for (const entry of groupedGroup.entries) {
            expect(entry.groupId).toBe(groupedGroup.group.id);
          }
        }
      }
    });

    it('accounts for every entry exactly once across all groups', () => {
      const store = setup();

      const flattened = store.groupedEntries.flatMap((ge) => ge.groups.flatMap((g) => g.entries));
      expect(flattened).toHaveLength(CHANGELOG_ENTRIES.length);
    });
  });

  // ── seen-state source (authenticated vs anonymous) ───────────────────────

  describe('seen-state source', () => {
    it('uses the backend-synced ids when authenticated', () => {
      authUser.set({ seenChangelogEntryIds: multiEntryGroupEntryIds });
      const store = setup();

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(false);
    });

    it('falls back to localStorage when anonymous', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([multiEntryGroupEntryIds[0]]));
      authUser.set(null);
      const store = setup();

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(false);
      expect(store.isUnseen(multiEntryGroupEntryIds[1])).toBe(true);
    });

    it('anonymous fallback is empty when localStorage has nothing stored', () => {
      const store = setup();

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(true);
    });

    it('anonymous fallback is empty when localStorage holds invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json{{{');

      const store = setup();

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(true);
    });
  });

  // ── isUnseen / isGroupUnseen / isEpochUnseen ─────────────────────────────

  describe('isUnseen', () => {
    it('is true for an entry not in the seen set', () => {
      const store = setup();
      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(true);
    });

    it('is false for an entry already seen', () => {
      authUser.set({ seenChangelogEntryIds: [multiEntryGroupEntryIds[0]] });
      const store = setup();

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(false);
    });

    it('stays based on the construction-time snapshot even after a later mark', () => {
      const store = setup();

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);

      expect(store.isUnseen(multiEntryGroupEntryIds[0])).toBe(true);
    });
  });

  describe('isGroupUnseen', () => {
    it('is true when at least one entry in the group is unseen', () => {
      authUser.set({ seenChangelogEntryIds: [multiEntryGroupEntryIds[0]] });
      const store = setup();

      expect(store.isGroupUnseen(MULTI_ENTRY_GROUP.id)).toBe(true);
    });

    it('is false once every entry in the group is seen', () => {
      authUser.set({ seenChangelogEntryIds: multiEntryGroupEntryIds });
      const store = setup();

      expect(store.isGroupUnseen(MULTI_ENTRY_GROUP.id)).toBe(false);
    });
  });

  describe('isEpochUnseen', () => {
    it('is true when at least one of its groups is unseen', () => {
      const store = setup();
      expect(store.isEpochUnseen(MULTI_ENTRY_GROUP.epochId)).toBe(true);
    });

    it('is false once every group under the epoch is fully seen', () => {
      authUser.set({ seenChangelogEntryIds: CHANGELOG_ENTRIES.map((e) => e.id) });
      const store = setup();

      expect(store.isEpochUnseen(MULTI_ENTRY_GROUP.epochId)).toBe(false);
    });
  });

  // ── unseenCount / hasUnseenEntries ────────────────────────────────────────

  describe('unseenCount', () => {
    it('counts groups containing at least one unseen entry', () => {
      authUser.set({ seenChangelogEntryIds: CHANGELOG_ENTRIES.map((e) => e.id) });
      const store = setup();

      expect(store.unseenCount()).toBe(0);
    });

    it('is live — reflects a mark made during this visit, unlike the frozen isUnseen snapshot', () => {
      isAuthenticated.mockReturnValue(true);
      authUser.set({ seenChangelogEntryIds: [] as string[] });
      markChangelogSeen.mockImplementation((ids: string[]) => {
        authUser.set({ seenChangelogEntryIds: ids });
        return of(undefined);
      });
      const store = setup();
      const before = store.unseenCount();

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);

      expect(store.unseenCount()).toBeLessThan(before);
    });
  });

  describe('hasUnseenEntries', () => {
    it('is true when unseenCount is greater than 0', () => {
      expect(setup().hasUnseenEntries()).toBe(true);
    });

    it('is false when every group is fully seen', () => {
      authUser.set({ seenChangelogEntryIds: CHANGELOG_ENTRIES.map((e) => e.id) });
      expect(setup().hasUnseenEntries()).toBe(false);
    });
  });

  // ── markGroupSeen ─────────────────────────────────────────────────────────

  describe('markGroupSeen', () => {
    it('does nothing for a group id with no entries', () => {
      const store = setup();

      store.markGroupSeen('not-a-real-group-id');

      expect(markChangelogSeen).not.toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('when authenticated, delegates to AuthStore.markChangelogSeen with the group entry ids', () => {
      isAuthenticated.mockReturnValue(true);
      authUser.set({ seenChangelogEntryIds: [] as string[] });
      const store = setup();

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);

      expect(markChangelogSeen).toHaveBeenCalledWith(multiEntryGroupEntryIds);
    });

    it('when anonymous, persists the merged set to localStorage', () => {
      const store = setup();

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as string[];
      expect(new Set(stored)).toEqual(new Set(multiEntryGroupEntryIds));
      expect(markChangelogSeen).not.toHaveBeenCalled();
    });

    it('when anonymous, merges with ids already recorded rather than overwriting them', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['some-other-entry-id']));
      const store = setup();

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as string[];
      expect(new Set(stored)).toEqual(new Set(['some-other-entry-id', ...multiEntryGroupEntryIds]));
    });

    it('when anonymous, marking a second group keeps the first group marked seen too', () => {
      const store = setup();
      const otherGroup = CHANGELOG_GROUPS.find((g) => g.id !== MULTI_ENTRY_GROUP.id)!;

      store.markGroupSeen(MULTI_ENTRY_GROUP.id);
      store.markGroupSeen(otherGroup.id);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as string[];
      expect(multiEntryGroupEntryIds.every((id) => stored.includes(id))).toBe(true);
    });
  });
});
