import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { RaidGroupingCharacterDialogComponent, RaidGroupingCharacterDialogData } from './raid-grouping-character-dialog.component';
import { RaidsService } from '../../services/raids.service';
import { RaidEventAssignedCharacter } from '../../models/raid-event-assigned-character.model';

const character = (overrides?: Partial<RaidEventAssignedCharacter>): RaidEventAssignedCharacter => ({
  characterId: 1,
  name: 'Arthas',
  ...overrides,
});

describe('RaidGroupingCharacterDialogComponent', () => {
  let raidsService: { getAssignedCharacters: ReturnType<typeof vi.fn>; announceGrouping: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (characters: RaidEventAssignedCharacter[] = [character()]) => {
    raidsService = {
      getAssignedCharacters: vi.fn().mockReturnValue(of(characters)),
      announceGrouping: vi.fn().mockReturnValue(of(undefined)),
    };
    dialogRef = { close: vi.fn() };

    const data: RaidGroupingCharacterDialogData = { guildId: 'g1', guildBranchId: 7, eventId: 11 };

    TestBed.configureTestingModule({
      imports: [RaidGroupingCharacterDialogComponent],
      providers: [
        { provide: RaidsService, useValue: raidsService },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(RaidGroupingCharacterDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidGroupingCharacterDialogComponent).componentInstance;
  };

  // ── constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads assigned characters and populates characterOptions', () => {
      const component = setup([character({ name: 'Arthas' }), character({ characterId: 2, name: 'Jaina' })]);

      expect(raidsService.getAssignedCharacters).toHaveBeenCalledWith('g1', 7, 11);
      expect(component.characterOptions()).toEqual([
        { value: 'Arthas', label: 'Arthas' },
        { value: 'Jaina', label: 'Jaina' },
      ]);
      expect(component.loadingCharacters()).toBe(false);
    });

    it('clears loadingCharacters when the fetch fails', () => {
      raidsService = {
        getAssignedCharacters: vi.fn().mockReturnValue(throwError(() => new Error('failed'))),
        announceGrouping: vi.fn().mockReturnValue(of(undefined)),
      };
      const data: RaidGroupingCharacterDialogData = { guildId: 'g1', guildBranchId: 7, eventId: 11 };
      dialogRef = { close: vi.fn() };
      TestBed.configureTestingModule({
        imports: [RaidGroupingCharacterDialogComponent],
        providers: [
          { provide: RaidsService, useValue: raidsService },
          { provide: DIALOG_DATA, useValue: data },
          { provide: DialogRef, useValue: dialogRef },
        ],
      }).overrideComponent(RaidGroupingCharacterDialogComponent, { set: { template: '', imports: [] } });

      const component = TestBed.createComponent(RaidGroupingCharacterDialogComponent).componentInstance;

      expect(component.loadingCharacters()).toBe(false);
      expect(component.characterOptions()).toEqual([]);
    });
  });

  // ── canSubmit ─────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false with no character selected', () => {
      const component = setup();
      expect(component.canSubmit()).toBe(false);
    });

    it('is true once a character is selected', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');
      expect(component.canSubmit()).toBe(true);
    });

    it('is false while submitting', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup();

      component.submit();

      expect(raidsService.announceGrouping).not.toHaveBeenCalled();
    });

    it('announces grouping with the selected character name and closes with true on success', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');

      component.submit();

      expect(raidsService.announceGrouping).toHaveBeenCalledWith('g1', 7, 11, 'Arthas');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('sets a character-not-found error key when the backend reports RaidGroupingCharacterNotFound', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingCharacterNotFound' } })),
      );

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(component.errorKey()).toBe('raidBuilder.detail.groupingCharacterNotFound');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('falls back to a generic error key for any other failure', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');
      raidsService.announceGrouping.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'SomethingElse' } })));

      component.submit();

      expect(component.errorKey()).toBe('raidBuilder.detail.groupingFailed');
    });

    it('falls back to a generic error key when the response body has no error field', () => {
      const component = setup();
      component.selectedCharacterName.set('Arthas');
      raidsService.announceGrouping.mockReturnValue(throwError(() => new HttpErrorResponse({ error: null })));

      component.submit();

      expect(component.errorKey()).toBe('raidBuilder.detail.groupingFailed');
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup();

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
