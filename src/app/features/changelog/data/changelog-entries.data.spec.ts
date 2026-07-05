import { feature, CHANGELOG_ENTRIES } from './changelog-entries.data';
import { ChangelogEntryType } from '../models/changelog-entry.model';

describe('feature', () => {
  it('builds a Feature-type entry with the given id, parsed date, and manualLink', () => {
    const manualLink = { category: 'guild', article: 'roster' };

    const entry = feature('some-id', '2026-01-15', 'someKey', manualLink);

    expect(entry).toEqual({
      id: 'some-id',
      date: new Date('2026-01-15'),
      type: ChangelogEntryType.Feature,
      titleKey: 'changelog.entries.someKey.title',
      descriptionKey: 'changelog.entries.someKey.description',
      manualLink,
    });
  });

  it('derives titleKey and descriptionKey from the same key', () => {
    const entry = feature('id', '2026-01-01', 'roster', { category: 'guild', article: 'roster' });

    expect(entry.titleKey).toBe('changelog.entries.roster.title');
    expect(entry.descriptionKey).toBe('changelog.entries.roster.description');
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
});
