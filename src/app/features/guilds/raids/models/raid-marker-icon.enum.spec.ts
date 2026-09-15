import { RaidMarkerIcon, raidMarkerIconUrl, RAID_MARKER_ORDER } from './raid-marker-icon.enum';

describe('raidMarkerIconUrl', () => {
  it.each([
    [RaidMarkerIcon.Skull, 'skull'],
    [RaidMarkerIcon.Cross, 'cross'],
    [RaidMarkerIcon.Square, 'square'],
    [RaidMarkerIcon.Moon, 'moon'],
    [RaidMarkerIcon.Triangle, 'triangle'],
    [RaidMarkerIcon.Diamond, 'diamond'],
    [RaidMarkerIcon.Circle, 'circle'],
    [RaidMarkerIcon.Star, 'star'],
  ])('returns the %s marker asset URL', (marker, assetName) => {
    expect(raidMarkerIconUrl(marker)).toBe(`/assets/images/raid-markers/${assetName}.png`);
  });
});

describe('RAID_MARKER_ORDER', () => {
  it('lists all 8 markers in WoW UI order, star first and skull last', () => {
    expect(RAID_MARKER_ORDER).toEqual([
      RaidMarkerIcon.Star,
      RaidMarkerIcon.Circle,
      RaidMarkerIcon.Diamond,
      RaidMarkerIcon.Triangle,
      RaidMarkerIcon.Moon,
      RaidMarkerIcon.Square,
      RaidMarkerIcon.Cross,
      RaidMarkerIcon.Skull,
    ]);
  });
});
