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
import { SpecRole } from '../../../../../shared/models/spec-role.enum';
import { RaidAttributionsStore } from '../../stores/raid-attributions.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEventAttributionsService } from '../../services/raid-event-attributions.service';
import { GuildAttributionDefinition } from '../../models/guild-attribution-definition.model';
import { AttributionCell } from '../../models/attribution-cell.model';
import { AttributionCellKind } from '../../models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../../models/attribution-icon-source.enum';
import { RaidEventAttributions, RaidEventAttributionFill, SeatedCharacter } from '../../models/raid-event-attributions.model';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';

const UNASSIGNED = -1;

const iconCell = (overrides?: Partial<AttributionCell>): AttributionCell => ({
  id: 1,
  kind: AttributionCellKind.Icon,
  iconSource: AttributionIconSource.RaidMarker,
  spellId: null,
  spellIconUrl: null,
  raidMarker: null,
  staticRole: null,
  slotLabel: null,
  requiredClassIds: [],
  requiredRoles: [],
  requiredSpecIds: [],
  ...overrides,
});

const nameSlotCell = (overrides?: Partial<AttributionCell>): AttributionCell => ({
  id: 2,
  kind: AttributionCellKind.NameSlot,
  iconSource: AttributionIconSource.None,
  spellId: null,
  spellIconUrl: null,
  raidMarker: null,
  staticRole: null,
  slotLabel: 'De',
  requiredClassIds: [],
  requiredRoles: [],
  requiredSpecIds: [],
  ...overrides,
});

const definition = (overrides?: Partial<GuildAttributionDefinition>): GuildAttributionDefinition => ({
  id: 1,
  label: 'Innervate',
  section: null,
  isRepeatable: false,
  cells: [nameSlotCell()],
  sortOrder: 0,
  ...overrides,
});

const fill = (overrides?: Partial<RaidEventAttributionFill>): RaidEventAttributionFill => ({
  definitionId: 1,
  cellId: 2,
  instanceIndex: 0,
  characterId: 100,
  characterName: 'Aphrodisia',
  classId: 9,
  ...overrides,
});

const seated = (overrides?: Partial<SeatedCharacter>): SeatedCharacter => ({ characterId: 100, name: 'Aphrodisia', classId: 9, specId: 265, ...overrides });

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
  let store: { data: ReturnType<typeof signal<RaidEventAttributions | undefined>>; isLoading: ReturnType<typeof signal<boolean>>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let boardStore: { events: ReturnType<typeof signal<RaidEvent[]>>; loadEvent: ReturnType<typeof vi.fn> };
  let attributionsService: { setAttribution: ReturnType<typeof vi.fn>; clearAttribution: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let wowClassService: { getAll: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  const setup = (opts?: { user?: User | null; data?: RaidEventAttributions; events?: RaidEvent[]; specs?: Spec[]; classes?: WowClass[] }) => {
    store = { data: signal(opts?.data), isLoading: signal(false), load: vi.fn(), reload: vi.fn() };
    boardStore = { events: signal(opts?.events ?? [raidEvent()]), loadEvent: vi.fn() };
    attributionsService = { setAttribution: vi.fn().mockReturnValue(of(undefined)), clearAttribution: vi.fn().mockReturnValue(of(undefined)) };
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
            snapshot: { paramMap: { get: (key: string) => (key === 'branchId' ? String(branchId) : key === 'eventId' ? String(eventId) : guildId) } },
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

  // ── sections ─────────────────────────────────────────────────────────────

  describe('sections', () => {
    it('is empty before the store has any data yet', () => {
      expect(setup().sections()).toEqual([]);
    });

    it('is empty with no definitions', () => {
      expect(setup({ data: { definitions: [], fills: [], seatedCharacters: [] } }).sections()).toEqual([]);
    });

    it('groups consecutive same-section definitions', () => {
      const defs = [definition({ id: 1, section: 'Curses' }), definition({ id: 2, section: 'Curses' }), definition({ id: 3, section: 'Personals' })];
      const component = setup({ data: { definitions: defs, fills: [], seatedCharacters: [seated()] } });

      expect(component.sections()).toEqual([
        { label: 'Curses', definitions: [defs[0], defs[1]] },
        { label: 'Personals', definitions: [defs[2]] },
      ]);
    });

    it('drops a definition whose instanceCount is 0 (nobody eligible, nothing filled)', () => {
      const unfillable = definition({ id: 1, cells: [nameSlotCell({ requiredClassIds: [999] })] });
      const component = setup({ data: { definitions: [unfillable], fills: [], seatedCharacters: [seated()] } });

      expect(component.sections()).toEqual([]);
    });
  });

  // ── headCells / repeatingCells ───────────────────────────────────────────

  describe('headCells', () => {
    it('returns every cell before the first name-slot cell', () => {
      const def = definition({ cells: [iconCell({ id: 1 }), iconCell({ id: 2 }), nameSlotCell({ id: 3 })] });

      expect(setup().headCells(def).map((c) => c.id)).toEqual([1, 2]);
    });

    it('returns all cells when there is no name-slot cell', () => {
      const def = definition({ cells: [iconCell({ id: 1 }), iconCell({ id: 2 })] });

      expect(setup().headCells(def).map((c) => c.id)).toEqual([1, 2]);
    });
  });

  describe('repeatingCells', () => {
    it('returns every cell from the first name-slot cell onward, in order', () => {
      const def = definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 }), iconCell({ id: 3 }), nameSlotCell({ id: 4 })] });

      expect(setup().repeatingCells(def).map((c) => c.id)).toEqual([2, 3, 4]);
    });

    it('is empty when there is no name-slot cell', () => {
      const def = definition({ cells: [iconCell({ id: 1 })] });

      expect(setup().repeatingCells(def)).toEqual([]);
    });
  });

  // ── instanceCount / instanceIndexes ──────────────────────────────────────

  describe('instanceCount', () => {
    it('treats an unrestricted fixed row as usable (1) before the store has any data yet', () => {
      const component = setup();

      expect(component.instanceCount(definition())).toBe(1);
    });

    it('is the eligible count for a repeatable row with a restricted counting cell', () => {
      const def = definition({ id: 1, isRepeatable: true, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const seatedChars = [seated({ characterId: 100, classId: 9 }), seated({ characterId: 101, classId: 9 })];
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: seatedChars } });

      expect(component.instanceCount(def)).toBe(2);
    });

    it('is 0 for a repeatable row with nobody eligible and nothing filled', () => {
      const def = definition({ id: 1, isRepeatable: true, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated({ classId: 1 })] } });

      expect(component.instanceCount(def)).toBe(0);
    });

    it('floors to the highest filled instance index + 1 even if eligibility later shrinks', () => {
      const def = definition({ id: 1, isRepeatable: true, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const fills = [fill({ definitionId: 1, cellId: 2, instanceIndex: 2, characterId: 100 })];
      const component = setup({ data: { definitions: [def], fills, seatedCharacters: [] } });

      expect(component.instanceCount(def)).toBe(3);
    });

    it('defaults to 1 for a repeatable row with no restricted counting cell', () => {
      const def = definition({ id: 1, isRepeatable: true, cells: [nameSlotCell({ id: 2 })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [] } });

      expect(component.instanceCount(def)).toBe(1);
    });

    it('is 1 for a fixed row with at least one unrestricted slot', () => {
      const def = definition({ id: 1, isRepeatable: false, cells: [nameSlotCell({ id: 2 })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [] } });

      expect(component.instanceCount(def)).toBe(1);
    });

    it('is 1 for a fixed row with a restricted slot that has ≥1 eligible', () => {
      const def = definition({ id: 1, isRepeatable: false, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated({ classId: 9 })] } });

      expect(component.instanceCount(def)).toBe(1);
    });

    it('is 0 for a fixed row whose only slot is restricted with nobody eligible', () => {
      const def = definition({ id: 1, isRepeatable: false, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated({ classId: 1 })] } });

      expect(component.instanceCount(def)).toBe(0);
    });

    it('stays at 1 for a fixed row that is already filled, even with nobody eligible', () => {
      const def = definition({ id: 1, isRepeatable: false, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const fills = [fill({ definitionId: 1, cellId: 2, instanceIndex: 0 })];
      const component = setup({ data: { definitions: [def], fills, seatedCharacters: [] } });

      expect(component.instanceCount(def)).toBe(1);
    });

    it('is 1 for a fixed, pure-icon row with no name-slot cells at all', () => {
      const def = definition({ id: 1, isRepeatable: false, cells: [iconCell({ id: 1 })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [] } });

      expect(component.instanceCount(def)).toBe(1);
    });
  });

  describe('instanceIndexes', () => {
    it('returns 0..count-1', () => {
      const def = definition({ id: 1, isRepeatable: true, cells: [nameSlotCell({ id: 2, requiredClassIds: [9] })] });
      const seatedChars = [seated({ characterId: 100, classId: 9 }), seated({ characterId: 101, classId: 9 }), seated({ characterId: 102, classId: 9 })];
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: seatedChars } });

      expect(component.instanceIndexes(def)).toEqual([0, 1, 2]);
    });
  });

  // ── characterOptions ─────────────────────────────────────────────────────

  describe('characterOptions', () => {
    it('is just the unassign sentinel before the store has any data yet', () => {
      const component = setup();

      expect(component.characterOptions(nameSlotCell())).toEqual([{ value: UNASSIGNED, label: '' }]);
    });

    it('starts with an empty-label unassign sentinel', () => {
      const component = setup({ data: { definitions: [], fills: [], seatedCharacters: [] } });

      expect(component.characterOptions(nameSlotCell())[0]).toEqual({ value: UNASSIGNED, label: '' });
    });

    it('filters by requiredClassIds', () => {
      const seatedChars = [seated({ characterId: 1, classId: 9 }), seated({ characterId: 2, classId: 1 })];
      const component = setup({ data: { definitions: [], fills: [], seatedCharacters: seatedChars } });

      expect(component.characterOptions(nameSlotCell({ requiredClassIds: [9] })).map((o) => o.value)).toEqual([UNASSIGNED, 1]);
    });

    it('filters by requiredSpecIds', () => {
      const seatedChars = [seated({ characterId: 1, specId: 265 }), seated({ characterId: 2, specId: 267 })];
      const component = setup({ data: { definitions: [], fills: [], seatedCharacters: seatedChars } });

      expect(component.characterOptions(nameSlotCell({ requiredSpecIds: [265] })).map((o) => o.value)).toEqual([UNASSIGNED, 1]);
    });

    it('filters by requiredRoles, resolved via the seeded spec table', () => {
      const seatedChars = [seated({ characterId: 1, specId: 265 }), seated({ characterId: 2, specId: 999 })];
      const component = setup({
        data: { definitions: [], fills: [], seatedCharacters: seatedChars },
        specs: [spec({ id: 265, role: 'RangedDps' }), spec({ id: 999, role: 'Tank', classId: 1 })],
      });

      expect(component.characterOptions(nameSlotCell({ requiredRoles: [SpecRole.RangedDps] })).map((o) => o.value)).toEqual([UNASSIGNED, 1]);
    });

    it("labels each eligible character with their name and their class's color", () => {
      const component = setup({
        data: { definitions: [], fills: [], seatedCharacters: [seated({ characterId: 1, name: 'Aphrodisia', classId: 9 })] },
        classes: [wowClass({ id: 9, color: '9482C9' })],
      });

      expect(component.characterOptions(nameSlotCell())[1]).toEqual({ value: 1, label: 'Aphrodisia', color: '#9482C9' });
    });

    it('sets color to null for a class with no known color', () => {
      const component = setup({ data: { definitions: [], fills: [], seatedCharacters: [seated({ characterId: 1, classId: 999 })] }, classes: [] });

      expect(component.characterOptions(nameSlotCell())[1].color).toBeNull();
    });
  });

  // ── filledCharacterId ────────────────────────────────────────────────────

  describe('filledCharacterId', () => {
    it('returns the matching fill characterId', () => {
      const component = setup({ data: { definitions: [], fills: [fill({ cellId: 2, instanceIndex: 0, characterId: 55 })], seatedCharacters: [] } });

      expect(component.filledCharacterId(2, 0)).toBe(55);
    });

    it('returns UNASSIGNED when nothing matches', () => {
      const component = setup({ data: { definitions: [], fills: [], seatedCharacters: [] } });

      expect(component.filledCharacterId(2, 0)).toBe(UNASSIGNED);
    });
  });

  // ── pickerWidth ──────────────────────────────────────────────────────────

  describe('pickerWidth', () => {
    it('is sized off the longest currently-displayed text (picked name or placeholder), not the full eligible pool', () => {
      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2, slotLabel: 'De' })] });
      const fills = [fill({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 1 })];
      const seatedChars = [seated({ characterId: 1, name: 'Aphrodisia' }), seated({ characterId: 2, name: 'Someone Much Longer' })];
      const component = setup({ data: { definitions: [def], fills, seatedCharacters: seatedChars } });

      // Only "Aphrodisia" (10 chars) is actually displayed — the unpicked, much longer eligible
      // name never enters the calculation. Canvas text measurement isn't available in jsdom, so
      // this falls back to the component's own `text.length * 8` approximation.
      expect(component.pickerWidth()).toBe(`${10 * 8 + 46}px`);
    });

    it('falls back to the slot placeholder length while nothing is assigned', () => {
      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2, slotLabel: 'Cible' })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated()] } });

      expect(component.pickerWidth()).toBe(`${5 * 8 + 46}px`);
    });

    it('is the 0-length floor while unassigned with no slotLabel either', () => {
      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2, slotLabel: null })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated()] } });

      expect(component.pickerWidth()).toBe('46px');
    });

    it('is the 0-length floor for a fill whose character is no longer among the eligible options', () => {
      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2, slotLabel: null })] });
      const fills = [fill({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 999 })];
      const component = setup({ data: { definitions: [def], fills, seatedCharacters: [seated({ characterId: 1 })] } });

      expect(component.pickerWidth()).toBe('46px');
    });

    it('is 46px (0-length floor) with no name-slot cells anywhere', () => {
      const def = definition({ id: 1, cells: [iconCell()] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [] } });

      expect(component.pickerWidth()).toBe('46px');
    });

    it('skips an icon cell interleaved between two name-slot cells', () => {
      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2, slotLabel: 'De' }), iconCell({ id: 3 }), nameSlotCell({ id: 4, slotLabel: 'Cible' })] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [seated()] } });

      // Only the two slotLabel placeholders ("De" 2 chars, "Cible" 5 chars) factor in — the
      // interleaved icon cell has no text of its own to measure.
      expect(component.pickerWidth()).toBe(`${5 * 8 + 46}px`);
    });

    // Kept last in this describe block: it permanently swaps the module-level cached canvas
    // context (`measureCanvasContext`) away from jsdom's real (null, "not implemented") one for
    // the rest of this file's run, which would silently break every other pickerWidth test above
    // that relies on the `text.length * 8` fallback if it ran any earlier.
    it('uses the canvas 2D context to measure text when one is available (e.g. a real browser)', () => {
      const measureText = vi.fn((text: string) => ({ width: text.length * 100 }));
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ font: '', measureText } as unknown as CanvasRenderingContext2D);

      const def = definition({ id: 1, cells: [nameSlotCell({ id: 2 })] });
      const fills = [fill({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 1 })];
      const component = setup({ data: { definitions: [def], fills, seatedCharacters: [seated({ characterId: 1, name: 'Ab' })] } });

      expect(component.pickerWidth()).toBe(`${2 * 100 + 46}px`);
      expect(measureText).toHaveBeenCalledWith('Ab');
    });
  });

  // ── headIconGutterWidth ──────────────────────────────────────────────────

  describe('headIconGutterWidth', () => {
    it('is 0px with no icon cells anywhere', () => {
      const def = definition({ id: 1, cells: [nameSlotCell()] });
      const component = setup({ data: { definitions: [def], fills: [], seatedCharacters: [] } });

      expect(component.headIconGutterWidth()).toBe('0px');
    });

    it('sizes for the row with the most head icons across the whole page', () => {
      const oneIcon = definition({ id: 1, cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] });
      const twoIcons = definition({ id: 2, cells: [iconCell({ id: 3 }), iconCell({ id: 4 }), nameSlotCell({ id: 5 })] });
      const component = setup({ data: { definitions: [oneIcon, twoIcons], fills: [], seatedCharacters: [] } });

      // 2 icons * 22px + 1 gap * 4px = 48px.
      expect(component.headIconGutterWidth()).toBe('48px');
    });
  });

  // ── onSlotChange ─────────────────────────────────────────────────────────

  describe('onSlotChange', () => {
    it('clears the slot when characterId is null', () => {
      const component = setup();

      component.onSlotChange(1, 2, 0, null);

      expect(attributionsService.clearAttribution).toHaveBeenCalledWith('g1', 7, 42, 1, 2, 0);
      expect(attributionsService.setAttribution).not.toHaveBeenCalled();
    });

    it('clears the slot when characterId is UNASSIGNED', () => {
      const component = setup();

      component.onSlotChange(1, 2, 0, UNASSIGNED);

      expect(attributionsService.clearAttribution).toHaveBeenCalledWith('g1', 7, 42, 1, 2, 0);
    });

    it('reloads the store after a successful clear', () => {
      const component = setup();

      component.onSlotChange(1, 2, 0, null);

      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error snackbar when clearing fails', () => {
      const component = setup();
      attributionsService.clearAttribution.mockReturnValue(throwError(() => new Error('boom')));

      component.onSlotChange(1, 2, 0, null);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('sets the slot when a characterId is given', () => {
      const component = setup();

      component.onSlotChange(1, 2, 0, 55);

      expect(attributionsService.setAttribution).toHaveBeenCalledWith('g1', 7, 42, 1, 2, 0, 55);
      expect(attributionsService.clearAttribution).not.toHaveBeenCalled();
    });

    it('reloads the store after a successful set', () => {
      const component = setup();

      component.onSlotChange(1, 2, 0, 55);

      expect(store.reload).toHaveBeenCalled();
    });

    it('shows a mapped error snackbar for a known server error code', () => {
      const component = setup();
      attributionsService.setAttribution.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'CharacterDoesNotMeetSlotRequirement' } })));

      component.onSlotChange(1, 2, 0, 55);

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.attributions.errors.CharacterDoesNotMeetSlotRequirement');
    });

    it('falls back to a generic error snackbar when the server error carries no code', () => {
      const component = setup();
      attributionsService.setAttribution.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.onSlotChange(1, 2, 0, 55);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });
});
