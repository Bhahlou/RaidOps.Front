import { TestBed } from '@angular/core/testing';

import { LangSelectorComponent } from './lang-selector.component';
import { LanguageService } from '../../../core/services/language.service';

describe('LangSelectorComponent', () => {
  let setLang: ReturnType<typeof vi.fn>;
  const availableLangs = ['fr', 'en', 'de'];

  const setup = (activeLang = 'fr') => {
    setLang = vi.fn();
    TestBed.configureTestingModule({
      imports: [LangSelectorComponent],
      providers: [
        { provide: LanguageService, useValue: { activeLang, availableLangs, setLang } },
      ],
    })
    .overrideComponent(LangSelectorComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(LangSelectorComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('activeLang delegates to LanguageService', () => {
    expect(setup('en').activeLang).toBe('en');
  });

  it('availableLangs delegates to LanguageService', () => {
    expect(setup().availableLangs).toEqual(['fr', 'en', 'de']);
  });

  it('setLang delegates to LanguageService', () => {
    const component = setup();
    component.setLang('de');
    expect(setLang).toHaveBeenCalledWith('de');
  });
});
