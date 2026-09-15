/**
 * The role a specialization fulfils in a raid or group — a 4-way split (not the classic
 * tank/healer/dps trinity) since melee and ranged dps are meaningfully different for raid
 * composition and attribution-slot eligibility. Mirrors the back-end `SpecRole` enum —
 * string-valued (not numeric) because the back-end's `JsonStringEnumConverter` always serializes
 * enums as their name in responses, even though it accepts numbers on requests.
 */
export enum SpecRole {
  Tank = 'Tank',
  Healer = 'Healer',
  RangedDps = 'RangedDps',
  MeleeDps = 'MeleeDps',
}

/** Asset-name keyed by `SpecRole`, matching `public/assets/images/role-icons/{name}.svg`. */
const SPEC_ROLE_ICON_ASSET_NAMES: Record<SpecRole, string> = {
  [SpecRole.Tank]: 'tank',
  [SpecRole.Healer]: 'healer',
  [SpecRole.RangedDps]: 'rdps',
  [SpecRole.MeleeDps]: 'mdps',
};

/** Local asset URL for a role's icon — bundled, never fetched externally. */
export function specRoleIconUrl(role: SpecRole): string {
  return `/assets/images/role-icons/${SPEC_ROLE_ICON_ASSET_NAMES[role]}.svg`;
}

/** Every role, in a sensible picker order. */
export const SPEC_ROLE_ORDER: SpecRole[] = [SpecRole.Tank, SpecRole.Healer, SpecRole.RangedDps, SpecRole.MeleeDps];
