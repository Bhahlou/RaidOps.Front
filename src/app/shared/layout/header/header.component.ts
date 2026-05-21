import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { LanguageService } from '../../../core/services/language.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDivider,
    TranslocoPipe,
    DiscordIconComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly #langService = inject(LanguageService);
  readonly #authStore = inject(AuthStore);
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  readonly isProd = false;
  readonly iconType = DiscordIconType.User;
  readonly langLabels: Partial<Record<string, string>> = { fr: 'Français', en: 'English' };

  readonly isAuthenticated = this.#authStore.isAuthenticated;
  readonly user = this.#authStore.user;

  get activeLang() {
    return this.#langService.activeLang;
  }

  get availableLangs() {
    return this.#langService.availableLangs;
  }

  setLang(lang: string): void {
    this.#langService.setLang(lang);
  }

  onLoginClick(): void {
    this.#authService.signup();
  }

  onLogoutClick(): void {
    this.#authStore.logout().subscribe({
      next: () => this.#router.navigate(['/home']),
    });
  }
}
