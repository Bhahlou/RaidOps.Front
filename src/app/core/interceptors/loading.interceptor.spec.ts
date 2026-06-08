import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { loadingInterceptor } from './loading.interceptor';
import { LoadingStore } from '../stores/loading.store';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let loadingStore: LoadingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        LoadingStore,
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    loadingStore = TestBed.inject(LoadingStore);
  });

  afterEach(() => controller.verify());

  it('sets isLoading to true during a request and false on completion', () => {
    http.get('/api/test').subscribe();

    expect(loadingStore.isLoading()).toBe(true);

    controller.expectOne('/api/test').flush({});

    expect(loadingStore.isLoading()).toBe(false);
  });

  it('sets isLoading back to false on error', () => {
    http.get('/api/test').subscribe({ error: () => {} });

    expect(loadingStore.isLoading()).toBe(true);

    controller.expectOne('/api/test').flush('', { status: 500, statusText: 'Server Error' });

    expect(loadingStore.isLoading()).toBe(false);
  });

  it('does not increment counter for /assets/ requests', () => {
    http.get('/assets/i18n/fr.json').subscribe();

    expect(loadingStore.isLoading()).toBe(false);

    controller.expectOne('/assets/i18n/fr.json').flush({});

    expect(loadingStore.isLoading()).toBe(false);
  });

  it('tracks multiple concurrent requests correctly', () => {
    http.get('/api/one').subscribe();
    http.get('/api/two').subscribe();

    expect(loadingStore.isLoading()).toBe(true);

    controller.expectOne('/api/one').flush({});
    expect(loadingStore.isLoading()).toBe(true);

    controller.expectOne('/api/two').flush({});
    expect(loadingStore.isLoading()).toBe(false);
  });
});
