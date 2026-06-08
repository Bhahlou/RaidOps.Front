import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { App } from './app';

const mockEnv = vi.hoisted(() => ({ production: true, apiUrl: '' }));
vi.mock('../environments/environment', () => ({ environment: mockEnv }));

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

  it('sets favicon to production URL when environment.production is true', () => {
    mockEnv.production = true;
    TestBed.createComponent(App);
    expect(faviconEl.getAttribute('href')).toBe('assets/Logo no background.svg');
  });

  it('sets favicon to dev URL when environment.production is false', () => {
    mockEnv.production = false;
    TestBed.createComponent(App);
    expect(faviconEl.getAttribute('href')).toBe('assets/Logo no background DEV.svg');
  });

  it('does not throw when no favicon element exists in the document', () => {
    faviconEl.remove();
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });
});
