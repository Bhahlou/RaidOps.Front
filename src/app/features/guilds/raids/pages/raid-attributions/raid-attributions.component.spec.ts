import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RaidAttributionsComponent } from './raid-attributions.component';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel } from '../../../../../core/models/guild-access-level.enum';
import { User } from '../../../../../core/models/user.model';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { Spec } from '../../../../../shared/models/spec.model';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { RaidAttributionsStore } from '../../stores/raid-attributions.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEventAttributionsService } from '../../services/raid-event-attributions.service';
import { RaidBoss } from '../../models/raid-boss.model';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';

const boss = (overrides?: Partial<RaidBoss>): RaidBoss => ({
  id: 14,
  name: 'Hydross the Unstable',
  iconUrl: null,
  sortOrder: 1,
  raidZoneId: 4,
  raidZoneName: 'Serpentshrine Cavern',
  raidZoneShortCode: 'SSC',
  ...overrides,
});

const spec = (overrides?: Partial<Spec>): Spec => ({ id: 265, name: 'Affliction', role: 'RangedDps', classId: 9, iconUrl: null, ...overrides });

const wowClass = (overrides?: Partial<WowClass>): WowClass => ({ id: 9, name: 'Warlock', color: '9482C9', firstExpansionId: 1, ...overrides });

const raidEvent = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 42,
  raidSeriesId: null,
  name: 'Début de raid',
  branchId: 3,
  branchName: 'Classic Anniversary',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [],
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

const userGuild = (accessLevel: GuildAccessLevel) => ({
  id: 'g1',
  name: 'Dah Boo',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  accessLevel,
  branches: [{ id: 7, branchId: 3, branchName: 'Classic Anniversary', accessLevel, hasActiveCharacter: true }],
});

const fakeUser = (accessLevel: GuildAccessLevel = GuildAccessLevel.Officer): User => ({
  discordId: 'player-1',
  name: 'Dah Boo',
  avatarHash: null,
  guilds: [userGuild(accessLevel)],
  notifications: [],
  seenChangelogEntryIds: [],
});

describe('RaidAttributionsComponent', () => {
  let store: {
    generalData: ReturnType<typeof signal<unknown>>;
    bossData: ReturnType<typeof signal<unknown>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    load: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let boardStore: { events: ReturnType<typeof signal<RaidEvent[]>>; loadEvent: ReturnType<typeof vi.fn> };
  let attributionsService: { setAttribution: ReturnType<typeof vi.fn>; clearAttribution: ReturnType<typeof vi.fn>; getBossesForEvent: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let wowClassService: { getAll: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const setup = (opts?: { user?: User | null; events?: RaidEvent[]; specs?: Spec[]; classes?: WowClass[]; bosses?: RaidBoss[] }) => {
    store = { generalData: signal(undefined), bossData: signal(undefined), isLoading: signal(false), load: vi.fn(), reload: vi.fn() };
    boardStore = { events: signal(opts?.events ?? [raidEvent()]), loadEvent: vi.fn() };
    attributionsService = {
      setAttribution: vi.fn().mockReturnValue(of(undefined)),
      clearAttribution: vi.fn().mockReturnValue(of(undefined)),
      getBossesForEvent: vi.fn().mockReturnValue(of(opts?.bosses ?? [])),
    };
    characterStore = { loadSpecs: vi.fn().mockReturnValue(of(opts?.specs ?? [spec()])) };
    wowClassService = { getAll: vi.fn().mockReturnValue(of(opts?.classes ?? [wowClass()])) };
    snackbar = { success: vi.fn(), error: vi.fn() };

    const guildId = 'g1';
    const branchId = 7;
    const eventId = 42;

    TestBed.configureTestingModule({
      imports: [RaidAttributionsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'branchId' ? String(branchId) : key === 'eventId' ? String(eventId) : null) } },
            paramMap: of(convertToParamMap({ id: guildId, branchId: String(branchId), eventId: String(eventId) })),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap({ id: guildId })),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(opts?.user === undefined ? fakeUser() : opts.user) } },
        { provide: RaidAttributionsStore, useValue: store },
        { provide: RaidBoardStore, useValue: boardStore },
        { provide: RaidEventAttributionsService, useValue: attributionsService },
        { provide: CharacterStore, useValue: characterStore },
        { provide: WowClassService, useValue: wowClassService },
        { provide: SnackbarService, useValue: snackbar },
      ],
    }).overrideComponent(RaidAttributionsComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidAttributionsComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('loads the store scoped to General (bossId null) when the route has no bossId', () => {
    setup();

    expect(store.load).toHaveBeenCalledWith('g1', 7, 42, null);
  });

  // ── breadcrumbs ──────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the raid event name as the detail crumb label when found', () => {
      const component = setup({ events: [raidEvent({ id: 42, name: 'Début de raid' })] });

      expect(component.breadcrumbs().at(-2)).toEqual(expect.objectContaining({ label: 'Début de raid' }));
    });

    it('falls back to the generic i18n key when the event is not (yet) loaded', () => {
      const component = setup({ events: [] });

      expect(component.breadcrumbs().at(-2)).toEqual(expect.objectContaining({ i18nKey: 'raidBuilder.detail.breadcrumb' }));
    });

    it('ends with the Assignments leaf crumb', () => {
      const component = setup();

      expect(component.breadcrumbs().at(-1)).toEqual({ i18nKey: 'raidBuilder.detail.hub.assignments' });
    });
  });

  // ── isOfficer ────────────────────────────────────────────────────────────

  describe('isOfficer', () => {
    it('is true for an Officer', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Officer) }).isOfficer()).toBe(true);
    });

    it('is false for a Roster member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Roster) }).isOfficer()).toBe(false);
    });

    it('is false when the guild is not on the user', () => {
      expect(setup({ user: { ...fakeUser(), guilds: [] } }).isOfficer()).toBe(false);
    });
  });

  // ── bossGroups ───────────────────────────────────────────────────────────

  describe('bossGroups', () => {
    it('is empty with no bosses', () => {
      expect(setup().bossGroups()).toEqual([]);
    });

    it('groups consecutive same-zone bosses together', () => {
      const bosses = [boss({ id: 14, raidZoneId: 4 }), boss({ id: 15, raidZoneId: 4 }), boss({ id: 20, raidZoneId: 5, raidZoneShortCode: 'TK' })];
      const component = setup({ bosses });

      expect(component.bossGroups()).toEqual([
        { raidZoneId: 4, raidZoneShortCode: 'SSC', bosses: [bosses[0], bosses[1]] },
        { raidZoneId: 5, raidZoneShortCode: 'TK', bosses: [bosses[2]] },
      ]);
    });
  });

  describe('bossLink', () => {
    it('builds the route to a specific boss under the current event', () => {
      expect(setup().bossLink(14)).toEqual(['/guilds', 'g1', '7', 'raids', '42', 'attributions', 14]);
    });
  });

  describe('zoneNameKey', () => {
    it('delegates to raidZoneNameKey', () => {
      expect(setup().zoneNameKey('SSC')).toBe('raidBuilder.zones.ssc');
    });
  });

  describe('zoneIconUrl', () => {
    it('delegates to raidZoneIconUrl', () => {
      expect(setup().zoneIconUrl('SSC')).toBe('/assets/images/raid-icons/ssc.jpg');
    });
  });

  describe('bossNameKey', () => {
    it('delegates to raidBossNameKey', () => {
      expect(setup().bossNameKey('Hydross the Unstable')).toBe('raidBuilder.bosses.hydrosstheunstable');
    });
  });

  describe('bossIconUrl', () => {
    it('delegates to raidBossIconUrl', () => {
      expect(setup().bossIconUrl('Hydross the Unstable')).toBe('/assets/images/boss-icons/hydrosstheunstable.png');
    });
  });

  // ── onGeneralSlotChange / onBossSlotChange ───────────────────────────────

  describe('onGeneralSlotChange', () => {
    it('clears the slot with bossId null when characterId is null', () => {
      const component = setup();

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: null });

      expect(attributionsService.clearAttribution).toHaveBeenCalledWith('g1', 7, 42, null, 1, 2, 0);
      expect(attributionsService.setAttribution).not.toHaveBeenCalled();
    });

    it('reloads the store after a successful clear', () => {
      const component = setup();

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: null });

      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error snackbar when clearing fails', () => {
      const component = setup();
      attributionsService.clearAttribution.mockReturnValue(throwError(() => new Error('boom')));

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: null });

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('sets the slot with bossId null when a characterId is given', () => {
      const component = setup();

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 55 });

      expect(attributionsService.setAttribution).toHaveBeenCalledWith('g1', 7, 42, null, 1, 2, 0, 55);
      expect(attributionsService.clearAttribution).not.toHaveBeenCalled();
    });

    it('shows a mapped error snackbar for a known server error code', () => {
      const component = setup();
      attributionsService.setAttribution.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'CharacterDoesNotMeetSlotRequirement' } })));

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 55 });

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.attributions.errors.CharacterDoesNotMeetSlotRequirement');
    });

    it('falls back to a generic error snackbar when the server error carries no code', () => {
      const component = setup();
      attributionsService.setAttribution.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.onGeneralSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 55 });

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  describe('onBossSlotChange', () => {
    it('sets the slot scoped to the current route bossId', () => {
      const component = setup();

      component.onBossSlotChange({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 55 });

      expect(attributionsService.setAttribution).toHaveBeenCalledWith('g1', 7, 42, component.bossId, 1, 2, 0, 55);
    });
  });
});
