import { Component, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CountBadgeComponent } from '../../badges/count-badge/count-badge.component';
import { TooltipDirective } from '../../../directives/tooltip.directive';

/**
 * Header nav icon that acts like a toggle rather than plain navigation: clicking it while already
 * inside its section returns to whatever route was open right before, instead of re-navigating to
 * itself. Tracked from router events rather than browser history so it stays exact even if the
 * user moves around between several sub-routes of the same section (e.g. manual articles).
 */
@Component({
  selector: 'app-nav-icon-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CountBadgeComponent, TooltipDirective],
  templateUrl: './nav-icon-link.component.html',
  styleUrl: './nav-icon-link.component.scss',
})
export class NavIconLinkComponent {
  readonly route = input.required<string>();
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly badgeCount = input<number | undefined>(undefined);

  readonly #router = inject(Router);

  #currentUrl = this.#router.url;
  #returnUrl = '/';

  constructor() {
    this.#router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const previousUrl = this.#currentUrl;
        this.#currentUrl = e.urlAfterRedirects;
        if (!previousUrl.startsWith(this.route())) this.#returnUrl = previousUrl;
      });
  }

  onClick(event: Event): void {
    if (!this.#currentUrl.startsWith(this.route())) return;
    event.preventDefault();
    this.#router.navigateByUrl(this.#returnUrl);
  }
}
