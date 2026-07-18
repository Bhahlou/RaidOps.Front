import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../core/stores/auth.store';
import { SidenavService } from '../../../core/services/sidenav.service';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { GuildAccessLevel, hasGuildAccess } from '../../../core/models/guild-access-level.enum';
import { UserGuild } from '../../../core/models/user-guild.model';
import { DiscordIconComponent } from '../../components/icons/discord-icon/discord-icon.component';

@Component({
  selector: 'app-sidenav',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, DiscordIconComponent],
  host: { '(document:keydown.escape)': 'sidenavService.close()' },
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  readonly #authStore = inject(AuthStore);
  readonly #router = inject(Router);
  readonly sidenavService = inject(SidenavService);

  readonly user = this.#authStore.user;
  readonly iconTypeUser = DiscordIconType.User;
  readonly iconTypeGuild = DiscordIconType.Guild;

  /** Desktop hover-to-expand — irrelevant on touch, where mouseenter/leave never fire. */
  readonly #hoverExpanded = signal(false);
  /** True when either desktop-hovered or the mobile drawer is open. */
  readonly isExpanded = computed(() => this.#hoverExpanded() || this.sidenavService.isMobileOpen());
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

  onMouseEnter(): void {
    this.#hoverExpanded.set(true);
  }

  onMouseLeave(): void {
    this.#hoverExpanded.set(false);
  }

  /** Delegated from the nav root — closes the mobile drawer when a nav link is followed. */
  onNavClick(event: Event): void {
    if ((event.target as HTMLElement).closest('a.sidenav-item')) {
      this.sidenavService.close();
    }
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

  /** Calendar/roster/loot require Roster-tier access — matches `minAccessLevel` in guilds.routes.ts. */
  hasRosterAccess(guild: UserGuild): boolean {
    return hasGuildAccess(guild.accessLevel, GuildAccessLevel.Roster);
  }
}
