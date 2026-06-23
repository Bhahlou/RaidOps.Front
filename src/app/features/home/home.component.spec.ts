import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { HomeComponent } from './home.component';
import { SnackbarService } from '../../core/services/snackbar.service';

describe('HomeComponent', () => {
  let snackbarMock: { error: ReturnType<typeof vi.fn> };
  let routeGet: ReturnType<typeof vi.fn>;

  const setup = (errorParam: string | null = null) => {
    routeGet = vi.fn().mockReturnValue(errorParam);
    snackbarMock = { error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: SnackbarService, useValue: snackbarMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: routeGet } } } },
      ],
    })
      .overrideComponent(HomeComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('exposes 6 feature items', () => {
    const component = setup() as unknown as { features: unknown[] };
    expect(component.features.length).toBe(6);
  });

  describe('ngOnInit', () => {
    it('shows a snackbar when the Discord login was cancelled', () => {
      vi.useFakeTimers();
      setup('access_denied');
      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).toHaveBeenCalledWith('errors.discordLoginCancelled');
      vi.useRealTimers();
    });

    it('does nothing when there is no error param', () => {
      vi.useFakeTimers();
      setup(null);
      vi.advanceTimersByTime(200);
      expect(snackbarMock.error).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
