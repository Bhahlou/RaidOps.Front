import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../core/stores/auth.store';
import { DiscordIconComponent } from '../../components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

@Component({
  selector: 'app-sidenav',
  imports: [RouterLink, RouterLinkActive, MatIconModule, TranslocoPipe, DiscordIconComponent],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  readonly #authStore = inject(AuthStore);
  readonly #router = inject(Router);

  readonly user = this.#authStore.user;
  readonly iconTypeUser = DiscordIconType.User;
  readonly iconTypeGuild = DiscordIconType.Guild;

  readonly isExpanded = signal(false);
  readonly isAccountOpen = signal(true);
  readonly isAuthenticated = computed(() => this.#authStore.isAuthenticated());

  readonly #routeUrl = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.#router.url),
    ),
    { initialValue: this.#router.url },
  );

  readonly isGuildsActive = computed(() => {
    const url = this.#routeUrl();
    return url.startsWith('/guilds') || url.startsWith('/no-guild');
  });

  readonly #currentGuildId = computed(() => {
    const match = /^\/guilds\/([^/]+)/.exec(this.#routeUrl());
    return match ? match[1] : null;
  });

  /** Guilds fully registered and configured — shown in the sidenav. */
  readonly registeredGuilds = computed(
    () => this.user()?.guilds.filter((g) => g.isRegistered && g.isConfigured) ?? [],
  );

  /** IDs of guild sections currently open (multiple allowed). */
  readonly openGuildIds = signal<Set<string>>(new Set());

  constructor() {
    // Auto-open the guild section when navigating into a guild route.
    effect(() => {
      const id = this.#currentGuildId();
      if (id) this.openGuildIds.update((s) => new Set([...s, id]));
    });
  }

  toggleAccount(): void {
    this.isAccountOpen.update((v) => !v);
  }

  toggleGuild(id: string): void {
    this.openGuildIds.update((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
}
