import { GuildAttributionDefinition } from './guild-attribution-definition.model';

/** One filled slot of a raid event's attributions. */
export interface RaidEventAttributionFill {
  definitionId: number;
  cellId: number;
  instanceIndex: number;
  characterId: number;
  characterName: string;
  classId: number;
}

/** A character currently seated in a raid event's slot grid — the fill picker's candidate pool. */
export interface SeatedCharacter {
  characterId: number;
  name: string;
  classId: number;
  specId: number;
}

/** Everything the raid event's Assignments tab needs in one payload. */
export interface RaidEventAttributions {
  definitions: GuildAttributionDefinition[];
  fills: RaidEventAttributionFill[];
  seatedCharacters: SeatedCharacter[];
}
