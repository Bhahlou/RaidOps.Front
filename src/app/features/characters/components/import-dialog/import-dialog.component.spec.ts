import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ImportDialogComponent } from './import-dialog.component';
import { CharacterService } from '../../services/character.service';
import { SyncedCharacter } from '../../models/synced-character.model';

const makeChar = (id: number, overrides: Partial<SyncedCharacter> = {}): SyncedCharacter => ({
  id,
  name: `Char${id}`,
  classId: 1,
  className: 'Warrior',
  classColor: '#C69B3A',
  raceId: 1,
  raceName: 'Human',
  faction: 'ALLIANCE',
  branchName: 'Retail',
  realmName: 'Silvermoon',
  level: 80,
  isActive: false,
  ...overrides,
});

describe('ImportDialogComponent', () => {
  let component: ImportDialogComponent;
  let charService: {
    getSyncedCharacters: ReturnType<typeof vi.fn>;
    activateCharacters: ReturnType<typeof vi.fn>;
  };
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    charService = {
      getSyncedCharacters: vi.fn().mockReturnValue(of([])),
      activateCharacters: vi.fn(),
    };
    mockClose = vi.fn();

    TestBed.configureTestingModule({
      imports: [ImportDialogComponent],
      providers: [
        { provide: CharacterService, useValue: charService },
        { provide: MatDialogRef, useValue: { close: mockClose } },
      ],
    });
    TestBed.overrideComponent(ImportDialogComponent, { set: { template: '', imports: [] } });

    component = TestBed.createComponent(ImportDialogComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('sets loadState to idle and populates characters on success', () => {
      charService.getSyncedCharacters.mockReturnValue(of([makeChar(1)]));
      component.ngOnInit();

      expect(component.characters()).toEqual([makeChar(1)]);
      expect(component.loadState()).toBe('idle');
    });

    it('sets loadState to error on failure', () => {
      charService.getSyncedCharacters.mockReturnValue(throwError(() => new Error('oops')));
      component.ngOnInit();

      expect(component.loadState()).toBe('error');
    });
  });

  describe('branchGroups', () => {
    it('groups characters by branch then realm', () => {
      component.characters.set([
        makeChar(1, { branchName: 'Retail', realmName: 'Silvermoon' }),
        makeChar(2, { branchName: 'Retail', realmName: 'Silvermoon' }),
        makeChar(3, { branchName: 'Classic', realmName: 'Everlook' }),
      ]);

      const groups = component.branchGroups();
      expect(groups).toHaveLength(2);

      const retail = groups.find(g => g.branchName === 'Retail')!;
      expect(retail.realms[0].characters).toHaveLength(2);

      const classic = groups.find(g => g.branchName === 'Classic')!;
      expect(classic.realms[0].realmName).toBe('Everlook');
    });

    it('sorts characters within a realm by level descending', () => {
      component.characters.set([
        makeChar(1, { level: 60 }),
        makeChar(2, { level: 80 }),
        makeChar(3, { level: 70 }),
      ]);

      const chars = component.branchGroups()[0].realms[0].characters;
      expect(chars.map(c => c.level)).toEqual([80, 70, 60]);
    });
  });

  describe('filteredBranchGroups', () => {
    beforeEach(() => {
      component.characters.set([
        makeChar(1, { name: 'Azeriel', branchName: 'Retail', realmName: 'Silvermoon' }),
        makeChar(2, { name: 'Thoradin', branchName: 'Retail', realmName: 'Silvermoon' }),
        makeChar(3, { name: 'Andros', branchName: 'Classic', realmName: 'Everlook' }),
      ]);
    });

    it('returns all groups when query is empty', () => {
      component.searchQuery.set('');
      expect(component.filteredBranchGroups()).toHaveLength(2);
    });

    it('filters characters by name (case-insensitive)', () => {
      component.searchQuery.set('azer');
      const groups = component.filteredBranchGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0].realms[0].characters[0].name).toBe('Azeriel');
    });

    it('excludes realms and branches with no matching characters', () => {
      component.searchQuery.set('xyz');
      expect(component.filteredBranchGroups()).toHaveLength(0);
    });
  });

  describe('selectedCount', () => {
    it('reflects the number of selected ids', () => {
      component.selectedIds.set(new Set([1, 2, 3]));
      expect(component.selectedCount()).toBe(3);
    });
  });

  describe('allAlreadyActive', () => {
    it('is true when all characters are active', () => {
      component.characters.set([makeChar(1, { isActive: true }), makeChar(2, { isActive: true })]);
      expect(component.allAlreadyActive()).toBe(true);
    });

    it('is false when at least one character is inactive', () => {
      component.characters.set([makeChar(1, { isActive: true }), makeChar(2)]);
      expect(component.allAlreadyActive()).toBe(false);
    });

    it('is false when the character list is empty', () => {
      component.characters.set([]);
      expect(component.allAlreadyActive()).toBe(false);
    });
  });

  describe('isSelected', () => {
    it('returns true when the id is in selectedIds', () => {
      component.selectedIds.set(new Set([5]));
      expect(component.isSelected(5)).toBe(true);
    });

    it('returns false when the id is not in selectedIds', () => {
      expect(component.isSelected(99)).toBe(false);
    });
  });

  describe('toggleCharacter', () => {
    it('adds an inactive character to the selection', () => {
      component.toggleCharacter(makeChar(1));
      expect(component.selectedIds().has(1)).toBe(true);
    });

    it('removes a character that is already selected', () => {
      component.selectedIds.set(new Set([1]));
      component.toggleCharacter(makeChar(1));
      expect(component.selectedIds().has(1)).toBe(false);
    });

    it('ignores active characters', () => {
      component.toggleCharacter(makeChar(1, { isActive: true }));
      expect(component.selectedIds().has(1)).toBe(false);
    });
  });

  describe('toggleAllInRealm', () => {
    it('selects all activatable characters in the realm', () => {
      const realm = {
        realmName: 'Silvermoon',
        characters: [makeChar(1), makeChar(2), makeChar(3, { isActive: true })],
      };
      component.toggleAllInRealm(realm);
      expect([...component.selectedIds()].sort()).toEqual([1, 2]);
    });

    it('deselects all when every activatable character is already selected', () => {
      component.selectedIds.set(new Set([1, 2]));
      const realm = { realmName: 'Silvermoon', characters: [makeChar(1), makeChar(2)] };
      component.toggleAllInRealm(realm);
      expect(component.selectedIds().size).toBe(0);
    });
  });

  describe('isRealmAllSelected', () => {
    it('returns true when all activatable characters are selected', () => {
      component.selectedIds.set(new Set([1, 2]));
      expect(component.isRealmAllSelected({ realmName: 'A', characters: [makeChar(1), makeChar(2)] })).toBe(true);
    });

    it('returns false when none are selected', () => {
      expect(component.isRealmAllSelected({ realmName: 'A', characters: [makeChar(1)] })).toBe(false);
    });

    it('returns false when the realm has no activatable characters', () => {
      const realm = { realmName: 'A', characters: [makeChar(1, { isActive: true })] };
      expect(component.isRealmAllSelected(realm)).toBe(false);
    });
  });

  describe('isRealmIndeterminate', () => {
    it('returns true when some but not all activatable chars are selected', () => {
      component.selectedIds.set(new Set([1]));
      expect(component.isRealmIndeterminate({ realmName: 'A', characters: [makeChar(1), makeChar(2)] })).toBe(true);
    });

    it('returns false when all are selected', () => {
      component.selectedIds.set(new Set([1, 2]));
      expect(component.isRealmIndeterminate({ realmName: 'A', characters: [makeChar(1), makeChar(2)] })).toBe(false);
    });

    it('returns false when none are selected', () => {
      expect(component.isRealmIndeterminate({ realmName: 'A', characters: [makeChar(1), makeChar(2)] })).toBe(false);
    });
  });

  describe('isBranchExpanded / toggleBranchPanel', () => {
    it('is expanded by default', () => {
      expect(component.isBranchExpanded('Retail')).toBe(true);
    });

    it('collapses when toggleBranchPanel is called with opened=false', () => {
      component.toggleBranchPanel('Retail', false);
      expect(component.isBranchExpanded('Retail')).toBe(false);
    });

    it('expands again when toggleBranchPanel is called with opened=true', () => {
      component.toggleBranchPanel('Retail', false);
      component.toggleBranchPanel('Retail', true);
      expect(component.isBranchExpanded('Retail')).toBe(true);
    });

    it('always returns true when a search query is active', () => {
      component.toggleBranchPanel('Retail', false);
      component.searchQuery.set('test');
      expect(component.isBranchExpanded('Retail')).toBe(true);
    });

    it('ignores toggle when a search query is active', () => {
      component.searchQuery.set('test');
      component.toggleBranchPanel('Retail', false);
      component.searchQuery.set('');
      // toggle was a no-op, so branch is still expanded
      expect(component.isBranchExpanded('Retail')).toBe(true);
    });
  });

  describe('isRealmExpanded / toggleRealmPanel', () => {
    it('is expanded by default', () => {
      expect(component.isRealmExpanded('Retail', 'Silvermoon')).toBe(true);
    });

    it('collapses when toggleRealmPanel is called with opened=false', () => {
      component.toggleRealmPanel('Retail', 'Silvermoon', false);
      expect(component.isRealmExpanded('Retail', 'Silvermoon')).toBe(false);
    });

    it('expands again when toggleRealmPanel is called with opened=true', () => {
      component.toggleRealmPanel('Retail', 'Silvermoon', false);
      component.toggleRealmPanel('Retail', 'Silvermoon', true);
      expect(component.isRealmExpanded('Retail', 'Silvermoon')).toBe(true);
    });

    it('always returns true when a search query is active', () => {
      component.toggleRealmPanel('Retail', 'Silvermoon', false);
      component.searchQuery.set('test');
      expect(component.isRealmExpanded('Retail', 'Silvermoon')).toBe(true);
    });

    it('ignores toggle when a search query is active', () => {
      component.searchQuery.set('test');
      component.toggleRealmPanel('Retail', 'Silvermoon', false);
      component.searchQuery.set('');
      expect(component.isRealmExpanded('Retail', 'Silvermoon')).toBe(true);
    });
  });

  describe('activate', () => {
    it('does nothing when no characters are selected', () => {
      component.activate();
      expect(charService.activateCharacters).not.toHaveBeenCalled();
    });

    it('calls activateCharacters with selected ids and closes dialog on success', () => {
      component.selectedIds.set(new Set([1, 2]));
      charService.activateCharacters.mockReturnValue(of({ message: 'ok' }));

      component.activate();

      expect(charService.activateCharacters).toHaveBeenCalledWith([1, 2]);
      expect(mockClose).toHaveBeenCalledWith({ activated: 2 });
    });

    it('resets isActivating and closes with error on failure', () => {
      component.selectedIds.set(new Set([1]));
      charService.activateCharacters.mockReturnValue(throwError(() => new Error('fail')));

      component.activate();

      expect(component.isActivating()).toBe(false);
      expect(mockClose).toHaveBeenCalledWith({ error: true });
    });
  });

  describe('openSync', () => {
    it('closes the dialog with openSync: true', () => {
      component.openSync();
      expect(mockClose).toHaveBeenCalledWith({ openSync: true });
    });
  });
});
