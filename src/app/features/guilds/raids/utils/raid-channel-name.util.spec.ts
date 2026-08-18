import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { buildRaidChannelName } from './raid-channel-name.util';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localeDe, 'de');
registerLocaleData(localeEn, 'en');

describe('buildRaidChannelName', () => {
  // 2026-08-18 is a Tuesday.
  const tuesday = '2026-08-18T20:00';

  it('builds an English name with short weekday/day/month', () => {
    expect(buildRaidChannelName('Kara', tuesday, 'en')).toBe('kara-tue-18-aug');
  });

  it('builds a French name with French abbreviations', () => {
    expect(buildRaidChannelName('Kara', tuesday, 'fr')).toBe('kara-mar-18-août');
  });

  it('builds a German name with German abbreviations', () => {
    expect(buildRaidChannelName('Kara', tuesday, 'de')).toBe('kara-di-18-aug');
  });

  it('returns the name alone (no date part) when startsAtLocal is empty', () => {
    expect(buildRaidChannelName('Kara', '', 'en')).toBe('kara');
  });

  it('returns the name alone when startsAtLocal is not a valid date', () => {
    expect(buildRaidChannelName('Kara', 'not-a-date', 'en')).toBe('kara');
  });

  it('returns an empty string when the raid name is blank', () => {
    expect(buildRaidChannelName('   ', tuesday, 'en')).toBe('');
  });

  it('returns an empty string when both name and date are missing', () => {
    expect(buildRaidChannelName('', '', 'en')).toBe('');
  });

  it('slugifies spaces, punctuation and mixed case', () => {
    expect(buildRaidChannelName('Split 1 - SSC/TK', tuesday, 'en')).toBe('split-1-ssctk-tue-18-aug');
  });

  it('keeps accented letters', () => {
    expect(buildRaidChannelName('Été de raid', tuesday, 'en')).toBe('été-de-raid-tue-18-aug');
  });

  it('truncates to 100 characters', () => {
    const longName = 'a'.repeat(200);
    expect(buildRaidChannelName(longName, tuesday, 'en').length).toBe(100);
  });
});
