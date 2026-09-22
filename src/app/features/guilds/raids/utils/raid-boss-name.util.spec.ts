import { raidBossIconUrl, raidBossNameKey, raidZoneNameKey } from './raid-boss-name.util';

describe('raidZoneNameKey', () => {
  it('builds a lowercased i18n key from the short code', () => {
    expect(raidZoneNameKey('SSC')).toBe('raidBuilder.zones.ssc');
  });
});

describe('raidBossNameKey', () => {
  it('slugifies a simple name', () => {
    expect(raidBossNameKey('Moroes')).toBe('raidBuilder.bosses.moroes');
  });

  it('strips spaces and punctuation from a multi-word name', () => {
    expect(raidBossNameKey('Hydross the Unstable')).toBe('raidBuilder.bosses.hydrosstheunstable');
  });

  it('strips apostrophes', () => {
    expect(raidBossNameKey("Akil'zon")).toBe('raidBuilder.bosses.akilzon');
  });

  it('strips hyphens', () => {
    expect(raidBossNameKey('Fathom-Lord Karathress')).toBe('raidBuilder.bosses.fathomlordkarathress');
  });
});

describe('raidBossIconUrl', () => {
  it('resolves a sourced boss name to its self-hosted icon path', () => {
    expect(raidBossIconUrl('Hydross the Unstable')).toBe('/assets/images/boss-icons/hydrosstheunstable.png');
  });

  it('is case-insensitive and ignores punctuation, matching the same slug as the name key', () => {
    expect(raidBossIconUrl("Akil'zon")).toBe('/assets/images/boss-icons/akilzon.png');
  });

  it('returns null for a boss with no sourced icon', () => {
    expect(raidBossIconUrl('Some Unseeded Boss')).toBeNull();
  });
});
