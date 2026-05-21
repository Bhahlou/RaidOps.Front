import { Component, inject, signal } from '@angular/core';
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
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    TranslocoPipe,
    DiscordIconComponent,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  readonly #authStore = inject(AuthStore);
  readonly #router = inject(Router);

  readonly user = this.#authStore.user;
  readonly iconType = DiscordIconType.User;

  readonly isExpanded = signal(false);
  readonly isAccountOpen = signal(true);

  /** True when the current route belongs to the guilds area (/guilds or /no-guild). */
  readonly isGuildsActive = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const url = this.#router.url;
        return url.startsWith('/guilds') || url.startsWith('/no-guild');
      }),
    ),
    { initialValue: false },
  );

  toggleAccount(): void {
    this.isAccountOpen.update((v) => !v);
  }
}
