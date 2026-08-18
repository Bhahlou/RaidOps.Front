import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { provideTransloco, provideTranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { provideServiceWorker } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/services/transloco-http-loader';
import { LanguageService } from './core/services/language.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { snackbarInterceptor } from './core/interceptors/snackbar.interceptor';
import { PwaUpdateService } from './core/services/pwa-update.service';

// Registered under the same 'fr'/'en'/'de' codes Transloco and GuildSettings.language use — lets
// formatDate() render locale-correct weekday/month names anywhere in the app (e.g. auto-generated
// raid channel names) without pulling in a date-formatting library.
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeDe, 'de');
registerLocaleData(localeEn, 'en');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(withInterceptors([snackbarInterceptor, loadingInterceptor, authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['fr', 'en', 'de'],
        defaultLang: 'fr',
        fallbackLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
    }),
    provideTranslocoLoader(TranslocoHttpLoader),
    // Blocks initial render until the active language's translations have loaded — otherwise the
    // first-painted components (header, whatever route was deep-linked into) call translate()
    // before the HTTP fetch resolves and log "Missing translation" for every key they use.
    provideAppInitializer(() => {
      inject(LanguageService); // resolves + sets the active lang (localStorage/browser) synchronously
      inject(PwaUpdateService); // starts listening for service worker version updates
      const transloco = inject(TranslocoService);
      return firstValueFrom(transloco.load(transloco.getActiveLang()));
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
