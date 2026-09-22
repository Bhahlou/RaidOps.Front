import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { SpellIconComponent } from './spell-icon.component';

describe('SpellIconComponent', () => {
  const setup = (iconUrl: string, label?: string, size?: number, spellId?: number | null, activeLang = 'en') => {
    TestBed.configureTestingModule({
      imports: [SpellIconComponent],
      providers: [{ provide: TranslocoService, useValue: { activeLang: signal(activeLang) } }],
    });
    const fixture = TestBed.createComponent(SpellIconComponent);
    fixture.componentRef.setInput('iconUrl', iconUrl);
    if (label !== undefined) fixture.componentRef.setInput('label', label);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    if (spellId !== undefined) fixture.componentRef.setInput('spellId', spellId);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup('https://cdn/icon.jpg')).toBeTruthy();
  });

  it('renders an img with the given src, label and size', () => {
    const fixture = setup('https://cdn/icon.jpg', 'Innervate', 32);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://cdn/icon.jpg');
    expect(img.alt).toBe('Innervate');
    expect(img.title).toBe('Innervate');
    expect(img.style.width).toBe('32px');
    expect(img.style.height).toBe('32px');
  });

  it('defaults to a 24px size and an empty label', () => {
    const fixture = setup('https://cdn/icon.jpg');
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.width).toBe('24px');
    expect(img.alt).toBe('');
  });

  it('renders nothing when iconUrl is empty', () => {
    const fixture = setup('');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  // ── wowheadUrl / tooltip wiring ──────────────────────────────────────────

  describe('wowheadUrl', () => {
    it('is null when no spellId is given', () => {
      expect(setup('https://cdn/icon.jpg').componentInstance.wowheadUrl()).toBeNull();
    });

    it('is the spell Wowhead URL when spellId is given', () => {
      expect(setup('https://cdn/icon.jpg', undefined, undefined, 29166).componentInstance.wowheadUrl()).toBe('https://www.wowhead.com/spell=29166');
    });
  });

  it('wraps the img in a Wowhead link (domain=tbc, opened in a new tab) when spellId is given', () => {
    const fixture = setup('https://cdn/icon.jpg', 'Innervate', undefined, 29166);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://www.wowhead.com/spell=29166');
    expect(link.getAttribute('data-wowhead')).toBe('domain=tbc');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
    expect(link.querySelector('img')).not.toBeNull();
  });

  describe('wowheadDomain', () => {
    it('is plain "tbc" for English', () => {
      expect(setup('https://cdn/icon.jpg', undefined, undefined, 29166, 'en').componentInstance.wowheadDomain()).toBe('tbc');
    });

    it('is "{lang}.tbc" for French, so the Wowhead tooltip content is localized', () => {
      expect(setup('https://cdn/icon.jpg', undefined, undefined, 29166, 'fr').componentInstance.wowheadDomain()).toBe('fr.tbc');
    });

    it('is "{lang}.tbc" for German, so the Wowhead tooltip content is localized', () => {
      expect(setup('https://cdn/icon.jpg', undefined, undefined, 29166, 'de').componentInstance.wowheadDomain()).toBe('de.tbc');
    });

    it('is reflected in the link\'s data-wowhead attribute', () => {
      const fixture = setup('https://cdn/icon.jpg', 'Innervate', undefined, 29166, 'fr');
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
      expect(link.getAttribute('data-wowhead')).toBe('domain=fr.tbc');
    });
  });

  it('renders a plain img with no wrapping link and the native title tooltip when no spellId is given', () => {
    const fixture = setup('https://cdn/icon.jpg', 'Innervate');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.title).toBe('Innervate');
  });
});
