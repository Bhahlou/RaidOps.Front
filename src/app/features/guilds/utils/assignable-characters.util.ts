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
 * Character ID → set of other event IDs it's already locked to via a shared target zone with
 * `event` (the board only ever loads one lockout week at a time, so any other loaded event is, in
 * practice, within the same lockout window — an accurate stand-in for the back end's full per-zone
 * cadence/anchor comparison without duplicating that math here). Keyed per-event (not just a flat
 * ID set) so the grid's drag-blocking highlight can tell a genuine second-lockout conflict apart
 * from a same-zone *move*: dragging a character straight out of the one event that's locking it
 * clears the lock, so that specific drag should read as relocating them, not duplicating them.
 */
export type LockedCharacterEventIds = ReadonlyMap<number, ReadonlySet<number>>;

export function lockedCharacterEventIdsFor(event: RaidEvent, otherEvents: RaidEvent[]): LockedCharacterEventIds {
  const eventZoneIds = new Set(event.raidZones.map((z) => z.id));
  const result = new Map<number, Set<number>>();
  for (const other of otherEvents) {
    if (other.id === event.id || !other.raidZones.some((z) => eventZoneIds.has(z.id))) continue;
    for (const assignment of other.assignments) {
      const lockingEventIds = result.get(assignment.characterId) ?? new Set<number>();
      lockingEventIds.add(other.id);
      result.set(assignment.characterId, lockingEventIds);
    }
  }
  return result;
}

/** Flat character-ID view of {@link lockedCharacterEventIdsFor}, for callers that only need membership. */
export function lockedCharacterIdsFor(event: RaidEvent, otherEvents: RaidEvent[]): Set<number> {
  return new Set(lockedCharacterEventIdsFor(event, otherEvents).keys());
}

/**
 * Per-player character already holding a slot in `event` — the "one character per player per
 * event" rule, keyed by player so a slot can tell a same-player *repositioning* drag (dragged
 * character === the one already on file for that player) apart from a genuine second-character
 * conflict (a different character of a player who already has one seated).
 */
export function playerAssignedCharacterIdsFor(event: RaidEvent): ReadonlyMap<string, number> {
  return new Map(event.assignments.map((a) => [a.playerDiscordId, a.characterId]));
}

/**
 * Characters eligible to be assigned to `event`, mirroring
 * `AssignCharacterToSlotCommandHandler`'s own validation order so the search list only ever
 * offers choices the server will actually accept:
 * - currently ineligible for this event (`event.ineligiblePlayerDiscordIds`) — declared absent
 *   (`DefaultPresent` mode) or hasn't accepted the signup (`Signup` mode)
 * - the player already holds another slot in this same event (one character per player per event)
 * - the character is already locked to a target zone shared with this event via another
 *   currently loaded event (see {@link lockedCharacterIdsFor})
 * - for `Signup`-mode events, the character isn't the one the player actually signed up with
 *   (`event.acceptedCharacterIdsByPlayerDiscordId`) — a player may have other alts on the
 *   roster, but only the character they RSVP'd with is offered here
 */
export function assignableCharactersFor(
  event: RaidEvent,
  roster: GuildRosterMember[],
  otherEvents: RaidEvent[],
): AssignableCharacter[] {
  const ineligiblePlayerIds = new Set(event.ineligiblePlayerDiscordIds);
  const playersInEvent = new Set(event.assignments.map((a) => a.playerDiscordId));
  const lockedCharacterIds = lockedCharacterIdsFor(event, otherEvents);
  const acceptedCharacterIdsByPlayer = event.acceptedCharacterIdsByPlayerDiscordId;

  return roster
    .filter((m) => !ineligiblePlayerIds.has(m.playerDiscordId))
    .filter((m) => !playersInEvent.has(m.playerDiscordId))
    .filter((m) => !lockedCharacterIds.has(m.characterId))
    .filter((m) => {
      const signedUpCharacterId = acceptedCharacterIdsByPlayer[m.playerDiscordId];
      return signedUpCharacterId === undefined || signedUpCharacterId === m.characterId;
    })
    .map((m) => ({
      characterId: m.characterId,
      characterName: m.characterName,
      classId: m.classId,
      classColor: m.classColor,
      playerDiscordId: m.playerDiscordId,
    }));
}
