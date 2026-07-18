import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ConfirmKickDialogComponent, ConfirmKickDialogData } from './confirm-kick-dialog.component';

describe('ConfirmKickDialogComponent', () => {
  let component: ConfirmKickDialogComponent;
  let mockClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClose = vi.fn();
    const data: ConfirmKickDialogData = { characterName: 'Arthas' };

    TestBed.configureTestingModule({
      imports: [ConfirmKickDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: mockClose } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    TestBed.overrideComponent(ConfirmKickDialogComponent, { set: { template: '', imports: [] } });

    component = TestBed.createComponent(ConfirmKickDialogComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected dialog data', () => {
    expect(component.data.characterName).toBe('Arthas');
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
