import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { App } from './app';
import { EnvBrandingService } from './core/services/env-branding.service';

const mockTransloco = {
  getActiveLang: () => 'fr',
  setActiveLang: () => {},
  translate: (key: string) => key,
  selectTranslate: (key: string) => of(key),
  langChanges$: of('fr'),
};

describe('App', () => {
  let faviconEl: HTMLLinkElement;
  let manifestEl: HTMLLinkElement;
  let themeColorEl: HTMLMetaElement;
  let mql: { matches: boolean; addEventListener: ReturnType<typeof vi.fn> };
  let mqlChangeListener: (() => void) | undefined;
  let mockBranding: { logoPath: string; manifestPath: string; badgeLabel: string | null; accentColor: string | null };

  beforeEach(async () => {
    faviconEl = document.createElement('link');
    faviconEl.rel = 'icon';
    document.head.appendChild(faviconEl);

    manifestEl = document.createElement('link');
    manifestEl.rel = 'manifest';
    document.head.appendChild(manifestEl);

    themeColorEl = document.createElement('meta');
    themeColorEl.name = 'theme-color';
    document.head.appendChild(themeColorEl);

    mqlChangeListener = undefined;
    mql = {
      matches: false,
      addEventListener: vi.fn((_event: string, cb: () => void) => {
        mqlChangeListener = cb;
      }),
    };
    // jsdom doesn't implement matchMedia at all, so there's nothing to vi.spyOn — assign it directly.
    window.matchMedia = vi.fn().mockReturnValue(mql) as typeof window.matchMedia;

    // Explicit mock rather than the real EnvBrandingService: its values come from `environment.ts`,
    // which is ambient/shared state — reading "whatever it currently resolves to" made these tests
    // pass locally but non-deterministically miss branches (e.g. the accentColor ?? fallback) when
    // run alongside the full suite under the non-isolated Vitest runner, depending on file order.
    mockBranding = {
      logoPath: 'assets/fake-logo.svg',
      manifestPath: 'fake-manifest.webmanifest',
      badgeLabel: null,
      accentColor: null,
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: TranslocoService, useValue: mockTransloco },
        { provide: EnvBrandingService, useValue: mockBranding },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    faviconEl.remove();
    manifestEl.remove();
    themeColorEl.remove();
    // @ts-expect-error -- undoing the direct assignment above, since jsdom has no real matchMedia to restore to.
    delete window.matchMedia;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sets favicon to the branding logo path', () => {
    TestBed.createComponent(App);
    expect(faviconEl.getAttribute('href')).toBe(mockBranding.logoPath);
  });

  it('does not throw when no favicon element exists in the document', () => {
    faviconEl.remove();
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });

  it('sets the manifest href to the branding manifest path', () => {
    TestBed.createComponent(App);
    expect(manifestEl.getAttribute('href')).toBe(mockBranding.manifestPath);
  });

  it('does not throw when no manifest element exists in the document', () => {
    manifestEl.remove();
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });

  it('falls back to the default gold accent when branding has no accent color', () => {
    mockBranding.accentColor = null;
    TestBed.createComponent(App);
    expect(themeColorEl.getAttribute('content')).toBe('#ffb74d');
  });

  it('uses the branding accent color in a normal browser tab when one is defined', () => {
    mockBranding.accentColor = '#2cf63d';
    TestBed.createComponent(App);
    expect(themeColorEl.getAttribute('content')).toBe('#2cf63d');
  });

  it('sets theme-color to the dark app background when already standalone at construction', () => {
    mql.matches = true;
    TestBed.createComponent(App);
    expect(themeColorEl.getAttribute('content')).toBe('#0f1117');
  });

  it('updates theme-color reactively if display-mode is promoted to standalone shortly after load', () => {
    // Regression test: right after "Open in app"/install, Chromium can briefly still report
    // browser/minimal-ui before promoting the window to standalone — a one-time read at
    // construction missed that transition, leaving the icon-colliding accent color stuck.
    TestBed.createComponent(App);
    expect(themeColorEl.getAttribute('content')).not.toBe('#0f1117');

    mql.matches = true;
    mqlChangeListener?.();

    expect(themeColorEl.getAttribute('content')).toBe('#0f1117');
  });

  it('does not throw when no theme-color element exists in the document', () => {
    themeColorEl.remove();
    expect(() => TestBed.createComponent(App)).not.toThrow();
  });
});
