export const REGIONS = ['eu', 'us', 'kr', 'tw'] as const;
export type BnetRegion = (typeof REGIONS)[number];

/** Maps a BNet region code to its ISO 3166-1 alpha-2 country code for flag-icons. */
export const REGION_FLAGS: Record<BnetRegion, string> = {
  eu: 'eu',
  us: 'us',
  kr: 'kr',
  tw: 'tw',
};
