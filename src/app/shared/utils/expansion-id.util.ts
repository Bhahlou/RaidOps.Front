/**
 * Numeric expansion ID keyed by short code — mirrors the back-end's static `Expansion` seed data
 * (`RaidOpsDbContext.SeedExpansions`). Hardcoded client-side rather than fetched, same convention
 * as `wow-class-icon.component.ts`'s class icon map: this reference table essentially never
 * changes, so there's no need for a round trip just to resolve an ID.
 */
const EXPANSION_IDS_BY_SHORT_CODE: Record<string, number> = {
  Classic: 1,
  TBC: 2,
  WotLK: 3,
  Cata: 4,
  MoP: 5,
  WoD: 6,
  Legion: 7,
  BfA: 8,
  SL: 9,
  DF: 10,
  TWW: 11,
  Forever: 12,
};

/** Numeric expansion ID for a branch's short code, or `null` for an unrecognized one. */
export function expansionIdFromShortCode(shortCode: string | undefined): number | null {
  if (!shortCode) return null;
  return EXPANSION_IDS_BY_SHORT_CODE[shortCode] ?? null;
}
