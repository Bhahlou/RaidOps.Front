/**
 * WoW's 8 fixed raid target markers. Mirrors the back-end enum of the same name — string-valued
 * (not numeric) because the back-end's `JsonStringEnumConverter` always serializes enums as their
 * name in responses, even though it accepts numbers on requests.
 */
export enum RaidMarkerIcon {
  Skull = 'Skull',
  Cross = 'Cross',
  Square = 'Square',
  Moon = 'Moon',
  Triangle = 'Triangle',
  Diamond = 'Diamond',
  Circle = 'Circle',
  Star = 'Star',
}

/** Lowercase asset-name keyed by `RaidMarkerIcon`, matching `public/assets/images/raid-markers/{name}.png`. */
const RAID_MARKER_ASSET_NAMES: Record<RaidMarkerIcon, string> = {
  [RaidMarkerIcon.Skull]: 'skull',
  [RaidMarkerIcon.Cross]: 'cross',
  [RaidMarkerIcon.Square]: 'square',
  [RaidMarkerIcon.Moon]: 'moon',
  [RaidMarkerIcon.Triangle]: 'triangle',
  [RaidMarkerIcon.Diamond]: 'diamond',
  [RaidMarkerIcon.Circle]: 'circle',
  [RaidMarkerIcon.Star]: 'star',
};

/** Local asset URL for a raid target marker — bundled, never fetched externally. */
export function raidMarkerIconUrl(marker: RaidMarkerIcon): string {
  return `/assets/images/raid-markers/${RAID_MARKER_ASSET_NAMES[marker]}.png`;
}

/** Every raid marker, in their conventional WoW UI order — for the picker. */
export const RAID_MARKER_ORDER: RaidMarkerIcon[] = [
  RaidMarkerIcon.Star,
  RaidMarkerIcon.Circle,
  RaidMarkerIcon.Diamond,
  RaidMarkerIcon.Triangle,
  RaidMarkerIcon.Moon,
  RaidMarkerIcon.Square,
  RaidMarkerIcon.Cross,
  RaidMarkerIcon.Skull,
];
