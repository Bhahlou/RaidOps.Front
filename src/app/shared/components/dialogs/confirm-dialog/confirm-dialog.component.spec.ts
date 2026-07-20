import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = (data: ConfirmDialogData) => {
    dialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).overrideComponent(ConfirmDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(ConfirmDialogComponent).componentInstance;
  };

  const baseData: ConfirmDialogData = { title: 'title.key', message: 'message.key' };

  it('should create', () => {
    expect(setup(baseData)).toBeTruthy();
  });

  describe('confirmVariant', () => {
    it('is "danger" when danger is undefined (default)', () => {
      expect(setup(baseData).confirmVariant).toBe('danger');
    });

    it('is "danger" when danger is explicitly true', () => {
      expect(setup({ ...baseData, danger: true }).confirmVariant).toBe('danger');
    });

    it('is "primary" only when danger is explicitly false', () => {
      expect(setup({ ...baseData, danger: false }).confirmVariant).toBe('primary');
    });
  });

  describe('confirm', () => {
    it('closes the dialog with true', () => {
      const component = setup(baseData);

      component.confirm();

      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup(baseData);

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
