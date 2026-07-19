import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CharacterListComponent } from './list.component';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { BnetAccount } from '../../models/bnet-account.model';
import { Character } from '../../models/character.model';

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

describe('CharacterListComponent', () => {
  let component: CharacterListComponent;
  let storeMock: {
    isBnetLoading: ReturnType<typeof signal<boolean>>;
    isBnetLinked: ReturnType<typeof signal<boolean>>;
    bnetAccounts: ReturnType<typeof signal<BnetAccount[] | undefined>>;
    isCharactersLoading: ReturnType<typeof signal<boolean>>;
    characterList: ReturnType<typeof signal<Character[]>>;
    loadCharacters: ReturnType<typeof vi.fn>;
    deactivateCharacter: ReturnType<typeof vi.fn>;
    resyncCharacter: ReturnType<typeof vi.fn>;
  };
  let snackbarMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let routeGet: ReturnType<typeof vi.fn>;

  const setup = (errorParam: string | null = null, accountsToEmit: BnetAccount[] = [mockAccount]) => {
    routeGet = vi.fn().mockReturnValue(errorParam);

    storeMock = {
      isBnetLoading: signal(false),
      isBnetLinked: signal(true),
      bnetAccounts: signal(accountsToEmit),
      isCharactersLoading: signal(false),
      characterList: signal([]),
      loadCharacters: vi.fn().mockReturnValue(of([])),
      deactivateCharacter: vi.fn().mockReturnValue(of({ message: 'ok' })),
      resyncCharacter: vi.fn().mockReturnValue(of(mockChar)),
    };
    snackbarMock = { success: vi.fn(), error: vi.fn() };
    dialogMock = {
      open: vi.fn().mockReturnValue({ closed: of(undefined) }),
    };

    TestBed.configureTestingModule({
      imports: [CharacterListComponent],
      providers: [
        { provide: CharacterStore, useValue: storeMock },
        { provide: SnackbarService, useValue: snackbarMock },
        { provide: Dialog, useValue: dialogMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: routeGet } } } },
      ],
    });
    TestBed.overrideComponent(CharacterListComponent, { set: { template: '', imports: [] } });
    component = TestBed.createComponent(CharacterListComponent).componentInstance;
  };

  describe('ngOnInit', () => {
    it.each([
      ['BnetApiError', 'characters.bnet.linkErrorBnet'],
      ['InvalidState', 'characters.bnet.linkErrorSession'],
      ['StateMismatch', 'characters.bnet.linkErrorSession'],
      ['Unauthorized', 'characters.bnet.linkErrorSession'],
      ['SomethingElse', 'characters.bnet.linkError'],
    ])('shows the matching error snackbar for error=%s', (errorParam, expectedKey) => {
      vi.useFakeTimers();
      setup(errorParam);
      component.ngOnInit();

      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).toHaveBeenCalledWith(expectedKey);
      vi.useRealTimers();
    });

    it('shows no snackbar when error param is absent', () => {
      vi.useFakeTimers();
      setup(null);
      component.ngOnInit();
      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('resyncCharacter', () => {
    it('calls store.resyncCharacter and shows success snackbar', () => {
      setup();
      component.resyncCharacter(1);
      expect(storeMock.resyncCharacter).toHaveBeenCalledWith(1);
      expect(snackbarMock.success).toHaveBeenCalledWith('characters.card.resyncSuccess');
    });

    it('shows error snackbar when store call fails', () => {
      setup();
      storeMock.resyncCharacter.mockReturnValue(throwError(() => new Error('fail')));
      component.resyncCharacter(1);
      expect(snackbarMock.error).toHaveBeenCalledWith('characters.card.resyncError');
    });
  });

  describe('deactivateCharacter', () => {
    it('opens the confirmation dialog', () => {
      setup();
      component.deactivateCharacter(1);
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('calls store.deactivateCharacter when user confirms', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of(true) });
      component.deactivateCharacter(1);
      expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(1);
    });

    it('does not call store.deactivateCharacter when user cancels', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of(false) });
      component.deactivateCharacter(1);
      expect(storeMock.deactivateCharacter).not.toHaveBeenCalled();
    });

    it('shows error snackbar when store call fails after confirmation', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of(true) });
      storeMock.deactivateCharacter.mockReturnValue(throwError(() => new Error('fail')));
      component.deactivateCharacter(1);
      expect(snackbarMock.error).toHaveBeenCalledWith('characters.card.deactivateError');
    });
  });

  describe('openImportDialog', () => {
    it('opens the import dialog', () => {
      setup();
      component.openImportDialog();
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('shows error snackbar when result.error is true', () => {
      setup();
      dialogMock.open.mockReturnValue({
        closed: of({ error: true, activated: 0 }),
      });
      component.openImportDialog();
      expect(snackbarMock.error).toHaveBeenCalledWith('characters.import.importError');
    });

    it('opens sync dialog when result.openSync is true', () => {
      setup();
      // First open returns openSync result; second open (sync dialog) returns undefined
      dialogMock.open
        .mockReturnValueOnce({ closed: of({ openSync: true }) })
        .mockReturnValueOnce({ closed: of(undefined) });
      component.openImportDialog();
      // Sync dialog was opened as a follow-up
      expect(dialogMock.open).toHaveBeenCalledTimes(2);
    });

    it('does nothing when nothing was activated and there is no error', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of({ activated: 0 }) });

      component.openImportDialog();

      expect(snackbarMock.error).not.toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(1);
    });

    describe('after a successful activation', () => {
      const activatedChars: Character[] = [
        { ...mockChar, id: 1 },
        { ...mockChar, id: 2 },
      ];

      it('reloads characters and opens the raid-specs dialog with the newly activated ones', () => {
        setup();
        storeMock.loadCharacters.mockReturnValue(of(activatedChars));
        dialogMock.open
          .mockReturnValueOnce({ closed: of({ activated: 2, activatedCharacterIds: [1, 2] }) })
          .mockReturnValueOnce({ closed: of({ success: true }) });

        component.openImportDialog();

        expect(storeMock.loadCharacters).toHaveBeenCalledWith(true);
        expect(dialogMock.open).toHaveBeenNthCalledWith(2, expect.anything(),
          expect.objectContaining({ data: { characters: activatedChars, mode: 'activate' } }));
      });

      it('shows success once raid specs are confirmed, without reloading again (the store already patched locally)', () => {
        setup();
        storeMock.loadCharacters.mockReturnValue(of(activatedChars));
        dialogMock.open
          .mockReturnValueOnce({ closed: of({ activated: 2, activatedCharacterIds: [1, 2] }) })
          .mockReturnValueOnce({ closed: of({ success: true }) });

        component.openImportDialog();

        expect(snackbarMock.success).toHaveBeenCalledWith('characters.import.importSuccess');
        expect(storeMock.loadCharacters).toHaveBeenCalledTimes(1);
      });

      it('rolls back activation when the raid-specs dialog is cancelled', () => {
        setup();
        storeMock.loadCharacters.mockReturnValue(of(activatedChars));
        dialogMock.open
          .mockReturnValueOnce({ closed: of({ activated: 2, activatedCharacterIds: [1, 2] }) })
          .mockReturnValueOnce({ closed: of(undefined) });

        component.openImportDialog();

        expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.importRolledBack');
        expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(1);
        expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(2);
      });

      it('rolls back activation when raid-specs submission fails', () => {
        setup();
        storeMock.loadCharacters.mockReturnValue(of(activatedChars));
        dialogMock.open
          .mockReturnValueOnce({ closed: of({ activated: 2, activatedCharacterIds: [1, 2] }) })
          .mockReturnValueOnce({ closed: of({ error: true }) });

        component.openImportDialog();

        expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.importRolledBack');
        expect(storeMock.deactivateCharacter).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('editRaidSpecs', () => {
    it('does nothing when the character is not found', () => {
      setup();
      component.editRaidSpecs(999);
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens the raid-specs dialog for the matching character', () => {
      setup();
      storeMock.characterList.set([mockChar]);
      dialogMock.open.mockReturnValue({ closed: of(undefined) });

      component.editRaidSpecs(1);

      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({ data: { characters: [mockChar], mode: 'edit' } }));
    });

    it('shows success when the dialog closes with success, without reloading (the store already patched locally)', () => {
      setup();
      storeMock.characterList.set([mockChar]);
      dialogMock.open.mockReturnValue({ closed: of({ success: true }) });

      component.editRaidSpecs(1);

      expect(snackbarMock.success).toHaveBeenCalledWith('characters.raidSpecs.submitSuccess');
      expect(storeMock.loadCharacters).not.toHaveBeenCalled();
    });

    it('shows error and does not roll back when the dialog closes with error', () => {
      setup();
      storeMock.characterList.set([mockChar]);
      dialogMock.open.mockReturnValue({ closed: of({ error: true }) });

      component.editRaidSpecs(1);

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.submitError');
      expect(storeMock.deactivateCharacter).not.toHaveBeenCalled();
    });

    it('does nothing extra when the dialog is cancelled', () => {
      setup();
      storeMock.characterList.set([mockChar]);
      dialogMock.open.mockReturnValue({ closed: of(undefined) });

      component.editRaidSpecs(1);

      expect(snackbarMock.success).not.toHaveBeenCalled();
      expect(snackbarMock.error).not.toHaveBeenCalled();
      expect(storeMock.deactivateCharacter).not.toHaveBeenCalled();
    });
  });

  describe('linkBnet', () => {
    it('opens the sync dialog with the given region and addingAnother unset', () => {
      setup();
      component.linkBnet('eu');
      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({ data: { region: 'eu', addingAnother: false } }));
    });
  });

  describe('addAnotherAccount', () => {
    it('opens the sync dialog straight into add-another mode', () => {
      setup();
      component.addAnotherAccount('us');
      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({ data: { region: 'us', addingAnother: true } }));
    });
  });

  describe('openSyncDialog', () => {
    it('does nothing when no BNet account is linked (region is undefined)', () => {
      setup(null, []);
      component.openSyncDialog();
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens the sync dialog using the first linked account region', () => {
      setup(null, [mockAccount]);
      component.openSyncDialog();
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('does nothing when bnetAccounts has not loaded yet (undefined)', () => {
      setup(null, []);
      storeMock.bnetAccounts.set(undefined);
      component.openSyncDialog();
      expect(dialogMock.open).not.toHaveBeenCalled();
    });
  });

  // SyncBnetDialogComponent shows its own snackbar and closes with `true` only on a successful
  // sync (see sync-bnet-dialog.component.spec.ts) — list.component's only job on close is to
  // chain into character selection.
  describe('sync dialog result handling', () => {
    it('does nothing when dialog closes without a result (cancelled)', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of(undefined) });
      component.linkBnet('eu');
      expect(dialogMock.open).toHaveBeenCalledTimes(1);
    });

    it('does nothing when dialog closes with false', () => {
      setup();
      dialogMock.open.mockReturnValue({ closed: of(false) });
      component.linkBnet('eu');
      expect(dialogMock.open).toHaveBeenCalledTimes(1);
    });

    it('opens the import dialog when the sync dialog closes with true', () => {
      setup();
      dialogMock.open
        .mockReturnValueOnce({ closed: of(true) }) // sync dialog
        .mockReturnValueOnce({ closed: of(undefined) }); // chained import dialog
      component.linkBnet('eu');
      expect(dialogMock.open).toHaveBeenCalledTimes(2);
    });
  });
});
