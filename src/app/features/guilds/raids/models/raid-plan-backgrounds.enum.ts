/** One curated, built-in background image available for the raid-plan canvas. */
export interface RaidPlanBackgroundOption {
  /** Globally unique key persisted on a `RaidPlanPage`. */
  key: string;
  /** The raid zone this background belongs to — used to filter the picker to relevant options. */
  zoneShortCode: string;
  /** Display label shown in the picker. */
  label: string;
  /** Filename under `public/assets/images/raid-plan-backgrounds/{zoneShortCode}/`. */
  filename: string;
  /** Width-to-height ratio the canvas renders this background at (e.g. `16 / 9`). */
  aspectRatio: number;
}

/**
 * Curated, built-in background images for the raid-plan canvas — bundled local assets, same
 * convention as `raid-marker-icon.enum.ts`, never an arbitrary upload or external URL. Sourced
 * from raidplan.io for this first pass (downloaded once, not hotlinked at runtime); `wow.export`
 * is a promising path for a fully independent source later, see the project memory.
 */
export const RAID_PLAN_BACKGROUNDS: RaidPlanBackgroundOption[] = [
  { key: 'kara-attumen', zoneShortCode: 'Kara', label: 'Attumen the Huntsman', filename: 'attumen.jpg', aspectRatio: 1.7998 },
  { key: 'kara-moroes', zoneShortCode: 'Kara', label: 'Moroes', filename: 'moroes.jpg', aspectRatio: 1.7998 },
  { key: 'kara-opera', zoneShortCode: 'Kara', label: 'Opera Event', filename: 'opera.jpg', aspectRatio: 1.7998 },
  { key: 'kara-maiden', zoneShortCode: 'Kara', label: 'Maiden of Virtue', filename: 'maiden.jpg', aspectRatio: 1.7998 },
  { key: 'kara-curator-hallway', zoneShortCode: 'Kara', label: 'The Curator (Hallway)', filename: 'curator-hallway.jpg', aspectRatio: 1.7998 },
  { key: 'kara-curator-doorway', zoneShortCode: 'Kara', label: 'The Curator (Doorway)', filename: 'curator-doorway.jpg', aspectRatio: 1.7998 },
  { key: 'kara-chess', zoneShortCode: 'Kara', label: 'Chess Event', filename: 'chess.jpg', aspectRatio: 1.7998 },
  { key: 'kara-terestian', zoneShortCode: 'Kara', label: 'Terestian Illhoof', filename: 'terestian.jpg', aspectRatio: 1.7998 },
  { key: 'kara-aran', zoneShortCode: 'Kara', label: 'Shade of Aran', filename: 'aran.jpg', aspectRatio: 1.7998 },
  { key: 'kara-netherspite', zoneShortCode: 'Kara', label: 'Netherspite', filename: 'netherspite.jpg', aspectRatio: 1.7998 },
  { key: 'kara-nightbane-overhead', zoneShortCode: 'Kara', label: 'Nightbane (Overhead)', filename: 'nightbane-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'kara-nightbane-closeup', zoneShortCode: 'Kara', label: 'Nightbane (Closeup)', filename: 'nightbane-closeup.jpg', aspectRatio: 1.7998 },
  { key: 'kara-malchezaar', zoneShortCode: 'Kara', label: 'Prince Malchezaar', filename: 'malchezaar.jpg', aspectRatio: 1.7998 },

  { key: 'gruul-maulgar-wide', zoneShortCode: 'Gruul', label: 'High King Maulgar (Wide)', filename: 'maulgar-wide.jpg', aspectRatio: 1.7998 },
  { key: 'gruul-maulgar-old', zoneShortCode: 'Gruul', label: 'High King Maulgar (Old)', filename: 'maulgar-old.jpg', aspectRatio: 1.7998 },
  { key: 'gruul-gruul-wide', zoneShortCode: 'Gruul', label: 'Gruul the Dragonkiller (Wide)', filename: 'gruul-wide.jpg', aspectRatio: 1.7998 },
  { key: 'gruul-gruul-room', zoneShortCode: 'Gruul', label: 'Gruul the Dragonkiller (Room)', filename: 'gruul-room.jpg', aspectRatio: 1.7998 },
  { key: 'gruul-gruul-door', zoneShortCode: 'Gruul', label: 'Gruul the Dragonkiller (Door)', filename: 'gruul-door.jpg', aspectRatio: 1.7998 },

  { key: 'mag-magtheridon-wide', zoneShortCode: 'Mag', label: 'Magtheridon (Wide)', filename: 'magtheridon-wide.jpg', aspectRatio: 1.7998 },
  { key: 'mag-magtheridon-old', zoneShortCode: 'Mag', label: 'Magtheridon (Old)', filename: 'magtheridon-old.jpg', aspectRatio: 1.7998 },

  { key: 'ssc-hydross-main', zoneShortCode: 'SSC', label: 'Hydross the Unstable (Main)', filename: '01.hydross-main.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-lurker-overhead', zoneShortCode: 'SSC', label: 'The Lurker Below (Overhead)', filename: '02.lurker-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-lurker-side', zoneShortCode: 'SSC', label: 'The Lurker Below (Side)', filename: '02.lurker-side.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-leotheras-side', zoneShortCode: 'SSC', label: 'Leotheras the Blind (Side)', filename: '03.leotheras-side.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-leotheras-overhead', zoneShortCode: 'SSC', label: 'Leotheras the Blind (Overhead)', filename: '03.leotheras-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-karathress-side', zoneShortCode: 'SSC', label: 'Fathom-Lord Karathress (Side)', filename: '04.karathress-side.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-karathress-overhead', zoneShortCode: 'SSC', label: 'Fathom-Lord Karathress (Overhead)', filename: '04.karathress-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-karathress-alt', zoneShortCode: 'SSC', label: 'Fathom-Lord Karathress (Alt)', filename: '04.karathress-alt.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-morogrim-overhead', zoneShortCode: 'SSC', label: 'Morogrim Tidewalker (Overhead)', filename: '05.morogrim-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-morogrim-alt', zoneShortCode: 'SSC', label: 'Morogrim Tidewalker (Alt)', filename: '05.morogrim-alt.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-vashj-overhead', zoneShortCode: 'SSC', label: 'Lady Vashj (Overhead)', filename: '06.vashj-overhead.jpg', aspectRatio: 1.7998 },
  { key: 'ssc-vashj-alt', zoneShortCode: 'SSC', label: 'Lady Vashj (Alt)', filename: '06.vashj-alt.jpg', aspectRatio: 1.7998 },

  { key: 'tk-alar-above', zoneShortCode: 'TK', label: "Al'ar (Above)", filename: '01.alar-above.jpg', aspectRatio: 1.7998 },
  { key: 'tk-alar-side', zoneShortCode: 'TK', label: "Al'ar (Side)", filename: '01.alar-side.jpg', aspectRatio: 1.7998 },
  { key: 'tk-reaver-enter', zoneShortCode: 'TK', label: 'Void Reaver (Entrance)', filename: '02.reaver-enter.jpg', aspectRatio: 1.7998 },
  { key: 'tk-reaver-alt', zoneShortCode: 'TK', label: 'Void Reaver (Alt)', filename: '02.reaver-alt.jpg', aspectRatio: 1.7998 },
  { key: 'tk-solarian-main', zoneShortCode: 'TK', label: 'High Astromancer Solarian (Main)', filename: '03.solarian-main.jpg', aspectRatio: 1.7998 },
  { key: 'tk-solarian-alt', zoneShortCode: 'TK', label: 'High Astromancer Solarian (Alt)', filename: '03.solarian-alt.jpg', aspectRatio: 1.7998 },
  { key: 'tk-kaelthas-main', zoneShortCode: 'TK', label: "Kael'thas Sunstrider (Main)", filename: '04.kaelthas-main.jpg', aspectRatio: 1.7998 },
  { key: 'tk-kaelthas-alt', zoneShortCode: 'TK', label: "Kael'thas Sunstrider (Alt)", filename: '04.kaelthas-alt.jpg', aspectRatio: 1.7998 },

  { key: 'hyjal-alliance', zoneShortCode: 'Hyjal', label: 'Winterchill / Anetheron (Alliance)', filename: '01.alliance.jpg', aspectRatio: 1.7998 },
  { key: 'hyjal-horde', zoneShortCode: 'Hyjal', label: 'Azgalor / Kazrogal (Horde)', filename: '02.horde.jpg', aspectRatio: 1.7998 },
  { key: 'hyjal-archimonde', zoneShortCode: 'Hyjal', label: 'Archimonde', filename: '03.archimonde.jpg', aspectRatio: 1.7998 },

  { key: 'bt-najentus-main', zoneShortCode: 'BT', label: "High Warlord Naj'entus (Main)", filename: '01.najentus-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-najentus-alt', zoneShortCode: 'BT', label: "High Warlord Naj'entus (Alt)", filename: '01.najentus-alt.jpg', aspectRatio: 1.7998 },
  { key: 'bt-supremus-main', zoneShortCode: 'BT', label: 'Supremus (Main)', filename: '02.supremus-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-supremus-alt', zoneShortCode: 'BT', label: 'Supremus (Alt)', filename: '02.supremus-alt.jpg', aspectRatio: 1.7998 },
  { key: 'bt-akama-main', zoneShortCode: 'BT', label: 'Shade of Akama (Main)', filename: '03.akama-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-akama-corner', zoneShortCode: 'BT', label: 'Shade of Akama (Corner)', filename: '03.akama-corner.jpg', aspectRatio: 1.7998 },
  { key: 'bt-akama-topdown', zoneShortCode: 'BT', label: 'Shade of Akama (Top-down)', filename: '03.akama-topdown.jpg', aspectRatio: 1.7998 },
  { key: 'bt-gorefiend-main', zoneShortCode: 'BT', label: 'Teron Gorefiend (Main)', filename: '04.gorefiend-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-gorefiend-platform', zoneShortCode: 'BT', label: 'Teron Gorefiend (Platform)', filename: '04.gorefiend-platform.jpg', aspectRatio: 1.7998 },
  { key: 'bt-gorefiend-room', zoneShortCode: 'BT', label: 'Teron Gorefiend (Room)', filename: '04.gorefiend-room.jpg', aspectRatio: 1.7998 },
  { key: 'bt-gurtogg-main', zoneShortCode: 'BT', label: 'Gurtogg Bloodboil (Main)', filename: '05.gurtogg-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-gurtogg-alt', zoneShortCode: 'BT', label: 'Gurtogg Bloodboil (Alt)', filename: '05.gurtogg-alt.jpg', aspectRatio: 1.7998 },
  { key: 'bt-souls-main', zoneShortCode: 'BT', label: 'Reliquary of Souls (Main)', filename: '06.souls-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-shahraz-main', zoneShortCode: 'BT', label: 'Mother Shahraz (Main)', filename: '07.shahraz-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-shahraz-alt', zoneShortCode: 'BT', label: 'Mother Shahraz (Alt)', filename: '07.shahraz-alt.jpg', aspectRatio: 1.7998 },
  { key: 'bt-shahraz-fish', zoneShortCode: 'BT', label: 'Mother Shahraz (Fisheye)', filename: '07.shahraz-fish.jpg', aspectRatio: 1.7998 },
  { key: 'bt-council-main', zoneShortCode: 'BT', label: 'Illidari Council (Main)', filename: '08.council-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-council-platform', zoneShortCode: 'BT', label: 'Illidari Council (Platform)', filename: '08.council-platform.jpg', aspectRatio: 1.7998 },
  { key: 'bt-illidan-main', zoneShortCode: 'BT', label: 'Illidan Stormrage (Main)', filename: '09.illidan-main.jpg', aspectRatio: 1.7998 },
  { key: 'bt-illidan-alt', zoneShortCode: 'BT', label: 'Illidan Stormrage (Alt)', filename: '09.illidan-alt.jpg', aspectRatio: 1.7998 },
  { key: 'bt-illidan-reverse', zoneShortCode: 'BT', label: 'Illidan Stormrage (Reverse)', filename: '09.illidan-reverse.jpg', aspectRatio: 1.7998 },

  { key: 'swp-kalecgos-main', zoneShortCode: 'SWP', label: 'Kalecgos (Main)', filename: '01.kalecgos-main.jpg', aspectRatio: 1.7759 },
  { key: 'swp-brutallus-full', zoneShortCode: 'SWP', label: 'Brutallus (Full)', filename: '02.brutallus-full.jpg', aspectRatio: 1.7759 },
  { key: 'swp-brutallus-left', zoneShortCode: 'SWP', label: 'Brutallus (Left)', filename: '02.brutallus-left.jpg', aspectRatio: 1.7759 },
  { key: 'swp-felmyst-full', zoneShortCode: 'SWP', label: 'Felmyst (Full)', filename: '03.felmyst-full.jpg', aspectRatio: 1.7759 },
  { key: 'swp-felmyst-left', zoneShortCode: 'SWP', label: 'Felmyst (Left)', filename: '03.felmyst-left.jpg', aspectRatio: 1.7759 },
  { key: 'swp-twins-main', zoneShortCode: 'SWP', label: 'Eredar Twins (Main)', filename: '04.twins-main.jpg', aspectRatio: 1.7759 },
  { key: 'swp-twins-full', zoneShortCode: 'SWP', label: 'Eredar Twins (Full)', filename: '04.twins-full.jpg', aspectRatio: 1.7759 },
  { key: 'swp-muru-main', zoneShortCode: 'SWP', label: "M'uru (Main)", filename: '05.muru-main.jpg', aspectRatio: 1.7759 },
  { key: 'swp-muru-reversed', zoneShortCode: 'SWP', label: "M'uru (Reversed)", filename: '05.muru-reversed.jpg', aspectRatio: 1.7759 },
  { key: 'swp-kiljaeden-main', zoneShortCode: 'SWP', label: "Kil'jaeden (Main)", filename: '06.kiljaeden-main.jpg', aspectRatio: 1.7759 },
  { key: 'swp-kiljaeden-alt', zoneShortCode: 'SWP', label: "Kil'jaeden (Alt)", filename: '06.kiljaeden-alt.jpg', aspectRatio: 1.7759 },
];

/** Fallback aspect ratio for the canvas when no background is picked yet. */
export const DEFAULT_RAID_PLAN_ASPECT_RATIO = 16 / 9;

export function raidPlanBackgroundOption(key: string): RaidPlanBackgroundOption | null {
  return RAID_PLAN_BACKGROUNDS.find((o) => o.key === key) ?? null;
}

/** Local asset URL for a background, bundled — never fetched externally. `null` if the key is unknown. */
export function raidPlanBackgroundUrl(key: string): string | null {
  const option = raidPlanBackgroundOption(key);
  return option ? `/assets/images/raid-plan-backgrounds/${option.zoneShortCode}/${option.filename}` : null;
}

/** Every background available for one raid zone — backs the background picker once a zone is known. */
export function raidPlanBackgroundsForZone(zoneShortCode: string): RaidPlanBackgroundOption[] {
  return RAID_PLAN_BACKGROUNDS.filter((o) => o.zoneShortCode === zoneShortCode);
}
