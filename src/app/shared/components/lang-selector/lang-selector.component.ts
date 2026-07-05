import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-lang-selector',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule],
  templateUrl: './lang-selector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
