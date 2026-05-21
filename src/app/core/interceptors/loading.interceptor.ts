import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingStore } from '../stores/loading.store';

/**
 * Requests that should not trigger the loading bar.
 * Static assets (e.g. i18n files loaded by TranslocoPipe) are excluded because
 * they are triggered during template rendering — writing to a signal at that
 * moment causes NG0600 and breaks the translation pipeline.
 */
const SKIP_URLS = ['/assets/'];

/**
 * Increments the LoadingStore counter when a request starts and
 * decrements it when the request completes (success, error, or cancel).
 * Skips static asset requests to avoid NG0600.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (SKIP_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const loadingStore = inject(LoadingStore);
  loadingStore.increment();
  return next(req).pipe(
    finalize(() => loadingStore.decrement()),
  );
};
