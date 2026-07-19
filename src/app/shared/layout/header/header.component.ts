import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { EnvBrandingService } from '../../../core/services/env-branding.service';
import { SidenavService } from '../../../core/services/sidenav.service';
import { ChangelogStore } from '../../../features/changelog/stores/changelog.store';
import { DiscordIconComponent } from '../../components/icons/discord-icon/discord-icon.component';
import { LangSelectorComponent } from '../../components/header/lang-selector/lang-selector.component';
import { NavIconLinkComponent } from '../../components/header/nav-icon-link/nav-icon-link.component';
import { NotificationBellComponent } from '../../components/header/notification-bell/notification-bell.component';
import { IconButtonComponent } from '../../components/buttons/icon-button/icon-button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterModule,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    TranslocoPipe,
    DiscordIconComponent,
    LangSelectorComponent,
    NotificationBellComponent,
    NavIconLinkComponent,
    IconButtonComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly #authStore = inject(AuthStore);
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);
  readonly #changelogStore = inject(ChangelogStore);

  readonly envBranding = inject(EnvBrandingService);
  readonly sidenavService = inject(SidenavService);
  readonly iconType = DiscordIconType.User;

  readonly isAuthenticated = this.#authStore.isAuthenticated;
  readonly user = this.#authStore.user;
  readonly unseenChangelogCount = this.#changelogStore.unseenCount;

  constructor() {
    // The header is rendered on every route, including public ones (e.g. /home) that aren't
    // behind authGuard. Silently exchange a still-valid refresh_token cookie for a session here
    // so returning users are recognized without having to redo the Discord OAuth flow.
    if (!this.isAuthenticated()) {
      this.#authStore.loadUser().pipe(catchError(() => of(null))).subscribe();
    }
  }

  onLoginClick(): void {
    this.#authService.signup(this.#router.url.startsWith('/get-started') ? 'get-started' : 'home');
  }

  onLogoutClick(): void {
    this.#authStore.logout().subscribe({
      next: () => this.#router.navigate(['/home']),
    });
  }
}
