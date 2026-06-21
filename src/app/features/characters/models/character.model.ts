import { CharacterSpec } from './character-spec.model';
import { GuildMembership } from '../../guilds/models/guild-membership.model';

/** A WoW character imported into RaidOps. */
export interface Character {
  id: number;
  name: string;
  classId: number;
  className: string;
  classColor: string;
  raceId: number;
  raceName: string;
  faction: string;
  branchName: string;
  realmName: string;
  realmSlug: string;
  level: number;
  itemLevel: number | null;
  avatarUrl: string | null;
  guildName: string | null;
  bnetSpecs: CharacterSpec[];
  raidSpecs: CharacterSpec[];
  guildMemberships: GuildMembership[];
}
