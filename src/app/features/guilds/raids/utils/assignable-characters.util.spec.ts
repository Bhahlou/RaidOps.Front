import { DayAvailabilityStatus } from '../../../calendar/models/day-availability-status.enum';
import { CharacterRank } from '../../models/character-rank.enum';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { RaidEvent } from '../models/raid-event.model';
import { RaidEventStatus } from '../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../models/raid-publication-status.enum';
import { RaidSlotAssignment } from '../models/raid-slot-assignment.model';
import { SignupMode } from '../models/signup-mode.enum';
import {
  assignableCharactersFor,
  lockedCharacterEventIdsFor,
  lockedCharacterIdsFor,
  playerAssignedCharacterIdsFor,
} from './assignable-characters.util';

const assignment = (overrides?: Partial<RaidSlotAssignment>): RaidSlotAssignment => ({
  groupNumber: 1,
  slotNumber: 1,
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  classColor: '#c79c6e',
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  availabilityStatus: DayAvailabilityStatus.Available,
  spec: { id: 1, name: 'Fury', iconUrl: null },
  availableSpecs: [{ id: 1, name: 'Fury', iconUrl: null }],
  signupStatus: null,
  ...overrides,
});

const event = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 1,
  raidSeriesId: null,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [{ id: 10, name: 'Serpentshrine Cavern', shortCode: 'SSC' }],
  assignments: [],
  ineligiblePlayerDiscordIds: [],
  mySignupStatus: null,
  mySignupCharacterId: null,
  mySignupSpecId: null,
  acceptedCharacterIdsByPlayerDiscordId: {},
  dedicatedAnnouncementChannelId: null,
  dedicatedAnnouncementChannelIsBotOwned: false,
  extendsRaidEventId: null,
  extendsRaidEventName: null,
  ...overrides,
});

const rosterMember = (overrides?: Partial<GuildRosterMember>): GuildRosterMember => ({
  characterId: 1,
  characterName: 'Addse',
  classId: 1,
  className: 'Warrior',
  classColor: '#c79c6e',
  level: 60,
  branchName: 'Classic Anniversary',
  realmSlug: 'gehennas',
  avatarUrl: null,
  playerDiscordId: 'player-1',
  playerName: 'Dah Boo',
  playerAvatarHash: null,
  playerGuildAvatarUrl: null,
  raidSpecs: [],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
  canExclude: true,
  ...overrides,
});

describe('assignable-characters.util', () => {
  // ── lockedCharacterEventIdsFor / lockedCharacterIdsFor ─────────────────────

  describe('lockedCharacterEventIdsFor', () => {
    it('returns an empty map when there are no other events', () => {
      expect(lockedCharacterEventIdsFor(event(), []).size).toBe(0);
    });

    it('ignores other events that share no raid zone', () => {
      const other = event({ id: 2, raidZones: [{ id: 99, name: 'Karazhan', shortCode: 'Kara' }], assignments: [assignment()] });

      expect(lockedCharacterEventIdsFor(event(), [other]).size).toBe(0);
    });

    it('ignores itself even if present in the otherEvents list', () => {
      const self = event({ assignments: [assignment()] });

      expect(lockedCharacterEventIdsFor(self, [self]).size).toBe(0);
    });

    it('locks a character assigned in another event sharing a raid zone', () => {
      const other = event({ id: 2, assignments: [assignment({ characterId: 5 })] });

      const result = lockedCharacterEventIdsFor(event(), [other]);

      expect(result.get(5)).toEqual(new Set([2]));
    });

    it('accumulates every locking event id when a character is seated in more than one', () => {
      const otherA = event({ id: 2, assignments: [assignment({ characterId: 5 })] });
      const otherB = event({ id: 3, assignments: [assignment({ characterId: 5 })] });

      const result = lockedCharacterEventIdsFor(event(), [otherA, otherB]);

      expect(result.get(5)).toEqual(new Set([2, 3]));
    });

    // ── Extension chain exemption ──────────────────────────────────────────

    it('does not lock a character seated in an event that extends this one', () => {
      const other = event({ id: 2, extendsRaidEventId: 1, assignments: [assignment({ characterId: 5 })] });

      expect(lockedCharacterEventIdsFor(event({ id: 1 }), [other]).size).toBe(0);
    });

    it('does not lock a character seated in the event this one extends', () => {
      const other = event({ id: 2, assignments: [assignment({ characterId: 5 })] });

      expect(lockedCharacterEventIdsFor(event({ id: 1, extendsRaidEventId: 2 }), [other]).size).toBe(0);
    });

    it('does not lock a character seated in a sibling extending the same root', () => {
      const other = event({ id: 2, extendsRaidEventId: 10, assignments: [assignment({ characterId: 5 })] });

      expect(lockedCharacterEventIdsFor(event({ id: 1, extendsRaidEventId: 10 }), [other]).size).toBe(0);
    });

    it('still locks across unrelated events even when both happen to extend different chains', () => {
      const other = event({ id: 2, extendsRaidEventId: 20, assignments: [assignment({ characterId: 5 })] });

      const result = lockedCharacterEventIdsFor(event({ id: 1, extendsRaidEventId: 10 }), [other]);

      expect(result.get(5)).toEqual(new Set([2]));
    });
  });

  describe('lockedCharacterIdsFor', () => {
    it('flattens lockedCharacterEventIdsFor down to a character-id set', () => {
      const other = event({ id: 2, assignments: [assignment({ characterId: 5 }), assignment({ characterId: 6, playerDiscordId: 'player-2' })] });

      expect(lockedCharacterIdsFor(event(), [other])).toEqual(new Set([5, 6]));
    });
  });

  // ── playerAssignedCharacterIdsFor ───────────────────────────────────────────

  describe('playerAssignedCharacterIdsFor', () => {
    it('returns an empty map for an event with no assignments', () => {
      expect(playerAssignedCharacterIdsFor(event()).size).toBe(0);
    });

    it('maps each assigned player to their seated character id', () => {
      const e = event({
        assignments: [
          assignment({ characterId: 1, playerDiscordId: 'player-1' }),
          assignment({ characterId: 2, playerDiscordId: 'player-2' }),
        ],
      });

      const result = playerAssignedCharacterIdsFor(e);

      expect(result.get('player-1')).toBe(1);
      expect(result.get('player-2')).toBe(2);
    });
  });

  // ── assignableCharactersFor ──────────────────────────────────────────────

  describe('assignableCharactersFor', () => {
    it('offers every roster member when the event has no conflicts', () => {
      const result = assignableCharactersFor(event(), [rosterMember()], []);

      expect(result).toEqual([
        { characterId: 1, characterName: 'Addse', classId: 1, classColor: '#c79c6e', playerDiscordId: 'player-1' },
      ]);
    });

    it('excludes a member declared absent for the event', () => {
      const e = event({ ineligiblePlayerDiscordIds: ['player-1'] });

      expect(assignableCharactersFor(e, [rosterMember()], [])).toEqual([]);
    });

    it('excludes a member whose player already holds another slot in this event', () => {
      const e = event({ assignments: [assignment({ characterId: 2, playerDiscordId: 'player-1' })] });

      expect(assignableCharactersFor(e, [rosterMember()], [])).toEqual([]);
    });

    it('excludes a member locked to a shared raid zone via another loaded event', () => {
      const other = event({ id: 2, assignments: [assignment({ characterId: 1, playerDiscordId: 'player-1' })] });

      expect(assignableCharactersFor(event(), [rosterMember()], [other])).toEqual([]);
    });

    it('still offers a member locked out of a different event sharing no raid zone', () => {
      const other = event({ id: 2, raidZones: [{ id: 99, name: 'Karazhan', shortCode: 'Kara' }], assignments: [assignment({ characterId: 1 })] });

      expect(assignableCharactersFor(event(), [rosterMember()], [other])).toHaveLength(1);
    });

    it('offers a member with no entry in acceptedCharacterIdsByPlayerDiscordId (DefaultPresent event)', () => {
      const e = event({ acceptedCharacterIdsByPlayerDiscordId: {} });

      expect(assignableCharactersFor(e, [rosterMember()], [])).toHaveLength(1);
    });

    it('offers a member whose roster character matches the one they signed up with', () => {
      const e = event({ acceptedCharacterIdsByPlayerDiscordId: { 'player-1': 1 } });

      expect(assignableCharactersFor(e, [rosterMember()], [])).toHaveLength(1);
    });

    it('excludes a member whose roster character is an alt they did not sign up with', () => {
      const e = event({ acceptedCharacterIdsByPlayerDiscordId: { 'player-1': 2 } });

      expect(assignableCharactersFor(e, [rosterMember()], [])).toEqual([]);
    });
  });
});
