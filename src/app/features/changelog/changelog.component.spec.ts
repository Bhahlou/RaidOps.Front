import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

import { ChangelogComponent } from './changelog.component';
import { ChangelogStore } from './stores/changelog.store';
import { ChangelogEntry, ChangelogEntryType } from './models/changelog-entry.model';

describe('ChangelogComponent', () => {
  let isUnseen: ReturnType<typeof vi.fn>;
  let isEpochUnseen: ReturnType<typeof vi.fn>;
  let isGroupUnseen: ReturnType<typeof vi.fn>;
  let markGroupSeen: ReturnType<typeof vi.fn>;
  let back: ReturnType<typeof vi.fn>;
  let getActiveLang: ReturnType<typeof vi.fn>;

  const featureEntry: ChangelogEntry = {
    id: 'entry-feature',
    groupId: 'g1',
    date: new Date('2026-01-15'),
    type: ChangelogEntryType.Feature,
    titleKey: 'title',
    descriptionKey: 'desc',
    manualLink: { category: 'guild', article: 'roster' },
  };

  const groupedEntries = [
    { epoch: { id: 'e1', labelKey: 'epoch.label' }, groups: [{ group: { id: 'g1', epochId: 'e1', labelKey: 'group.label' }, entries: [featureEntry] }] },
  ];

  const setup = () => {
    isUnseen = vi.fn().mockReturnValue(true);
    isEpochUnseen = vi.fn().mockReturnValue(false);
    isGroupUnseen = vi.fn().mockReturnValue(false);
    markGroupSeen = vi.fn();
    back = vi.fn();
    getActiveLang = vi.fn().mockReturnValue('en');

    TestBed.configureTestingModule({
      imports: [ChangelogComponent],
      providers: [
        { provide: ChangelogStore, useValue: { groupedEntries, isUnseen, isEpochUnseen, isGroupUnseen, markGroupSeen } },
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

  // ── groupedEntries / EntryType ────────────────────────────────────────────

  describe('groupedEntries', () => {
    it('exposes groupedEntries from the store', () => {
      expect(setup().groupedEntries).toBe(groupedEntries);
    });
  });

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

      const result = component.isUnseen(featureEntry);

      expect(isUnseen).toHaveBeenCalledWith('entry-feature');
      expect(result).toBe(true);
    });
  });

  // ── typeLabelKey ──────────────────────────────────────────────────────────

  describe('typeLabelKey', () => {
    it('maps Feature to changelog.type.feature', () => {
      const component = setup();
      expect(component.typeLabelKey({ ...featureEntry, type: ChangelogEntryType.Feature })).toBe('changelog.type.feature');
    });

    it('maps Improvement to changelog.type.improvement', () => {
      const component = setup();
      expect(component.typeLabelKey({ ...featureEntry, type: ChangelogEntryType.Improvement })).toBe('changelog.type.improvement');
    });

    it('maps Fix to changelog.type.fix', () => {
      const component = setup();
      expect(component.typeLabelKey({ ...featureEntry, type: ChangelogEntryType.Fix })).toBe('changelog.type.fix');
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

  // ── epoch expand/collapse ─────────────────────────────────────────────────

  describe('isEpochExpanded', () => {
    it('falls back to the store\'s isEpochUnseen before any explicit toggle', () => {
      const component = setup();
      isEpochUnseen.mockReturnValue(true);

      expect(component.isEpochExpanded('e1')).toBe(true);
      expect(isEpochUnseen).toHaveBeenCalledWith('e1');
    });

    it('reflects an explicit setEpochExpanded(true) regardless of the store default', () => {
      const component = setup();
      isEpochUnseen.mockReturnValue(false);

      component.setEpochExpanded('e1', true);

      expect(component.isEpochExpanded('e1')).toBe(true);
    });

    it('reflects an explicit setEpochExpanded(false) regardless of the store default', () => {
      const component = setup();
      isEpochUnseen.mockReturnValue(true);

      component.setEpochExpanded('e1', false);

      expect(component.isEpochExpanded('e1')).toBe(false);
    });
  });

  describe('setEpochExpanded', () => {
    it('does not mark anything seen — only groups do that', () => {
      const component = setup();

      component.setEpochExpanded('e1', true);

      expect(markGroupSeen).not.toHaveBeenCalled();
    });
  });

  // ── group expand/collapse ─────────────────────────────────────────────────

  describe('isGroupExpanded', () => {
    it('falls back to the store\'s isGroupUnseen before any explicit toggle', () => {
      const component = setup();
      isGroupUnseen.mockReturnValue(true);

      expect(component.isGroupExpanded('g1')).toBe(true);
      expect(isGroupUnseen).toHaveBeenCalledWith('g1');
    });

    it('reflects an explicit setGroupExpanded(true) regardless of the store default', () => {
      const component = setup();
      isGroupUnseen.mockReturnValue(false);

      component.setGroupExpanded('g1', true);

      expect(component.isGroupExpanded('g1')).toBe(true);
    });

    it('reflects an explicit setGroupExpanded(false) regardless of the store default', () => {
      const component = setup();
      isGroupUnseen.mockReturnValue(true);

      component.setGroupExpanded('g1', false);

      expect(component.isGroupExpanded('g1')).toBe(false);
    });
  });

  describe('setGroupExpanded', () => {
    it('marks the group seen when expanding', () => {
      const component = setup();

      component.setGroupExpanded('g1', true);

      expect(markGroupSeen).toHaveBeenCalledWith('g1');
    });

    it('does not mark anything seen when collapsing', () => {
      const component = setup();

      component.setGroupExpanded('g1', false);

      expect(markGroupSeen).not.toHaveBeenCalled();
    });
  });
});
