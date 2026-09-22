import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { RenamePreviewDialogComponent, RenamePreviewDialogData } from './rename-preview-dialog.component';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';

describe('RenamePreviewDialogComponent', () => {
  let store: { renamePreview: ReturnType<typeof vi.fn>; duplicatePreview: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (data: RenamePreviewDialogData) => {
    store = {
      renamePreview: vi.fn().mockReturnValue(of(undefined)),
      duplicatePreview: vi.fn().mockReturnValue(of({ body: { id: 2 } })),
    };
    snackbar = { error: vi.fn() };
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RenamePreviewDialogComponent],
      providers: [
        { provide: RaidCompositionPreviewsStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(RenamePreviewDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RenamePreviewDialogComponent).componentInstance;
  };

  const renameData: RenamePreviewDialogData = { guildId: 'g1', guildBranchId: 7, previewId: 11, mode: 'rename', initialName: 'Old name' };
  const duplicateData: RenamePreviewDialogData = { guildId: 'g1', guildBranchId: 7, previewId: 11, mode: 'duplicate', initialName: 'Old name (copy)' };

  // ── initial state ────────────────────────────────────────────────────────

  it('is not duplicate mode in rename mode', () => {
    expect(setup(renameData).isDuplicate).toBe(false);
  });

  it('prefills the name from initialName', () => {
    expect(setup(renameData).name()).toBe('Old name');
  });

  it('is duplicate mode in duplicate mode', () => {
    expect(setup(duplicateData).isDuplicate).toBe(true);
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false when the name is blank', () => {
      const component = setup(renameData);
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it('is true when there is a non-blank name', () => {
      expect(setup(renameData).canSubmit()).toBe(true);
    });

    it('is false while submitting', () => {
      const component = setup(renameData);
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup(renameData);
      component.name.set('');

      component.submit();

      expect(store.renamePreview).not.toHaveBeenCalled();
    });

    it('renames with the trimmed name in rename mode, then closes with true', () => {
      const component = setup(renameData);
      component.name.set('  New name  ');

      component.submit();

      expect(store.renamePreview).toHaveBeenCalledWith('g1', 7, 11, 'New name');
      expect(store.duplicatePreview).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('duplicates with the trimmed name in duplicate mode, then closes with true', () => {
      const component = setup(duplicateData);
      component.name.set('  Old name (copy)  ');

      component.submit();

      expect(store.duplicatePreview).toHaveBeenCalledWith('g1', 7, 11, 'Old name (copy)');
      expect(store.renamePreview).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('shows a snackbar error and stops submitting on rename failure', () => {
      const component = setup(renameData);
      store.renamePreview.mockReturnValue(throwError(() => new Error('boom')));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('shows a snackbar error on duplicate failure', () => {
      const component = setup(duplicateData);
      store.duplicatePreview.mockReturnValue(throwError(() => new Error('boom')));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes with false', () => {
      const component = setup(renameData);
      component.cancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
