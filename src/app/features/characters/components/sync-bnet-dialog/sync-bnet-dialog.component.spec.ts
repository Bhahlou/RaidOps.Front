import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { SyncBnetDialogComponent, SyncBnetDialogData } from './sync-bnet-dialog.component';
import { CharacterService } from '../../services/character.service';
import { CharacterStore } from '../../stores/character.store';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';

describe('SyncBnetDialogComponent', () => {
  let fixture: ComponentFixture<SyncBnetDialogComponent>;
  let component: SyncBnetDialogComponent;
  let mockClose: ReturnType<typeof vi.fn>;
  let snackbarMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let storeMock: { bnetAccounts: ReturnType<typeof vi.fn>; loadCharacters: ReturnType<typeof vi.fn> };

  const setup = (data: SyncBnetDialogData) => {
    TestBed.resetTestingModule();
    mockClose = vi.fn();
    snackbarMock = { success: vi.fn(), error: vi.fn() };
    storeMock = {
      bnetAccounts: vi.fn().mockReturnValue([]),
      loadCharacters: vi.fn().mockReturnValue(of([])),
    };

    // Real template (not stripped) — the wrapper's own tests query into the real child panel via
    // viewChild, so TranslocoTestingModule provides a working TranslocoService instead.
    TestBed.configureTestingModule({
      imports: [
        SyncBnetDialogComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
      providers: [
        { provide: WowBrancheService, useValue: { getAll: vi.fn().mockReturnValue(of([])) } },
        { provide: CharacterService, useValue: { syncCharacters: vi.fn() } },
        { provide: CharacterStore, useValue: storeMock },
        { provide: SnackbarService, useValue: snackbarMock },
        { provide: DialogRef, useValue: { close: mockClose } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(SyncBnetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => setup({ region: 'eu' }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the region from DIALOG_DATA to the panel', () => {
    expect(component.panel().region()).toBe('eu');
  });

  it('defaults startInAddAnotherMode to false when data.addingAnother is not set', () => {
    expect(component.startInAddAnotherMode).toBe(false);
  });

  it('sets startInAddAnotherMode to true when data.addingAnother is true', () => {
    setup({ region: 'eu', addingAnother: true });
    expect(component.startInAddAnotherMode).toBe(true);
  });

  describe('onSynced', () => {
    it('shows a success snackbar and closes the dialog with true on a successful sync', () => {
      component.onSynced({ outcome: 'success' });

      expect(snackbarMock.success).toHaveBeenCalledWith('characters.bnet.syncSuccess');
      expect(mockClose).toHaveBeenCalledWith(true);
    });

    it('shows an error snackbar and keeps the dialog open (resets the panel) on accountAlreadyLinked', () => {
      const resetSpy = vi.spyOn(component.panel(), 'reset');

      component.onSynced({ outcome: 'accountAlreadyLinked' });

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.bnet.accounts.accountAlreadyLinked');
      expect(resetSpy).toHaveBeenCalled();
      expect(mockClose).not.toHaveBeenCalled();
    });
  });
});
