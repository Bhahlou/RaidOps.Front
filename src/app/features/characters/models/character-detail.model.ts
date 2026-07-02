import { Character } from './character.model';

/** A character viewed via its detail page, enriched with the viewer's permissions on it. */
export interface CharacterDetail extends Character {
  isOwner: boolean;
  canEditRaidSpecs: boolean;
}
