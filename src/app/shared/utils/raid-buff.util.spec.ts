import { raidBuffLabel, raidBuffSpellName } from './raid-buff.util';
import { RaidBuffDefinitionInput, RaidBuffSpell } from '../models/raid-buff-definition.model';
import { RaidBuffKind } from '../models/raid-buff-kind.enum';
import { RaidBuffScope } from '../models/raid-buff-scope.enum';

const definition: RaidBuffDefinitionInput = {
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: 'English label',
  labelFr: 'Libellé français',
  labelDe: 'Deutsches Label',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 0,
  sources: [],
};

const spell: RaidBuffSpell = {
  nameEn: 'English name',
  nameFr: 'Nom français',
  nameDe: 'Deutscher Name',
  iconUrl: 'https://cdn/x.jpg',
};

describe('raidBuffLabel', () => {
  it.each([
    ['fr', 'Libellé français'],
    ['de', 'Deutsches Label'],
    ['en', 'English label'],
    ['es', 'English label'],
  ])('resolves the %s label (falling back to English)', (lang, expected) => {
    expect(raidBuffLabel(definition, lang)).toBe(expected);
  });
});

describe('raidBuffSpellName', () => {
  it.each([
    ['fr', 'Nom français'],
    ['de', 'Deutscher Name'],
    ['en', 'English name'],
    ['es', 'English name'],
  ])('resolves the %s spell name (falling back to English)', (lang, expected) => {
    expect(raidBuffSpellName(spell, lang)).toBe(expected);
  });
});
