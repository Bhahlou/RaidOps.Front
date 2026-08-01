import { GuildRosterMember } from '../models/guild-roster-member.model';
import { RaidEvent } from '../models/raid-event.model';

/** A character the search-to-assign picker may offer for a given event's empty slot. */
export interface AssignableCharacter {
  characterId: number;
  characterName: string;
  classId: number;
  classColor: string;
  playerDiscordId: string;
}

/**
 * Character IDs already locked to one of `event`'s target zones via another event that shares at
 * least one of them (the board only ever loads one lockout week at a time, so any other loaded
 * event is, in practice, within the same lockout window — an accurate stand-in for the back end's
 * full per-zone cadence/anchor comparison without duplicating that math here). Shared by
 * {@link assignableCharactersFor} and the grid's own drag-blocking highlight, so a character reads
 * as locked out consistently everywhere on the board.
 */
export function lockedCharacterIdsFor(event: RaidEvent, otherEvents: RaidEvent[]): Set<number> {
  const eventZoneIds = new Set(event.raidZones.map((z) => z.id));
  return new Set(
    otherEvents
      .filter((e) => e.id !== event.id && e.raidZones.some((z) => eventZoneIds.has(z.id)))
      .flatMap((e) => e.assignments.map((a) => a.characterId)),
  );
}

/**
 * Characters eligible to be assigned to `event`, mirroring
 * `AssignCharacterToSlotCommandHandler`'s own validation order so the search list only ever
 * offers choices the server will actually accept:
 * - declared absent for the event's date (`event.absentPlayerDiscordIds`)
 * - the player already holds another slot in this same event (one character per player per event)
 * - the character is already locked to a target zone shared with this event via another
 *   currently loaded event (see {@link lockedCharacterIdsFor})
 */
export function assignableCharactersFor(
  event: RaidEvent,
  roster: GuildRosterMember[],
  otherEvents: RaidEvent[],
): AssignableCharacter[] {
  const absentPlayerIds = new Set(event.absentPlayerDiscordIds);
  const playersInEvent = new Set(event.assignments.map((a) => a.playerDiscordId));
  const lockedCharacterIds = lockedCharacterIdsFor(event, otherEvents);

  return roster
    .filter((m) => !absentPlayerIds.has(m.playerDiscordId))
    .filter((m) => !playersInEvent.has(m.playerDiscordId))
    .filter((m) => !lockedCharacterIds.has(m.characterId))
    .map((m) => ({
      characterId: m.characterId,
      characterName: m.characterName,
      classId: m.classId,
      classColor: m.classColor,
      playerDiscordId: m.playerDiscordId,
    }));
}
