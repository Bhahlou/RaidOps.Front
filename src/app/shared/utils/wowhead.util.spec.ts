import { wowheadSpellUrl, wowheadTooltipDomain } from './wowhead.util';

describe('wowheadTooltipDomain', () => {
  it.each([
    [1, 'en', 'classic'],
    [1, 'fr', 'fr.classic'],
    [2, 'en', 'tbc'],
    [2, 'de', 'de.tbc'],
    [3, 'en', 'wotlk'],
    [4, 'en', 'cata'],
    [5, 'en', 'mop-classic'],
    [12, 'en', 'forever'],
    [12, 'fr', 'fr.forever'],
    [12, 'de', 'de.forever'],
  ])('resolves expansion %i / lang %s to domain %s', (expansionId, lang, expected) => {
    expect(wowheadTooltipDomain(expansionId, lang)).toBe(expected);
  });

  it('falls back to TBC when no expansion is given at all (expansionId is literally null)', () => {
    expect(wowheadTooltipDomain(null, 'en')).toBe('tbc');
    expect(wowheadTooltipDomain(null, 'fr')).toBe('fr.tbc');
  });

  it('falls back to the language-only root for an expansion with no known sub-site — unlike an unset expansion, this does NOT default to TBC', () => {
    // Expansion 6 = Warlords of Draenor onwards has no sub-site entry, same as any other unrecognized ID.
    expect(wowheadTooltipDomain(6, 'en')).toBe('www');
    expect(wowheadTooltipDomain(6, 'fr')).toBe('fr');
    expect(wowheadTooltipDomain(999, 'en')).toBe('www');
  });
});

describe('wowheadSpellUrl', () => {
  it('builds a sub-site URL for a known expansion', () => {
    expect(wowheadSpellUrl(12, 16176)).toBe('https://www.wowhead.com/forever/spell=16176');
  });

  it('builds a root URL when no expansion is given', () => {
    expect(wowheadSpellUrl(null, 16176)).toBe('https://www.wowhead.com/spell=16176');
  });

  it('builds a root URL for a retail-era expansion with no sub-site', () => {
    expect(wowheadSpellUrl(6, 16176)).toBe('https://www.wowhead.com/spell=16176');
  });
});
