import { feature, improvement, fix, CHANGELOG_ENTRIES, CHANGELOG_EPOCHS, CHANGELOG_GROUPS } from './changelog-entries.data';
import { ChangelogEntryType } from '../models/changelog-entry.model';

describe('feature', () => {
  it('builds a Feature-type entry with the given id, groupId, parsed date, and manualLink', () => {
    const manualLink = { category: 'guild', article: 'roster' };

    const entry = feature('some-id', 'g1', '2026-01-15', 'someKey', manualLink);

    expect(entry).toEqual({
      id: 'some-id',
      groupId: 'g1',
      date: new Date('2026-01-15'),
      type: ChangelogEntryType.Feature,
      titleKey: 'changelog.entries.someKey.title',
      descriptionKey: 'changelog.entries.someKey.description',
      manualLink,
    });
  });

  it('derives titleKey and descriptionKey from the same key', () => {
    const entry = feature('id', 'g1', '2026-01-01', 'roster', { category: 'guild', article: 'roster' });

    expect(entry.titleKey).toBe('changelog.entries.roster.title');
    expect(entry.descriptionKey).toBe('changelog.entries.roster.description');
  });
});

describe('improvement', () => {
  it('builds an Improvement-type entry with the given id, groupId, parsed date, and manualLink', () => {
    const manualLink = { category: 'account', article: 'whats-new' };

    const entry = improvement('some-id', 'g1', '2026-01-15', 'someKey', manualLink);

    expect(entry).toEqual({
      id: 'some-id',
      groupId: 'g1',
      date: new Date('2026-01-15'),
      type: ChangelogEntryType.Improvement,
      titleKey: 'changelog.entries.someKey.title',
      descriptionKey: 'changelog.entries.someKey.description',
      manualLink,
    });
  });

  it('derives titleKey and descriptionKey from the same key', () => {
    const entry = improvement('id', 'g1', '2026-01-01', 'globalCalendar', { category: 'account', article: 'calendar' });

    expect(entry.titleKey).toBe('changelog.entries.globalCalendar.title');
    expect(entry.descriptionKey).toBe('changelog.entries.globalCalendar.description');
  });
});

describe('fix', () => {
  it('builds a Fix-type entry with the given id, groupId, and parsed date, and no manualLink', () => {
    const entry = fix('some-id', 'g1', '2026-01-15', 'someKey');

    expect(entry).toEqual({
      id: 'some-id',
      groupId: 'g1',
      date: new Date('2026-01-15'),
      type: ChangelogEntryType.Fix,
      titleKey: 'changelog.entries.someKey.title',
      descriptionKey: 'changelog.entries.someKey.description',
    });
  });

  it('derives titleKey and descriptionKey from the same key', () => {
    const entry = fix('id', 'g1', '2026-01-01', 'uiRefresh');

    expect(entry.titleKey).toBe('changelog.entries.uiRefresh.title');
    expect(entry.descriptionKey).toBe('changelog.entries.uiRefresh.description');
  });
});

describe('CHANGELOG_EPOCHS', () => {
  it('is not empty and has unique ids', () => {
    expect(CHANGELOG_EPOCHS.length).toBeGreaterThan(0);
    const ids = CHANGELOG_EPOCHS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CHANGELOG_GROUPS', () => {
  it('is not empty and has unique ids', () => {
    expect(CHANGELOG_GROUPS.length).toBeGreaterThan(0);
    const ids = CHANGELOG_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every group references a real epoch', () => {
    const epochIds = new Set(CHANGELOG_EPOCHS.map((e) => e.id));
    for (const group of CHANGELOG_GROUPS) {
      expect(epochIds.has(group.epochId)).toBe(true);
    }
  });
});

describe('CHANGELOG_ENTRIES', () => {
  it('is not empty', () => {
    expect(CHANGELOG_ENTRIES.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = CHANGELOG_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is sorted newest first by date', () => {
    const dates = CHANGELOG_ENTRIES.map((e) => e.date.getTime());
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });

  it('every entry has a valid, non-null date', () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(Number.isNaN(entry.date.getTime())).toBe(false);
    }
  });

  it('every entry references a real group', () => {
    const groupIds = new Set(CHANGELOG_GROUPS.map((g) => g.id));
    for (const entry of CHANGELOG_ENTRIES) {
      expect(groupIds.has(entry.groupId)).toBe(true);
    }
  });
});
