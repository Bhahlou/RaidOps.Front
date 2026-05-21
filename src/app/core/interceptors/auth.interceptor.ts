import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';

/** Endpoints that must never trigger a refresh attempt (avoids infinite loops). */
const BYPASS_URLS = ['/discordAuth/refresh', '/discordAuth/logout'];

/**
 * HTTP interceptor that:
 * 1. Attaches `withCredentials: true` to every request so HttpOnly cookies are sent.
 * 2. On 401 — attempts a silent token refresh, then retries the original request once.
 *    If the refresh also fails, clears auth state and redirects to /home.
 *    Concurrent 401s share a single refresh call via AuthStore.refresh().
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const withCreds = req.clone({ withCredentials: true });

  return next(withCreds).pipe(
    catchError(err => {
      const isUnauthorized = err instanceof HttpErrorResponse && err.status === 401;
      const isBypassUrl = BYPASS_URLS.some(url => req.url.includes(url));

      if (!isUnauthorized || isBypassUrl) {
        return throwError(() => err);
      }

      // Token expired — attempt one silent refresh then retry
      return authStore.refresh().pipe(
        switchMap(() => next(withCreds)),
        catchError(refreshErr => {
          authStore.logout().subscribe();
          router.navigate(['/home']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
