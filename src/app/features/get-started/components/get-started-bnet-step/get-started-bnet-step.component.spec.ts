import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { GetStartedBnetStepComponent } from './get-started-bnet-step.component';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { BnetAccount } from '../../../characters/models/bnet-account.model';
import { Character } from '../../../characters/models/character.model';

const mockAccount: BnetAccount = {
  bnetId: '1',
  battleTag: 'Test#0001',
  region: 'eu',
  tokenExpiry: '2026-01-01T00:00:00Z',
};

const mockChar: Character = {
  id: 1, name: 'Char', classId: 1, className: 'Warrior', classColor: '#C69B3A',
  raceId: 1, raceName: 'Human', faction: 'ALLIANCE', branchName: 'Retail',
  realmName: 'Silvermoon', realmSlug: 'silvermoon', level: 80, itemLevel: null,
  avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [], guildMemberships: [],
};

describe('GetStartedBnetStepComponent', () => {
  let component: GetStartedBnetStepComponent;
  let storeMock: {
    isBnetLoading: ReturnType<typeof signal<boolean>>;
    isBnetLinked: ReturnType<typeof signal<boolean>>;
    bnetAccount: ReturnType<typeof signal<BnetAccount | null | undefined>>;
    isCharactersLoading: ReturnType<typeof signal<boolean>>;
    loadCharacters: ReturnType<typeof vi.fn>;
    deactivateCharacter: ReturnType<typeof vi.fn>;
  };
  let snackbarMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogMock: { open: ReturnType<typeof vi.fn> };

  const setup = () => {
    storeMock = {
      isBnetLoading: signal(false),
      isBnetLinked: signal(true),
      bnetAccount: signal(mockAccount),
      isCharactersLoading: signal(false),
      loadCharacters: vi.fn().mockReturnValue(of([])),
      deactivateCharacter: vi.fn().mockReturnValue(of({ message: 'ok' })),
    };
    snackbarMock = { success: vi.fn(), error: vi.fn() };
    dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(undefined)) }) };

    TestBed.configureTestingModule({
      imports: [GetStartedBnetStepComponent],
      providers: [
        { provide: CharacterStore, useValue: storeMock },
        { provide: SnackbarService, useValue: snackbarMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    });
    TestBed.overrideComponent(GetStartedBnetStepComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(GetStartedBnetStepComponent).componentInstance;
  };

  describe('linkBnet', () => {
    it('sets linkingRegion to the chosen region', () => {
      setup();
      component.linkBnet('eu');
      expect(component.linkingRegion()).toBe('eu');
    });
  });

  describe('onSynced', () => {
    it('clears linkingRegion, shows success snackbar and force-reloads characters', () => {
      setup();
      component.linkBnet('eu');
      component.onSynced();

      expect(component.linkingRegion()).toBeNull();
      expect(snackbarMock.success).toHaveBeenCalledWith('characters.bnet.syncSuccess');
      expect(storeMock.loadCharacters).toHaveBeenCalledWith(true);
    });
  });

  describe('onOpenSyncRequested', () => {
    it('sets linkingRegion to the already-linked account region', () => {
      setup();
      component.onOpenSyncRequested();
      expect(component.linkingRegion()).toBe('eu');
    });

    it('sets linkingRegion to null when no account is linked', () => {
      setup();
      storeMock.bnetAccount.set(null);
      component.onOpenSyncRequested();
      expect(component.linkingRegion()).toBeNull();
    });
  });

  describe('onActivateError', () => {
    it('shows an error snackbar', () => {
      setup();
      component.onActivateError();
      expect(snackbarMock.error).toHaveBeenCalledWith('characters.import.importError');
    });
  });

  describe('onActivated', () => {
    it('does nothing when nothing was activated', () => {
      setup();
      component.onActivated({ activated: 0, activatedCharacterIds: [] });
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('reloads characters and opens the raid-specs dialog with the newly activated ones', () => {
      setup();
      const activatedChars = [{ ...mockChar, id: 1 }, { ...mockChar, id: 2 }];
      storeMock.loadCharacters.mockReturnValue(of(activatedChars));
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of({ success: true })) });

      component.onActivated({ activated: 2, activatedCharacterIds: [1, 2] });

      expect(storeMock.loadCharacters).toHaveBeenCalledWith(true);
      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({ data: { characters: activatedChars, mode: 'activate' } }));
      expect(snackbarMock.success).toHaveBeenCalledWith('characters.import.importSuccess');
    });

    it('rolls back activation when the raid-specs dialog is cancelled', () => {
      setup();
      const activatedChars = [{ ...mockChar, id: 1 }, { ...mockChar, id: 2 }];
      storeMock.loadCharacters.mockReturnValue(of(activatedChars));
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(undefined)) });

      component.onActivated({ activated: 2, activatedCharacterIds: [1, 2] });

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.importRolledBack');
      expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(1);
      expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(2);
    });

    it('rolls back activation when raid-specs submission fails', () => {
      setup();
      const activatedChars = [{ ...mockChar, id: 1 }];
      storeMock.loadCharacters.mockReturnValue(of(activatedChars));
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of({ error: true })) });

      component.onActivated({ activated: 1, activatedCharacterIds: [1] });

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.importRolledBack');
      expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(1);
    });
  });
});
