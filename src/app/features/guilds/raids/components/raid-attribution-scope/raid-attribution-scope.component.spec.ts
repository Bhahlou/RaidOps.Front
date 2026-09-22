import { TestBed } from '@angular/core/testing';

import { RaidAttributionScopeComponent } from './raid-attribution-scope.component';
import { Spec } from '../../../../../shared/models/spec.model';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { SpecRole } from '../../../../../shared/models/spec-role.enum';
import { GuildAttributionDefinition } from '../../models/guild-attribution-definition.model';
import { AttributionCell } from '../../models/attribution-cell.model';
import { AttributionCellKind } from '../../models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../../models/attribution-icon-source.enum';
import { RaidEventAttributions, RaidEventAttributionFill, SeatedCharacter } from '../../models/raid-event-attributions.model';

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
  raidBossId: null,
  sectionIconSource: AttributionIconSource.None,
  sectionSpellId: null,
  sectionSpellIconUrl: null,
  sectionRaidMarker: null,
  sectionStaticRole: null,
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

describe('RaidAttributionScopeComponent', () => {
  const setup = (opts?: { data?: RaidEventAttributions; specs?: Spec[]; classes?: WowClass[]; isOfficer?: boolean }) => {
    TestBed.configureTestingModule({ imports: [RaidAttributionScopeComponent] }).overrideComponent(RaidAttributionScopeComponent, {
      set: { template: '', imports: [] },
    });

    const fixture = TestBed.createComponent(RaidAttributionScopeComponent);
    if (opts?.data) fixture.componentRef.setInput('data', opts.data);
    const classColorById = new Map((opts?.classes ?? [wowClass()]).map((c) => [c.id, '#' + c.color]));
    fixture.componentRef.setInput('specs', opts?.specs ?? [spec()]);
    fixture.componentRef.setInput('classColorById', classColorById);
    fixture.componentRef.setInput('isOfficer', opts?.isOfficer ?? false);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── sections ─────────────────────────────────────────────────────────────

  describe('sections', () => {
    it('is empty before any data is set', () => {
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

  describe('pairedCells', () => {
    // pairedCells only ever sees repeatingCells' output (from the first name-slot cell onward) —
    // an icon cell *before* that first name-slot is a head icon, already excluded upstream, so
    // every scenario here starts with a name-slot cell.

    it('puts a lone leading name-slot in its own single-cell group', () => {
      const def = definition({ cells: [nameSlotCell({ id: 1 })] });

      expect(setup().pairedCells(def).map((g) => g.map((c) => c.id))).toEqual([[1]]);
    });

    it('groups a later icon cell together with the name-slot that follows it, in its own group', () => {
      const def = definition({ cells: [nameSlotCell({ id: 1 }), iconCell({ id: 2 }), nameSlotCell({ id: 3 })] });

      expect(setup().pairedCells(def).map((g) => g.map((c) => c.id))).toEqual([[1], [2, 3]]);
    });

    it('starts a new group at every icon cell', () => {
      const def = definition({
        cells: [nameSlotCell({ id: 1 }), iconCell({ id: 2 }), nameSlotCell({ id: 3 }), iconCell({ id: 4 }), nameSlotCell({ id: 5 })],
      });

      expect(setup().pairedCells(def).map((g) => g.map((c) => c.id))).toEqual([[1], [2, 3], [4, 5]]);
    });

    it('is empty when there is no name-slot cell', () => {
      const def = definition({ cells: [iconCell({ id: 1 })] });

      expect(setup().pairedCells(def)).toEqual([]);
    });
  });

  // ── instanceCount / instanceIndexes ──────────────────────────────────────

  describe('instanceCount', () => {
    it('treats an unrestricted fixed row as usable (1) before any data is set', () => {
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
    it('is just the unassign sentinel before any data is set', () => {
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

    it('sizes for the row with the most head icons across the whole scope', () => {
      const oneIcon = definition({ id: 1, cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] });
      const twoIcons = definition({ id: 2, cells: [iconCell({ id: 3 }), iconCell({ id: 4 }), nameSlotCell({ id: 5 })] });
      const component = setup({ data: { definitions: [oneIcon, twoIcons], fills: [], seatedCharacters: [] } });

      // 2 icons * 22px + 1 gap * 4px = 48px.
      expect(component.headIconGutterWidth()).toBe('48px');
    });
  });

  // ── onSlotChange ─────────────────────────────────────────────────────────

  describe('onSlotChange', () => {
    it('emits characterId as null when clearing with null', () => {
      const component = setup();
      const spy = vi.fn();
      component.slotChange.subscribe(spy);

      component.onSlotChange(1, 2, 0, null);

      expect(spy).toHaveBeenCalledWith({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: null });
    });

    it('normalizes the UNASSIGNED sentinel to null', () => {
      const component = setup();
      const spy = vi.fn();
      component.slotChange.subscribe(spy);

      component.onSlotChange(1, 2, 0, UNASSIGNED);

      expect(spy).toHaveBeenCalledWith({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: null });
    });

    it('emits the given characterId when one is provided', () => {
      const component = setup();
      const spy = vi.fn();
      component.slotChange.subscribe(spy);

      component.onSlotChange(1, 2, 0, 55);

      expect(spy).toHaveBeenCalledWith({ definitionId: 1, cellId: 2, instanceIndex: 0, characterId: 55 });
    });
  });
});
