import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBarOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    snackBarOpen = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: TranslocoService, useValue: { translate: (key: string) => `[${key}]` } },
      ],
    });

    service = TestBed.inject(SnackbarService);
  });

  it('success opens a snackbar with snack-success panel class and 4s duration', () => {
    service.success('some.key');

    expect(snackBarOpen).toHaveBeenCalledWith('[some.key]', undefined, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-success',
    });
  });

  it('error opens a snackbar with snack-error panel class and 6s duration', () => {
    service.error('errors.server');

    expect(snackBarOpen).toHaveBeenCalledWith('[errors.server]', undefined, {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-error',
    });
  });

  it('info opens a snackbar with snack-info panel class and 4s duration', () => {
    service.info('info.message');

    expect(snackBarOpen).toHaveBeenCalledWith('[info.message]', undefined, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-info',
    });
  });
});
