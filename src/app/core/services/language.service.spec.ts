import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { vi } from 'vitest';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let setActiveLang: ReturnType<typeof vi.fn>;
  let getActiveLang: ReturnType<typeof vi.fn>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslocoService, useValue: { setActiveLang, getActiveLang } },
      ],
    });
    return TestBed.inject(LanguageService);
  };

  beforeEach(() => {
    localStorage.clear();
    setActiveLang = vi.fn();
    getActiveLang = vi.fn().mockReturnValue('fr');
  });

  describe('initialisation', () => {
    it('uses the lang stored in localStorage', () => {
      localStorage.setItem('lang', 'en');

      setup();

      expect(setActiveLang).toHaveBeenCalledWith('en');
    });

    it('uses the lang stored in localStorage (de)', () => {
      localStorage.setItem('lang', 'de');

      setup();

      expect(setActiveLang).toHaveBeenCalledWith('de');
    });

    it('ignores an invalid lang in localStorage and falls back to a supported lang', () => {
      localStorage.setItem('lang', 'zz');

      setup();

      const calledWith: string = setActiveLang.mock.calls[0][0];
      expect(['fr', 'en', 'de']).toContain(calledWith);
    });

    it('uses the browser lang when localStorage is empty and it is supported', () => {
      Object.defineProperty(navigator, 'language', { value: 'de', configurable: true });

      setup();

      expect(setActiveLang).toHaveBeenCalledWith('de');
    });

    it('falls back to en when localStorage is empty and browser lang is unsupported', () => {
      Object.defineProperty(navigator, 'language', { value: 'zh', configurable: true });

      setup();

      expect(setActiveLang).toHaveBeenCalledWith('en');
    });
  });

  describe('setLang', () => {
    it('saves the lang to localStorage and updates the active lang', () => {
      const service = setup();

      service.setLang('de');

      expect(localStorage.getItem('lang')).toBe('de');
      expect(setActiveLang).toHaveBeenLastCalledWith('de');
    });

    it('does nothing for an unsupported lang', () => {
      const service = setup();

      service.setLang('zz');

      expect(localStorage.getItem('lang')).toBeNull();
      // setActiveLang called once by constructor, not again
      expect(setActiveLang).toHaveBeenCalledOnce();
    });
  });

  describe('availableLangs', () => {
    it('returns the three supported languages', () => {
      const service = setup();

      expect(service.availableLangs).toEqual(['fr', 'en', 'de']);
    });
  });

  describe('activeLang', () => {
    it('delegates to TranslocoService.getActiveLang', () => {
      getActiveLang.mockReturnValue('en');
      const service = setup();

      expect(service.activeLang).toBe('en');
    });
  });
});
