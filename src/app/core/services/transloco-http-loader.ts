import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  readonly #http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.#http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
