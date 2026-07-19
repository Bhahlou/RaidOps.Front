import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ConfirmUnlinkBnetDialogComponent, ConfirmUnlinkBnetDialogData } from './confirm-unlink-bnet-dialog.component';

describe('ConfirmUnlinkBnetDialogComponent', () => {
  let mockClose: ReturnType<typeof vi.fn>;

  const setup = (data: ConfirmUnlinkBnetDialogData = { battleTag: 'Bhahlou#1234' }) => {
    mockClose = vi.fn();

    TestBed.configureTestingModule({
      imports: [ConfirmUnlinkBnetDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: mockClose } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    TestBed.overrideComponent(ConfirmUnlinkBnetDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(ConfirmUnlinkBnetDialogComponent).componentInstance;
  };

  it('exposes the injected battleTag via data', () => {
    const component = setup({ battleTag: 'Luccia#21993' });
    expect(component.data.battleTag).toBe('Luccia#21993');
  });

  it('closes the dialog with true on confirm', () => {
    const component = setup();
    component.confirm();
    expect(mockClose).toHaveBeenCalledWith(true);
  });

  it('closes the dialog with false on cancel', () => {
    const component = setup();
    component.cancel();
    expect(mockClose).toHaveBeenCalledWith(false);
  });
});
