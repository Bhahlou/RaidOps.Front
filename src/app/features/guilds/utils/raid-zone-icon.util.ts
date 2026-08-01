// Self-hosted raid zone badges (public/assets/images/raid-icons/), keyed by RaidZone.shortCode.
const RAID_ZONE_ICON_URLS: Record<string, string> = {
  Kara: '/assets/images/raid-icons/kara.jpg',
  Gruul: '/assets/images/raid-icons/gruul.jpg',
  Mag: '/assets/images/raid-icons/maghte.jpg',
  SSC: '/assets/images/raid-icons/ssc.jpg',
  TK: '/assets/images/raid-icons/tk.jpg',
  Hyjal: '/assets/images/raid-icons/hs.jpg',
  BT: '/assets/images/raid-icons/bt.jpg',
  SWP: '/assets/images/raid-icons/swp.jpg',
};

export function raidZoneIconUrl(shortCode: string | null | undefined): string | null {
  return shortCode ? (RAID_ZONE_ICON_URLS[shortCode] ?? null) : null;
}
