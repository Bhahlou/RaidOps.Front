import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { App } from './app';
import { environment } from '../environments/environment';

const mockTransloco = {
  getActiveLang: () => 'fr',
  setActiveLang: () => {},
  translate: (key: string) => key,
  selectTranslate: (key: string) => of(key),
  langChanges$: of('fr'),
};

describe('App', () => {
  let faviconEl: HTMLLinkElement;

  beforeEach(async () => {
    faviconEl = document.createElement('link');
    faviconEl.rel = 'icon';
    document.head.appendChild(faviconEl);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: TranslocoService, useValue: mockTransloco },
        { provide: DateAdapter, useValue: { setLocale: () => {} } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    faviconEl.remove();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sets favicon to the correct URL for the current environment', () => {
    TestBed.createComponent(App);
    const expected = environment.production
      ? 'assets/Logo no background.svg'
      : 'assets/Logo no background DEV.svg';
    expect(faviconEl.getAttribute('href')).toBe(expected);
  });

  it('does not throw when no favicon element exists in the document', () => {
    faviconEl.remove();
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });
});
