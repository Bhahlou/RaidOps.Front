import { raidZoneIconUrl } from './raid-zone-icon.util';

describe('raidZoneIconUrl', () => {
  it('resolves a known short code to its icon asset path', () => {
    expect(raidZoneIconUrl('SSC')).toBe('/assets/images/raid-icons/ssc.jpg');
  });

  it('returns null for an unknown short code', () => {
    expect(raidZoneIconUrl('Naxx')).toBeNull();
  });

  it('returns null for a null short code', () => {
    expect(raidZoneIconUrl(null)).toBeNull();
  });

  it('returns null for an undefined short code', () => {
    expect(raidZoneIconUrl(undefined)).toBeNull();
  });

  it('returns null for an empty short code', () => {
    expect(raidZoneIconUrl('')).toBeNull();
  });
});
