import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { TranslocoService } from '@jsverse/transloco';

import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let overlayCreate: ReturnType<typeof vi.fn>;
  let overlayRef: { attach: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
  let componentRef: { setInput: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    componentRef = { setInput: vi.fn() };
    overlayRef = { attach: vi.fn().mockReturnValue(componentRef), dispose: vi.fn() };
    overlayCreate = vi.fn().mockReturnValue(overlayRef);

    const positionStrategy = {
      global: vi.fn().mockReturnThis(),
      centerHorizontally: vi.fn().mockReturnThis(),
      bottom: vi.fn().mockReturnThis(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Overlay,
          useValue: {
            position: vi.fn().mockReturnValue(positionStrategy),
            create: overlayCreate,
          },
        },
        { provide: TranslocoService, useValue: { translate: (key: string) => `[${key}]` } },
      ],
    });

    service = TestBed.inject(SnackbarService);
  });

  it('success shows a toast with the success variant and a 4s auto-dismiss', () => {
    vi.useFakeTimers();
    service.success('some.key');

    expect(overlayCreate).toHaveBeenCalled();
    expect(overlayRef.attach).toHaveBeenCalled();
    expect(componentRef.setInput).toHaveBeenCalledWith('message', '[some.key]');
    expect(componentRef.setInput).toHaveBeenCalledWith('variant', 'success');

    vi.advanceTimersByTime(4000);
    expect(overlayRef.dispose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('error shows a toast with the error variant and a 6s auto-dismiss', () => {
    vi.useFakeTimers();
    service.error('errors.server');

    expect(componentRef.setInput).toHaveBeenCalledWith('message', '[errors.server]');
    expect(componentRef.setInput).toHaveBeenCalledWith('variant', 'error');

    vi.advanceTimersByTime(6000);
    expect(overlayRef.dispose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('info shows a toast with the info variant and a 4s auto-dismiss', () => {
    vi.useFakeTimers();
    service.info('info.message');

    expect(componentRef.setInput).toHaveBeenCalledWith('message', '[info.message]');
    expect(componentRef.setInput).toHaveBeenCalledWith('variant', 'info');

    vi.advanceTimersByTime(4000);
    expect(overlayRef.dispose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('dismisses any currently-shown toast before showing a new one', () => {
    service.success('first');
    service.error('second');

    expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
    expect(overlayCreate).toHaveBeenCalledTimes(2);
  });
});
