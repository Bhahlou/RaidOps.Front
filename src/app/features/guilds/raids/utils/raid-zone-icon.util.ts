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
  // Not from the same wiki-icon batch as the rest (never found a matching one there) — a
  // promotional Zul'jin artwork crop instead, same source/treatment as the boss icon fallback.
  ZA: '/assets/images/raid-icons/za.jpg',
};

export function raidZoneIconUrl(shortCode: string | null | undefined): string | null {
  return shortCode ? (RAID_ZONE_ICON_URLS[shortCode] ?? null) : null;
}
