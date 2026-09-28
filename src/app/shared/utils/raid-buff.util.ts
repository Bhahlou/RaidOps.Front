import { RaidBuffDefinitionInput, RaidBuffSpell } from '../models/raid-buff-definition.model';

/** Picks the French or German value for those two languages, the English one for anything else. */
function byLanguage(lang: string, en: string, fr: string, de: string): string {
  if (lang === 'fr') return fr;
  if (lang === 'de') return de;
  return en;
}

/** A definition's effect label in the given UI language (e.g. "+25% armor"). */
export function raidBuffLabel(definition: RaidBuffDefinitionInput, lang: string): string {
  return byLanguage(lang, definition.labelEn, definition.labelFr, definition.labelDe);
}

/** A definition's spell name in the given UI language. */
export function raidBuffSpellName(spell: RaidBuffSpell, lang: string): string {
  return byLanguage(lang, spell.nameEn, spell.nameFr, spell.nameDe);
}
