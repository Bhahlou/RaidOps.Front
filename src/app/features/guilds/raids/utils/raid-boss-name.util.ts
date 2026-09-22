/** i18n key for a raid zone's localized name, keyed by its (stable, seeded) `shortCode`. */
export function raidZoneNameKey(shortCode: string): string {
  return `raidBuilder.zones.${shortCode.toLowerCase()}`;
}

/** Slug for a boss's (stable, seeded) English name — same convention as `specSlug`/`classSlug`, shared by the i18n key and the icon lookup below so both stay in sync off one name. */
function bossSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** i18n key for a boss's localized name. */
export function raidBossNameKey(name: string): string {
  return `raidBuilder.bosses.${bossSlug(name)}`;
}

// Self-hosted boss portraits (public/assets/images/boss-icons/), keyed by boss name slug — same
// convention as raid zone badges in `raid-zone-icon.util.ts`. Sourced from Wowhead's EJ boss
// journal art; downloaded once rather than hotlinked (same reasoning as the zone badges: no
// dependency on a third party's CDN staying up or allowing hotlinking).
const RAID_BOSS_ICON_URLS: Record<string, string> = {
  hydrosstheunstable: '/assets/images/boss-icons/hydrosstheunstable.png',
  thelurkerbelow: '/assets/images/boss-icons/thelurkerbelow.png',
  leotherastheblind: '/assets/images/boss-icons/leotherastheblind.png',
  fathomlordkarathress: '/assets/images/boss-icons/fathomlordkarathress.png',
  morogrimtidewalker: '/assets/images/boss-icons/morogrimtidewalker.png',
  ladyvashj: '/assets/images/boss-icons/ladyvashj.png',
  alar: '/assets/images/boss-icons/alar.png',
  voidreaver: '/assets/images/boss-icons/voidreaver.png',
  highastromancersolarian: '/assets/images/boss-icons/highastromancersolarian.png',
  kaelthassunstrider: '/assets/images/boss-icons/kaelthassunstrider.png',
  ragewinterchill: '/assets/images/boss-icons/ragewinterchill.png',
  anetheron: '/assets/images/boss-icons/anetheron.png',
  kazrogal: '/assets/images/boss-icons/kazrogal.png',
  azgalor: '/assets/images/boss-icons/azgalor.png',
  archimonde: '/assets/images/boss-icons/archimonde.png',
  highwarlordnajentus: '/assets/images/boss-icons/highwarlordnajentus.png',
  supremus: '/assets/images/boss-icons/supremus.png',
  shadeofakama: '/assets/images/boss-icons/shadeofakama.png',
  terongorefiend: '/assets/images/boss-icons/terongorefiend.png',
  gurtoggbloodboil: '/assets/images/boss-icons/gurtoggbloodboil.png',
  reliquaryofsouls: '/assets/images/boss-icons/reliquaryofsouls.png',
  mothershahraz: '/assets/images/boss-icons/mothershahraz.png',
  theillidaricouncil: '/assets/images/boss-icons/theillidaricouncil.png',
  illidanstormrage: '/assets/images/boss-icons/illidanstormrage.png',
  highkingmaulgar: '/assets/images/boss-icons/highkingmaulgar.png',
  gruulthedragonkiller: '/assets/images/boss-icons/gruulthedragonkiller.png',
  magtheridon: '/assets/images/boss-icons/magtheridon.png',
  attumenthehuntsman: '/assets/images/boss-icons/attumenthehuntsman.png',
  moroes: '/assets/images/boss-icons/moroes.png',
  maidenofvirtue: '/assets/images/boss-icons/maidenofvirtue.png',
  theoperaevent: '/assets/images/boss-icons/theoperaevent.png',
  thecurator: '/assets/images/boss-icons/thecurator.png',
  shadeofaran: '/assets/images/boss-icons/shadeofaran.png',
  terestianillhoof: '/assets/images/boss-icons/terestianillhoof.png',
  netherspite: '/assets/images/boss-icons/netherspite.png',
  chessevent: '/assets/images/boss-icons/chessevent.png',
  princemalchezaar: '/assets/images/boss-icons/princemalchezaar.png',
  akilzon: '/assets/images/boss-icons/akilzon.png',
  nalorakk: '/assets/images/boss-icons/nalorakk.png',
  janalai: '/assets/images/boss-icons/janalai.png',
  halazzi: '/assets/images/boss-icons/halazzi.png',
  hexlordmalacrass: '/assets/images/boss-icons/hexlordmalacrass.png',
  kalecgos: '/assets/images/boss-icons/kalecgos.png',
  brutallus: '/assets/images/boss-icons/brutallus.png',
  felmyst: '/assets/images/boss-icons/felmyst.png',
  eredartwins: '/assets/images/boss-icons/eredartwins.png',
  muru: '/assets/images/boss-icons/muru.png',
  kiljaeden: '/assets/images/boss-icons/kiljaeden.png',
  // Zul'jin was removed from the modern Encounter Journal (replaced by Daakara as ZA's current
  // final boss) — no "ui-ej-boss-zuljin.png" exists, so this deliberately reuses Daakara's EJ art
  // as the closest available stand-in rather than going without.
  zuljin: '/assets/images/boss-icons/zuljin.png',
};

/** Self-hosted portrait URL for a boss, or `null` if none has been sourced yet. */
export function raidBossIconUrl(name: string): string | null {
  return RAID_BOSS_ICON_URLS[bossSlug(name)] ?? null;
}
