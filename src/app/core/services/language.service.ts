import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const STORAGE_KEY = 'lang';
const AVAILABLE_LANGS = ['fr', 'en', 'de'] as const;
type Lang = (typeof AVAILABLE_LANGS)[number];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly #transloco = inject(TranslocoService);

  constructor() {
    this.#transloco.setActiveLang(this.#resolveInitialLang());
  }

  get activeLang(): Lang {
    return this.#transloco.getActiveLang() as Lang;
  }

  get availableLangs(): readonly string[] {
    return AVAILABLE_LANGS;
  }

  setLang(lang: string): void {
    if (!AVAILABLE_LANGS.includes(lang as Lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    this.#transloco.setActiveLang(lang);
  }

  #resolveInitialLang(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && AVAILABLE_LANGS.includes(saved)) return saved;

    const browser = navigator.language.slice(0, 2) as Lang;
    return AVAILABLE_LANGS.includes(browser) ? browser : 'fr';
  }
}
