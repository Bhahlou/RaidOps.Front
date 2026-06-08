import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../stores/auth.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let refresh: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refresh = vi.fn();
    logout = vi.fn().mockReturnValue(of(undefined));
    navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: { refresh, logout } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds withCredentials to every request', () => {
    http.get('/api/test').subscribe();

    const req = controller.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('retries the request after a successful refresh on 401', () => {
    refresh.mockReturnValue(of(undefined));
    let response: unknown;

    http.get('/api/test').subscribe(r => (response = r));

    controller.expectOne('/api/test').flush('', { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/test').flush({ ok: true });

    expect(refresh).toHaveBeenCalledOnce();
    expect(response).toEqual({ ok: true });
  });

  it('does not retry on 401 for bypass URLs', () => {
    http.get('/discordAuth/refresh').subscribe({ error: () => {} });

    controller.expectOne('/discordAuth/refresh').flush('', { status: 401, statusText: 'Unauthorized' });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not retry on 401 for logout URL', () => {
    http.get('/discordAuth/logout').subscribe({ error: () => {} });

    controller.expectOne('/discordAuth/logout').flush('', { status: 401, statusText: 'Unauthorized' });

    expect(refresh).not.toHaveBeenCalled();
  });

  it('logs out and navigates to /home when refresh fails on 401', () => {
    refresh.mockReturnValue(throwError(() => new Error('refresh failed')));

    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('passes non-401 errors through without calling refresh', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    controller.expectOne('/api/test').flush('', { status: 500, statusText: 'Server Error' });

    expect(refresh).not.toHaveBeenCalled();
  });
});
