import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EnvBrandingService } from './core/services/env-branding.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  constructor() {
    // LanguageService is instantiated by the app initializer in app.config.ts (needs to resolve
    // and load the active language before the first render, not just before this component).
    const favicon = inject(DOCUMENT).querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = inject(EnvBrandingService).logoPath;
    }
  }
}
