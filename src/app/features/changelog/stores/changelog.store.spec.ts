import { TestBed } from '@angular/core/testing';

import { ChangelogStore } from './changelog.store';
import { CHANGELOG_ENTRIES } from '../data/changelog-entries.data';

const STORAGE_KEY = 'changelog-last-seen';

describe('ChangelogStore', () => {
  afterEach(() => localStorage.clear());

  const setup = (): ChangelogStore => {
    TestBed.configureTestingModule({});
    return TestBed.inject(ChangelogStore);
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── entries ───────────────────────────────────────────────────────────────

  describe('entries', () => {
    it('exposes the static CHANGELOG_ENTRIES data', () => {
      expect(setup().entries).toBe(CHANGELOG_ENTRIES);
    });
  });

  // ── unseenCount ───────────────────────────────────────────────────────────

  describe('unseenCount', () => {
    it('equals the full entry count when nothing has been seen yet', () => {
      expect(setup().unseenCount()).toBe(CHANGELOG_ENTRIES.length);
    });

    it('is 0 once the latest entry id is stored as last-seen', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[0].id);

      expect(setup().unseenCount()).toBe(0);
    });

    it('counts only entries newer than the stored last-seen id', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[2].id);

      expect(setup().unseenCount()).toBe(2);
    });

    it('falls back to the full entry count when the stored id no longer exists', () => {
      localStorage.setItem(STORAGE_KEY, 'some-removed-entry-id');

      expect(setup().unseenCount()).toBe(CHANGELOG_ENTRIES.length);
    });
  });

  // ── hasUnseenEntries ──────────────────────────────────────────────────────

  describe('hasUnseenEntries', () => {
    it('is true when there is at least one unseen entry', () => {
      expect(setup().hasUnseenEntries()).toBe(true);
    });

    it('is false once everything has been seen', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[0].id);

      expect(setup().hasUnseenEntries()).toBe(false);
    });
  });

  // ── markAllSeen ───────────────────────────────────────────────────────────

  describe('markAllSeen', () => {
    it('stores the latest entry id in localStorage', () => {
      setup().markAllSeen();

      expect(localStorage.getItem(STORAGE_KEY)).toBe(CHANGELOG_ENTRIES[0].id);
    });

    it('brings unseenCount down to 0', () => {
      const store = setup();

      store.markAllSeen();

      expect(store.unseenCount()).toBe(0);
    });

    it('does not touch localStorage when there are no entries at all', () => {
      const store = setup();
      Object.defineProperty(store, 'entries', { value: [] });

      store.markAllSeen();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  // ── lastSeenIdSnapshot ────────────────────────────────────────────────────

  describe('lastSeenIdSnapshot', () => {
    it('captures the last-seen id as it was before markAllSeen runs', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[2].id);
      const store = setup();

      store.markAllSeen();

      expect(store.lastSeenIdSnapshot).toBe(CHANGELOG_ENTRIES[2].id);
    });

    it('is null when nothing had been seen before construction', () => {
      expect(setup().lastSeenIdSnapshot).toBeNull();
    });
  });

  // ── isUnseen ──────────────────────────────────────────────────────────────

  describe('isUnseen', () => {
    it('is true for an entry strictly newer than the snapshot', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[2].id);
      const store = setup();

      expect(store.isUnseen(CHANGELOG_ENTRIES[0].id)).toBe(true);
      expect(store.isUnseen(CHANGELOG_ENTRIES[1].id)).toBe(true);
    });

    it('is false for the snapshot entry itself and anything older', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[2].id);
      const store = setup();

      expect(store.isUnseen(CHANGELOG_ENTRIES[2].id)).toBe(false);
      expect(store.isUnseen(CHANGELOG_ENTRIES[3].id)).toBe(false);
    });

    it('is false for an id that does not exist in entries', () => {
      expect(setup().isUnseen('not-a-real-id')).toBe(false);
    });

    it('stays based on the construction-time snapshot even after markAllSeen', () => {
      localStorage.setItem(STORAGE_KEY, CHANGELOG_ENTRIES[2].id);
      const store = setup();

      store.markAllSeen();

      expect(store.isUnseen(CHANGELOG_ENTRIES[0].id)).toBe(true);
    });
  });
});
