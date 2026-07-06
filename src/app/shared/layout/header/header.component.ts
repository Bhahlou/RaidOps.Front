import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../components/discord-icon/discord-icon.component';
import { LangSelectorComponent } from '../../components/lang-selector/lang-selector.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { EnvBrandingService } from '../../../core/services/env-branding.service';
import { ChangelogStore } from '../../../features/changelog/stores/changelog.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RouterModule,
    MatToolbarModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoPipe,
    DiscordIconComponent,
    LangSelectorComponent,
    NotificationBellComponent,
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
  readonly iconType = DiscordIconType.User;

  readonly isAuthenticated = this.#authStore.isAuthenticated;
  readonly user = this.#authStore.user;
  readonly unseenChangelogCount = this.#changelogStore.unseenCount;

  /**
   * The "?", "📣" and roadmap header icons act like a toggle rather than plain navigation:
   * clicking one while already inside its section returns to whatever route was open right
   * before, instead of re-navigating to itself. Tracked from router events rather than browser
   * history so it stays exact even if the user moves around between several manual articles or
   * changelog/roadmap visits.
   */
  #currentUrl = this.#router.url;
  #returnFromManualUrl = '/';
  #returnFromChangelogUrl = '/';
  #returnFromRoadmapUrl = '/';

  constructor() {
    this.#router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const previousUrl = this.#currentUrl;
        this.#currentUrl = e.urlAfterRedirects;
        if (!previousUrl.startsWith('/manual')) this.#returnFromManualUrl = previousUrl;
        if (!previousUrl.startsWith('/changelog')) this.#returnFromChangelogUrl = previousUrl;
        if (!previousUrl.startsWith('/roadmap')) this.#returnFromRoadmapUrl = previousUrl;
      });
  }

  onHelpClick(event: Event): void {
    if (!this.#currentUrl.startsWith('/manual')) return;
    event.preventDefault();
    this.#router.navigateByUrl(this.#returnFromManualUrl);
  }

  onChangelogClick(event: Event): void {
    if (!this.#currentUrl.startsWith('/changelog')) return;
    event.preventDefault();
    this.#router.navigateByUrl(this.#returnFromChangelogUrl);
  }

  onRoadmapClick(event: Event): void {
    if (!this.#currentUrl.startsWith('/roadmap')) return;
    event.preventDefault();
    this.#router.navigateByUrl(this.#returnFromRoadmapUrl);
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
