import { SpecRole, specRoleIconUrl, SPEC_ROLE_ORDER } from './spec-role.enum';

describe('specRoleIconUrl', () => {
  it('returns the tank icon URL', () => {
    expect(specRoleIconUrl(SpecRole.Tank)).toBe('/assets/images/role-icons/tank.svg');
  });

  it('returns the healer icon URL', () => {
    expect(specRoleIconUrl(SpecRole.Healer)).toBe('/assets/images/role-icons/healer.svg');
  });

  it('returns the ranged dps icon URL', () => {
    expect(specRoleIconUrl(SpecRole.RangedDps)).toBe('/assets/images/role-icons/rdps.svg');
  });

  it('returns the melee dps icon URL', () => {
    expect(specRoleIconUrl(SpecRole.MeleeDps)).toBe('/assets/images/role-icons/mdps.svg');
  });
});

describe('SPEC_ROLE_ORDER', () => {
  it('lists all 4 roles, tank first and melee last', () => {
    expect(SPEC_ROLE_ORDER).toEqual([SpecRole.Tank, SpecRole.Healer, SpecRole.RangedDps, SpecRole.MeleeDps]);
  });
});
