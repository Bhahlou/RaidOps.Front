import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../components/discord-icon/discord-icon.component';
import { LangSelectorComponent } from '../../components/lang-selector/lang-selector.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { EnvBrandingService } from '../../../core/services/env-branding.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    TranslocoPipe,
    DiscordIconComponent,
    LangSelectorComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly #authStore = inject(AuthStore);
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  readonly envBranding = inject(EnvBrandingService);
  readonly iconType = DiscordIconType.User;

  readonly isAuthenticated = this.#authStore.isAuthenticated;
  readonly user = this.#authStore.user;

  onLoginClick(): void {
    this.#authService.signup(this.#router.url.startsWith('/get-started') ? 'get-started' : 'home');
  }

  onLogoutClick(): void {
    this.#authStore.logout().subscribe({
      next: () => this.#router.navigate(['/home']),
    });
  }
}
