/**
 * Wowhead sub-site per expansion ID (mirrors the back-end's `Expansion` seed). Retail expansions
 * (Warlords of Draenor onwards) are absent: retail is Wowhead's root site, with no sub-site segment.
 */
const WOWHEAD_SUBSITE_BY_EXPANSION: Record<number, string> = {
  1: 'classic',
  2: 'tbc',
  3: 'wotlk',
  4: 'cata',
  5: 'mop-classic',
  12: 'forever',
};

/** The sub-site used when the caller doesn't say which expansion a spell belongs to — historically TBC. */
const DEFAULT_SUBSITE = 'tbc';

function subsiteFor(expansionId: number | null): string | null {
  if (expansionId === null) return DEFAULT_SUBSITE;
  return WOWHEAD_SUBSITE_BY_EXPANSION[expansionId] ?? null;
}

/**
 * Value of the `domain=` part of a `data-wowhead` attribute for the app's active language: the sub-site
 * prefixed by the language for non-English ("fr.forever"), the bare language for retail, "www" for
 * English retail. Without an expansion, falls back to the TBC sub-site the app used before expansions mattered.
 */
export function wowheadTooltipDomain(expansionId: number | null, lang: string): string {
  const subsite = subsiteFor(expansionId);
  if (subsite === null) return lang === 'en' ? 'www' : lang;
  return lang === 'en' ? subsite : `${lang}.${subsite}`;
}

/** Wowhead page URL of a spell on the given expansion's sub-site (the retail root when it has none). */
export function wowheadSpellUrl(expansionId: number | null, spellId: number): string {
  // Without an expansion the link keeps pointing at the root site, as it always did.
  const subsite = expansionId === null ? null : subsiteFor(expansionId);
  return subsite ? `https://www.wowhead.com/${subsite}/spell=${spellId}` : `https://www.wowhead.com/spell=${spellId}`;
}
