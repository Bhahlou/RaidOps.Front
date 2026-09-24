import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { CreatePreviewDialogComponent, CreatePreviewDialogData } from './create-preview-dialog.component';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';

describe('CreatePreviewDialogComponent', () => {
  let store: { createPreview: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = () => {
    store = { createPreview: vi.fn().mockReturnValue(of({ body: { id: 1 } })) };
    snackbar = { error: vi.fn() };
    dialogRef = { close: vi.fn() };
    const data: CreatePreviewDialogData = { guildId: 'g1', guildBranchId: 7 };

    TestBed.configureTestingModule({
      imports: [CreatePreviewDialogComponent],
      providers: [
        { provide: RaidCompositionPreviewsStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(CreatePreviewDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(CreatePreviewDialogComponent).componentInstance;
  };

  // ── initial state ────────────────────────────────────────────────────────

  it('defaults name to empty and groupCount to 8', () => {
    const component = setup();
    expect(component.name()).toBe('');
    expect(component.groupCount()).toBe(8);
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false when the name is empty', () => {
      const component = setup();
      expect(component.canSubmit()).toBe(false);
    });

    it('is false when the name is only whitespace', () => {
      const component = setup();
      component.name.set('   ');
      expect(component.canSubmit()).toBe(false);
    });

    it.each([0, 9])('is false when groupCount is out of range (%i)', (groupCount) => {
      const component = setup();
      component.name.set('40-man');
      component.groupCount.set(groupCount);
      expect(component.canSubmit()).toBe(false);
    });

    it.each([1, 8])('is true when groupCount is within range (%i)', (groupCount) => {
      const component = setup();
      component.name.set('40-man');
      component.groupCount.set(groupCount);
      expect(component.canSubmit()).toBe(true);
    });

    it('is false while submitting', () => {
      const component = setup();
      component.name.set('40-man');
      component.submitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup();
      component.submit();
      expect(store.createPreview).not.toHaveBeenCalled();
    });

    it('creates the preview with the trimmed name and groupCount, then closes with true', () => {
      const component = setup();
      component.name.set('  40-man target  ');
      component.groupCount.set(8);

      component.submit();

      expect(store.createPreview).toHaveBeenCalledWith('g1', 7, { name: '40-man target', groupCount: 8 });
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('shows a snackbar error and stops submitting on failure', () => {
      const component = setup();
      store.createPreview.mockReturnValue(throwError(() => new Error('boom')));
      component.name.set('40-man');

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes with false', () => {
      const component = setup();
      component.cancel();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
