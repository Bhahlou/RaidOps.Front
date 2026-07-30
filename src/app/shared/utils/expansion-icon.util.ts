// Self-hosted, custom-designed expansion medallions (public/assets/images/expansion-icons/),
// keyed by WowBrancheService's `currentExpansionShortCode`.
const EXPANSION_ICON_URLS: Record<string, string> = {
  Classic: '/assets/images/expansion-icons/Classic.png',
  TBC: '/assets/images/expansion-icons/TBC.png',
  WotLK: '/assets/images/expansion-icons/WotLK.png',
  Cata: '/assets/images/expansion-icons/Cata.png',
  MoP: '/assets/images/expansion-icons/MoP.png',
  WoD: '/assets/images/expansion-icons/WoD.png',
  Legion: '/assets/images/expansion-icons/Legion.png',
  BfA: '/assets/images/expansion-icons/BfA.png',
  SL: '/assets/images/expansion-icons/SL.png',
  DF: '/assets/images/expansion-icons/DF.png',
  TWW: '/assets/images/expansion-icons/TWW.png',
};

export function expansionIconUrl(shortCode: string | null | undefined): string | null {
  return shortCode ? (EXPANSION_ICON_URLS[shortCode] ?? null) : null;
}
