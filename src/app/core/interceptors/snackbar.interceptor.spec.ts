import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { snackbarInterceptor } from './snackbar.interceptor';
import { SnackbarService } from '../services/snackbar.service';

describe('snackbarInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let snackbarError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    snackbarError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([snackbarInterceptor])),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: { error: snackbarError } },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('shows network error snackbar on status 0 (connection failure)', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(snackbarError).toHaveBeenCalledWith('errors.network');
  });

  it('shows server error snackbar on status 500', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 500, statusText: 'Server Error' });

    expect(snackbarError).toHaveBeenCalledWith('errors.server');
  });

  it('shows server error snackbar on status 503', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 503, statusText: 'Service Unavailable' });

    expect(snackbarError).toHaveBeenCalledWith('errors.server');
  });

  it('does not show snackbar on 4xx errors', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 400, statusText: 'Bad Request' });

    expect(snackbarError).not.toHaveBeenCalled();
  });

  it('does not show snackbar on 401', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 401, statusText: 'Unauthorized' });

    expect(snackbarError).not.toHaveBeenCalled();
  });

  it('does not show snackbar for /discordAuth/ URLs', () => {
    http.get('/discordAuth/me').subscribe({ error: () => {} });

    controller.expectOne('/discordAuth/me').flush('', { status: 500, statusText: 'Server Error' });

    expect(snackbarError).not.toHaveBeenCalled();
  });

  it('does not show snackbar for /assets/ URLs', () => {
    http.get('/assets/i18n/fr.json').subscribe({ error: () => {} });

    controller.expectOne('/assets/i18n/fr.json').flush('', { status: 500, statusText: 'Server Error' });

    expect(snackbarError).not.toHaveBeenCalled();
  });

});
