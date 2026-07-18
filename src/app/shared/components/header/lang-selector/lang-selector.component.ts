import { Component, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-lang-selector',
  standalone: true,
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger],
  templateUrl: './lang-selector.component.html',
  styleUrl: './lang-selector.component.scss',
})
export class LangSelectorComponent {
  readonly #langService = inject(LanguageService);

  readonly langLabels: Partial<Record<string, string>> = {
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
  };
  readonly langFlags: Partial<Record<string, string>> = { fr: 'fr', en: 'gb', de: 'de' };

  get activeLang() {
    return this.#langService.activeLang;
  }

  get availableLangs() {
    return this.#langService.availableLangs;
  }

  setLang(lang: string): void {
    this.#langService.setLang(lang);
  }
}
