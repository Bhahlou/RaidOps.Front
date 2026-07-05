import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

import { ChangelogComponent } from './changelog.component';
import { ChangelogStore } from './stores/changelog.store';
import { ChangelogEntry, ChangelogEntryType } from './models/changelog-entry.model';

describe('ChangelogComponent', () => {
  let markAllSeen: ReturnType<typeof vi.fn>;
  let isUnseen: ReturnType<typeof vi.fn>;
  let back: ReturnType<typeof vi.fn>;
  let getActiveLang: ReturnType<typeof vi.fn>;

  const entries: ChangelogEntry[] = [
    {
      id: 'entry-1',
      date: new Date('2026-01-15'),
      type: ChangelogEntryType.Feature,
      titleKey: 'title',
      descriptionKey: 'desc',
      manualLink: { category: 'guild', article: 'roster' },
    },
  ];

  const setup = () => {
    markAllSeen = vi.fn();
    isUnseen = vi.fn().mockReturnValue(true);
    back = vi.fn();
    getActiveLang = vi.fn().mockReturnValue('en');

    TestBed.configureTestingModule({
      imports: [ChangelogComponent],
      providers: [
        { provide: ChangelogStore, useValue: { entries, markAllSeen, isUnseen } },
        { provide: Location, useValue: { back } },
        { provide: TranslocoService, useValue: { getActiveLang } },
      ],
    }).overrideComponent(ChangelogComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ChangelogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('marks all entries as seen on construction', () => {
    setup();

    expect(markAllSeen).toHaveBeenCalledOnce();
  });

  // ── entries ───────────────────────────────────────────────────────────────

  describe('entries', () => {
    it('exposes the entries from the store', () => {
      expect(setup().entries).toBe(entries);
    });
  });

  // ── EntryType ─────────────────────────────────────────────────────────────

  describe('EntryType', () => {
    it('exposes the ChangelogEntryType enum for the template', () => {
      expect(setup().EntryType).toBe(ChangelogEntryType);
    });
  });

  // ── goBack ────────────────────────────────────────────────────────────────

  describe('goBack', () => {
    it('delegates to Location.back', () => {
      setup().goBack();

      expect(back).toHaveBeenCalledOnce();
    });
  });

  // ── isUnseen ──────────────────────────────────────────────────────────────

  describe('isUnseen', () => {
    it('delegates to the store using the entry id', () => {
      const component = setup();

      const result = component.isUnseen(entries[0]);

      expect(isUnseen).toHaveBeenCalledWith('entry-1');
      expect(result).toBe(true);
    });
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('formats the date using the active language', () => {
      const component = setup();

      const result = component.formatDate(new Date('2026-01-15'));

      expect(result).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date('2026-01-15')));
    });

    it('uses TranslocoService.getActiveLang for locale formatting', () => {
      const component = setup();
      getActiveLang.mockReturnValue('fr');

      const result = component.formatDate(new Date('2026-01-15'));

      expect(result).toBe(new Intl.DateTimeFormat('fr', { dateStyle: 'long' }).format(new Date('2026-01-15')));
    });
  });
});
