import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './core/services/language.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styles: [],
})
export class App {
  constructor() {
    inject(LanguageService);

    const favicon = inject(DOCUMENT).querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = environment.production
        ? 'assets/Logo no background.svg'
        : 'assets/Logo no background DEV.svg';
    }
  }
}
