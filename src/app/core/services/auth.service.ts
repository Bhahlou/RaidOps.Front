import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

/**
 * Thin HTTP layer for auth-related endpoints.
 * Holds no state — use AuthStore for state management.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Fetches the authenticated user's profile. Requires a valid access_token cookie. */
  getMe(): Observable<User> {
    return this.#http.get<User>(`${this.#api}/api/v1/user/me`);
  }

  /** Exchanges the refresh_token cookie for a new access/refresh token pair. */
  refresh(): Observable<void> {
    return this.#http.post<void>(`${this.#api}/api/v1/discordAuth/refresh`, {});
  }

  /** Clears the access_token and refresh_token cookies server-side. */
  logout(): Observable<void> {
    return this.#http.post<void>(`${this.#api}/api/v1/discordAuth/logout`, {});
  }

  /** Redirects the browser to the Discord OAuth2 sign-up flow. */
  signup(): void {
    globalThis.location.href = `${this.#api}/api/v1/discordAuth/signup`;
  }
}
