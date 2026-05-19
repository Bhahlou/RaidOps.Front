import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../../components/discord-icon/discord-icon.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';
import { LanguageService } from '../../../core/services/language.service';

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

  readonly isProd = false;
  readonly isAuthenticated = signal(false);
  readonly iconType = DiscordIconType.Guild;
  readonly langLabels: Partial<Record<string, string>> = { fr: 'Français', en: 'English' };

  get activeLang() {
    return this.#langService.activeLang;
  }

  get availableLangs() {
    return this.#langService.availableLangs;
  }

  setLang(lang: string): void {
    this.#langService.setLang(lang);
  }

  onLoginClick(): void {}
  onLogoutClick(): void {}
}
