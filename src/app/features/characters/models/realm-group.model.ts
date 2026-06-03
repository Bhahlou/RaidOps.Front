import { Character } from './character.model';

export interface RealmGroup {
  realmName: string;
  characters: Character[];
}
