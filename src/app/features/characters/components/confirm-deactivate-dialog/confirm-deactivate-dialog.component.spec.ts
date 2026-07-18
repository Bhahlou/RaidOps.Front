import { TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';

import { ConfirmDeactivateDialogComponent } from './confirm-deactivate-dialog.component';

describe('ConfirmDeactivateDialogComponent', () => {
  let component: ConfirmDeactivateDialogComponent;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClose = vi.fn();

    TestBed.configureTestingModule({
      imports: [ConfirmDeactivateDialogComponent],
      providers: [{ provide: DialogRef, useValue: { close: mockClose } }],
    });
    TestBed.overrideComponent(ConfirmDeactivateDialogComponent, { set: { template: '', imports: [] } });

    component = TestBed.createComponent(ConfirmDeactivateDialogComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirm() closes the dialog with true', () => {
    component.confirm();
    expect(mockClose).toHaveBeenCalledWith(true);
  });

  it('cancel() closes the dialog with false', () => {
    component.cancel();
    expect(mockClose).toHaveBeenCalledWith(false);
  });
});
