import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

/**
 * URLs whose errors should never trigger a snackbar.
 * Auth endpoints are excluded because authInterceptor already handles their UX
 * (redirect to /home on refresh failure, etc.).
 */
const SILENT_URLS = ['/assets/', '/discordAuth/'];

/**
 * Displays a generic error snackbar for unhandled server errors (5xx) and
 * network failures (status 0).
 *
 * Intentionally silent on:
 *  - 4xx: business/validation errors the app handles explicitly per-call
 *  - 401: handled by authInterceptor (silent refresh → redirect)
 *  - Auth endpoints: covered by SILENT_URLS
 */
export const snackbarInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);

  if (SILENT_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        snackbar.error('errors.network');
      } else if (err.status >= 500) {
        snackbar.error('errors.server');
      }
      // 4xx (incl. 401) → let the caller handle
      return throwError(() => err);
    }),
  );
};
