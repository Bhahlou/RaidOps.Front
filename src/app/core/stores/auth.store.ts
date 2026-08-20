import { computed, inject, Service, signal } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { AuthHubService } from '../services/auth-hub.service';
import { AuthService } from '../services/auth.service';
import { ChangelogService } from '../services/changelog.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';

const STORAGE_KEY = 'raidops_user';

@Service()
export class AuthStore {
  readonly #authService = inject(AuthService);
  readonly #authHubService = inject(AuthHubService);
  readonly #notificationService = inject(NotificationService);
  readonly #changelogService = inject(ChangelogService);

  readonly #user = signal<User | null>(null);
  readonly user = this.#user.asReadonly();

  readonly isAuthenticated = computed(() => this.#user() !== null);
  readonly notifications = computed(() => this.#user()?.notifications ?? []);

  #refresh$: Observable<void> | null = null;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.#user.set(JSON.parse(stored) as User);
        this.#authHubService.start(this.#onDiscordDataChanged);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  loadUser(): Observable<User> {
    return this.#authService.getMe().pipe(
      tap((user) => {
        this.#user.set(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        this.#authHubService.start(this.#onDiscordDataChanged);
      }),
    );
  }

  refresh(): Observable<void> {
    if (this.#refresh$ !== null) return this.#refresh$;

    this.#refresh$ = this.#authService.refresh().pipe(
      tap({
        next: () => {
          this.#refresh$ = null;
          // The hub connection may be dead from a previous access_token expiry (its negotiate
          // call isn't covered by authInterceptor's silent refresh) — retry it now that we
          // definitely have a fresh cookie. No-ops if it's already connected.
          this.#authHubService.start(this.#onDiscordDataChanged);
        },
        error: () => {
          this.#refresh$ = null;
        },
      }),
      shareReplay(1),
    );

    return this.#refresh$;
  }

  /**
   * Reacts to a `DiscordDataChanged` push from the auth hub. Always goes through `refresh()`
   * first (not just `loadUser()`): guild eligibility (`UserGuilds`) is a DB snapshot only
   * resynced by `refresh()` (server-side `SyncUserAndGuildsAsync`), whereas `loadUser()` alone
   * just re-reads that same snapshot — it would never notice a guild membership removal (kick),
   * even though it's enough on its own for role/permission changes (those are computed live).
   */
  readonly #onDiscordDataChanged = (): void => {
    this.refresh().subscribe({
      next: () => this.loadUser().subscribe(),
      // refresh_token itself invalid/expired — nothing more to do here, the interceptor will
      // catch it and log the user out on their next API call.
      error: () => {},
    });
  };

  logout(): Observable<void> {
    return this.#authService.logout().pipe(
      tap(() => {
        this.#user.set(null);
        localStorage.removeItem(STORAGE_KEY);
        this.#authHubService.stop();
      }),
    );
  }

  /**
   * Dismisses a notification: persists the dismissal server-side, then optimistically removes
   * it from the cached user so it disappears immediately without a full `/me` refetch.
   */
  dismissNotification(type: NotificationType, guildId: string): Observable<void> {
    return this.#notificationService.dismiss(type, guildId).pipe(
      tap(() => {
        const current = this.#user();
        if (current === null) return;

        const updated: User = {
          ...current,
          notifications: current.notifications.filter(
            (n) => !(n.type === type && n.guildId === guildId),
          ),
        };
        this.#user.set(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }),
    );
  }

  /**
   * Records that the current user has acknowledged the given changelog entries: persists it
   * server-side, then optimistically updates the cached user so the "what's new" badge clears
   * immediately.
   */
  markChangelogSeen(entryIds: string[]): Observable<void> {
    return this.#changelogService.markSeen(entryIds).pipe(
      tap(() => {
        const current = this.#user();
        if (current === null) return;

        const updated: User = {
          ...current,
          seenChangelogEntryIds: [...new Set([...current.seenChangelogEntryIds, ...entryIds])],
        };
        this.#user.set(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }),
    );
  }
}
