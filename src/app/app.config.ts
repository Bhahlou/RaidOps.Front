import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco, provideTranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/services/transloco-http-loader';
import { LanguageService } from './core/services/language.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { snackbarInterceptor } from './core/interceptors/snackbar.interceptor';

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
      const transloco = inject(TranslocoService);
      return firstValueFrom(transloco.load(transloco.getActiveLang()));
    }),
  ],
};
