import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

const SESSION_KEY = 'raidops_user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly #authService = inject(AuthService);

  readonly #user = signal<User | null>(null);
  readonly user = this.#user.asReadonly();

  readonly isAuthenticated = computed(() => this.#user() !== null);

  #refresh$: Observable<void> | null = null;

  constructor() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        this.#user.set(JSON.parse(stored) as User);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }

  loadUser(): Observable<User> {
    return this.#authService.getMe().pipe(
      tap((user) => {
        this.#user.set(user);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }),
    );
  }

  refresh(): Observable<void> {
    if (this.#refresh$ !== null) return this.#refresh$;

    this.#refresh$ = this.#authService.refresh().pipe(
      tap({
        next: () => {
          this.#refresh$ = null;
        },
        error: () => {
          this.#refresh$ = null;
        },
      }),
      shareReplay(1),
    );

    return this.#refresh$;
  }

  logout(): Observable<void> {
    return this.#authService.logout().pipe(
      tap(() => {
        this.#user.set(null);
        sessionStorage.removeItem(SESSION_KEY);
      }),
    );
  }
}
