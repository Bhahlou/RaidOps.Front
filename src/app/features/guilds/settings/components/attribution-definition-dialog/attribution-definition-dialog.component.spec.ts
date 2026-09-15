import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AttributionDefinitionDialogComponent, AttributionDefinitionDialogData } from './attribution-definition-dialog.component';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { Spec } from '../../../../../shared/models/spec.model';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { SpecRole } from '../../../../../shared/models/spec-role.enum';
import { GuildAttributionDefinition } from '../../../raids/models/guild-attribution-definition.model';
import { AttributionCell } from '../../../raids/models/attribution-cell.model';
import { AttributionCellKind } from '../../../raids/models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../../raids/models/raid-marker-icon.enum';
import { Spell } from '../../../raids/models/spell.model';

const wowClass = (overrides?: Partial<WowClass>): WowClass => ({ id: 1, name: 'Warrior', color: 'C79C6E', firstExpansionId: 1, ...overrides });

const spec = (overrides?: Partial<Spec>): Spec => ({ id: 71, name: 'Arms', role: 'MeleeDps', classId: 1, iconUrl: 'https://cdn/arms.jpg', ...overrides });

const iconCell = (overrides?: Partial<AttributionCell>): AttributionCell => ({
  id: 1,
  kind: AttributionCellKind.Icon,
  iconSource: AttributionIconSource.RaidMarker,
  spellId: null,
  spellIconUrl: null,
  raidMarker: RaidMarkerIcon.Skull,
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
  section: 'Personals',
  isRepeatable: true,
  cells: [iconCell(), nameSlotCell()],
  sortOrder: 0,
  ...overrides,
});

const spell = (overrides?: Partial<Spell>): Spell => ({ id: 5, name: 'Innervate', iconUrl: 'https://cdn/innervate.jpg', ...overrides });

describe('AttributionDefinitionDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let definitionsService: { createDefinition: ReturnType<typeof vi.fn>; updateDefinition: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let wowClassService: { getAll: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let translate: ReturnType<typeof vi.fn>;

  const setup = (data: Partial<AttributionDefinitionDialogData> = {}, specs: Spec[] = [spec()], classes: WowClass[] = [wowClass()]) => {
    dialogRef = { close: vi.fn() };
    definitionsService = { createDefinition: vi.fn().mockReturnValue(of(undefined)), updateDefinition: vi.fn().mockReturnValue(of(undefined)) };
    characterStore = { loadSpecs: vi.fn().mockReturnValue(of(specs)) };
    wowClassService = { getAll: vi.fn().mockReturnValue(of(classes)) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    translate = vi.fn((key: string, params?: Record<string, unknown>) => (params ? `${key}::${JSON.stringify(params)}` : key));

    const fullData: AttributionDefinitionDialogData = {
      guildId: 'guild-1',
      expansionId: 2,
      definition: null,
      cloneFrom: null,
      existingSections: [],
      ...data,
    };

    TestBed.configureTestingModule({
      imports: [AttributionDefinitionDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: fullData },
        { provide: AttributionDefinitionsService, useValue: definitionsService },
        { provide: CharacterStore, useValue: characterStore },
        { provide: WowClassService, useValue: wowClassService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { translate } },
      ],
    }).overrideComponent(AttributionDefinitionDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(AttributionDefinitionDialogComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── isEditMode / prefill ─────────────────────────────────────────────────

  describe('isEditMode and prefill', () => {
    it('is false, with blank fields, for a fresh create', () => {
      const component = setup({ definition: null, cloneFrom: null });

      expect(component.isEditMode).toBe(false);
      expect(component.label()).toBe('');
      expect(component.section()).toBe('');
      expect(component.isRepeatable()).toBe(false);
      expect(component.cells()).toEqual([]);
    });

    it('is true and prefills every field from the row being edited', () => {
      const def = definition({ label: 'Innervate', section: 'Personals', isRepeatable: true, cells: [iconCell(), nameSlotCell()] });
      const component = setup({ definition: def, cloneFrom: null });

      expect(component.isEditMode).toBe(true);
      expect(component.label()).toBe('Innervate');
      expect(component.section()).toBe('Personals');
      expect(component.isRepeatable()).toBe(true);
      expect(component.cells()).toHaveLength(2);
      expect(component.cells()[0].key).toBe('existing-1');
      expect(component.cells()[1].slotLabel).toBe('De');
    });

    it('is false, and prefills from cloneFrom with a translated "(copy)" label, for a duplicate', () => {
      const source = definition({ label: 'Innervate', section: 'Personals', isRepeatable: true });
      const component = setup({ definition: null, cloneFrom: source });

      expect(component.isEditMode).toBe(false);
      expect(component.label()).toBe(`guildSettings.attributions.dialog.duplicateLabel::${JSON.stringify({ label: 'Innervate' })}`);
      expect(component.section()).toBe('Personals');
      expect(component.isRepeatable()).toBe(true);
      expect(component.cells()).toHaveLength(2);
    });

    it('defaults a blank slotLabel to an empty string, not null', () => {
      const def = definition({ cells: [nameSlotCell({ slotLabel: null })] });
      const component = setup({ definition: def });

      expect(component.cells()[0].slotLabel).toBe('');
    });
  });

  // ── classes / classOptions ───────────────────────────────────────────────

  describe('classes', () => {
    it('excludes classes not yet playable on this branch expansion', () => {
      const component = setup({ expansionId: 1 }, [], [wowClass({ id: 1, name: 'Warrior', firstExpansionId: 1 }), wowClass({ id: 10, name: 'Monk', firstExpansionId: 5 })]);

      expect(component.classes().map((c) => c.id)).toEqual([1]);
    });

    it('translates and alphabetically sorts class names', () => {
      const component = setup({}, [], [wowClass({ id: 9, name: 'Warlock' }), wowClass({ id: 2, name: 'Paladin' })]);

      expect(component.classes().map((c) => c.name)).toEqual(['guildSettings.attributions.classes.paladin', 'guildSettings.attributions.classes.warlock']);
    });

    it('falls back to the raw class id for a class id with no known icon/translation slug', () => {
      const component = setup({}, [], [wowClass({ id: 999, name: 'Unknown Future Class' })]);

      expect(component.classes()).toEqual([{ id: 999, name: '999' }]);
    });
  });

  describe('classOptions', () => {
    it('maps each class to a value/label/iconUrl option', () => {
      const component = setup({}, [], [wowClass({ id: 1, name: 'Warrior' })]);

      expect(component.classOptions()).toEqual([{ value: 1, label: 'guildSettings.attributions.classes.warrior', iconUrl: expect.stringContaining('classicon_warrior') }]);
    });
  });

  // ── roleOptions ──────────────────────────────────────────────────────────

  describe('roleOptions', () => {
    it('lists all 4 roles, translated, in Tank/Healer/Ranged/Melee order', () => {
      const component = setup();

      expect(component.roleOptions().map((o) => o.value)).toEqual([SpecRole.Tank, SpecRole.Healer, SpecRole.RangedDps, SpecRole.MeleeDps]);
      expect(component.roleOptions().map((o) => o.label)).toEqual([
        'guildSettings.attributions.dialog.roleTank',
        'guildSettings.attributions.dialog.roleHealer',
        'guildSettings.attributions.dialog.roleRanged',
        'guildSettings.attributions.dialog.roleMelee',
      ]);
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    it('is false with no cells', () => {
      const component = setup({ definition: definition({ cells: [] }) });

      expect(component.canSubmit()).toBe(false);
    });

    it('is false while submitting', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell()] }) });
      component.submitting.set(true);

      expect(component.canSubmit()).toBe(false);
    });

    it('is true when every cell is valid', () => {
      const component = setup({ definition: definition({ cells: [iconCell(), nameSlotCell()] }) });

      expect(component.canSubmit()).toBe(true);
    });

    it.each([
      [AttributionIconSource.None, {}],
      [AttributionIconSource.Spell, { spellId: null }],
      [AttributionIconSource.RaidMarker, { raidMarker: null }],
      [AttributionIconSource.StaticRole, { staticRole: null }],
    ])('is false for an icon cell with source %s but no value set', (iconSource, patch) => {
      const component = setup({ definition: definition({ cells: [iconCell({ iconSource, ...patch })] }) });

      expect(component.canSubmit()).toBe(false);
    });

    it('is true for a name-slot cell regardless of its restrictions', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell({ requiredClassIds: [1], requiredRoles: [SpecRole.Tank] })] }) });

      expect(component.canSubmit()).toBe(true);
    });
  });

  // ── specOptionsFor ───────────────────────────────────────────────────────

  describe('specOptionsFor', () => {
    it('excludes specs of classes not yet playable on this branch', () => {
      const component = setup(
        {},
        [spec({ id: 71, classId: 1, name: 'Arms' }), spec({ id: 253, classId: 3, name: 'Beast Mastery' })],
        [wowClass({ id: 1, name: 'Warrior', firstExpansionId: 1 })],
      );

      expect(component.specOptionsFor(nameSlotCell()).map((o) => o.value)).toEqual([71]);
    });

    it('scopes to the cell requiredClassIds when set', () => {
      const component = setup(
        {},
        [spec({ id: 71, classId: 1, name: 'Arms' }), spec({ id: 65, classId: 2, name: 'Holy' })],
        [wowClass({ id: 1, name: 'Warrior' }), wowClass({ id: 2, name: 'Paladin' })],
      );

      expect(component.specOptionsFor(nameSlotCell({ requiredClassIds: [2] })).map((o) => o.value)).toEqual([65]);
    });

    it('falls back to every branch class when requiredClassIds is empty', () => {
      // classes() sorts by translated name first ("...paladin" < "...warrior"), so Paladin's
      // spec is expected before Warrior's regardless of the wowClasses fixture's own order.
      const component = setup({}, [spec({ id: 71, classId: 1 }), spec({ id: 65, classId: 2 })], [wowClass({ id: 1, name: 'Warrior' }), wowClass({ id: 2, name: 'Paladin' })]);

      expect(component.specOptionsFor(nameSlotCell({ requiredClassIds: [] })).map((o) => o.value)).toEqual([65, 71]);
    });

    it('sorts by class order first, then translated spec name', () => {
      // Same reasoning: classes() alphabetizes by translated name ("...hunter" < "...warrior"),
      // so Hunter's spec sorts before Warrior's despite the wowClasses fixture listing Warrior first.
      const component = setup(
        {},
        [spec({ id: 253, classId: 3, name: 'Beast Mastery' }), spec({ id: 71, classId: 1, name: 'Arms' }), spec({ id: 72, classId: 1, name: 'Fury' })],
        [wowClass({ id: 1, name: 'Warrior' }), wowClass({ id: 3, name: 'Hunter' })],
      );

      expect(component.specOptionsFor(nameSlotCell()).map((o) => o.value)).toEqual([253, 71, 72]);
    });

    it('groups each option by its translated class name', () => {
      const component = setup({}, [spec({ id: 71, classId: 1, name: 'Arms' })], [wowClass({ id: 1, name: 'Warrior' })]);

      expect(component.specOptionsFor(nameSlotCell()).at(0)?.group).toBe('guildSettings.attributions.classes.warrior');
    });
  });

  // ── addIconCell / addNameSlotCell / removeCell / moveCell ───────────────

  describe('addIconCell', () => {
    it('appends a blank icon cell', () => {
      const component = setup();

      component.addIconCell();

      expect(component.cells()).toHaveLength(1);
      expect(component.cells()[0].kind).toBe(AttributionCellKind.Icon);
      expect(component.cells()[0].iconSource).toBe(AttributionIconSource.None);
    });
  });

  describe('addNameSlotCell', () => {
    it('appends a blank name-slot cell', () => {
      const component = setup();

      component.addNameSlotCell();

      expect(component.cells()).toHaveLength(1);
      expect(component.cells()[0].kind).toBe(AttributionCellKind.NameSlot);
    });
  });

  describe('removeCell', () => {
    it('removes the cell with the matching key', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] }) });
      const [, second] = component.cells();

      component.removeCell('existing-1');

      expect(component.cells()).toEqual([second]);
    });
  });

  describe('moveCell', () => {
    it('swaps a cell with its next sibling', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] }) });
      const [first, second] = component.cells();

      component.moveCell('existing-1', 1);

      expect(component.cells()).toEqual([second, first]);
    });

    it('swaps a cell with its previous sibling', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] }) });
      const [first, second] = component.cells();

      component.moveCell('existing-2', -1);

      expect(component.cells()).toEqual([second, first]);
    });

    it('does nothing when already at the top', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] }) });
      const before = component.cells();

      component.moveCell('existing-1', -1);

      expect(component.cells()).toEqual(before);
    });

    it('does nothing when already at the bottom', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 }), nameSlotCell({ id: 2 })] }) });
      const before = component.cells();

      component.moveCell('existing-2', 1);

      expect(component.cells()).toEqual(before);
    });

    it('does nothing for an unknown key', () => {
      const component = setup({ definition: definition({ cells: [iconCell({ id: 1 })] }) });
      const before = component.cells();

      component.moveCell('missing', 1);

      expect(component.cells()).toEqual(before);
    });
  });

  // ── onSpellSelected / onMarkerSelected / onStaticRoleSelected ───────────

  describe('onSpellSelected', () => {
    it('sets the spell icon source and clears the other sources', () => {
      const component = setup();
      component.addIconCell();
      const key = component.cells()[0].key;

      component.onSpellSelected(key, spell({ id: 42, iconUrl: 'https://cdn/spell.jpg' }));

      expect(component.cells()[0]).toMatchObject({ iconSource: AttributionIconSource.Spell, spellId: 42, spellIconUrl: 'https://cdn/spell.jpg', raidMarker: null, staticRole: null });
    });

    it('fills in the empty label with the spell name', () => {
      const component = setup();
      component.addIconCell();

      component.onSpellSelected(component.cells()[0].key, spell({ name: 'Innervate' }));

      expect(component.label()).toBe('Innervate');
    });

    it('does not overwrite an existing label', () => {
      const component = setup();
      component.label.set('Custom label');
      component.addIconCell();

      component.onSpellSelected(component.cells()[0].key, spell({ name: 'Innervate' }));

      expect(component.label()).toBe('Custom label');
    });
  });

  describe('onMarkerSelected', () => {
    it('sets the raid marker icon source and clears the other sources', () => {
      const component = setup();
      component.addIconCell();

      component.onMarkerSelected(component.cells()[0].key, RaidMarkerIcon.Star);

      expect(component.cells()[0]).toMatchObject({ iconSource: AttributionIconSource.RaidMarker, raidMarker: RaidMarkerIcon.Star, spellId: null, spellIconUrl: null, staticRole: null });
    });

    it('leaves every other cell untouched', () => {
      const component = setup();
      component.addIconCell();
      component.addIconCell();
      const [firstKey, secondKey] = component.cells().map((c) => c.key);

      component.onMarkerSelected(secondKey, RaidMarkerIcon.Star);

      expect(component.cells().find((c) => c.key === firstKey)).toMatchObject({ iconSource: AttributionIconSource.None, raidMarker: null });
    });
  });

  describe('onStaticRoleSelected', () => {
    it('sets the static role icon source and clears the other sources', () => {
      const component = setup();
      component.addIconCell();

      component.onStaticRoleSelected(component.cells()[0].key, SpecRole.Tank);

      expect(component.cells()[0]).toMatchObject({ iconSource: AttributionIconSource.StaticRole, staticRole: SpecRole.Tank, spellId: null, spellIconUrl: null, raidMarker: null });
    });
  });

  // ── setSlotLabel / setRequiredClasses / setRequiredRoles / setRequiredSpecs ──

  describe('setSlotLabel', () => {
    it('updates the slot label', () => {
      const component = setup();
      component.addNameSlotCell();

      component.setSlotLabel(component.cells()[0].key, 'Cible');

      expect(component.cells()[0].slotLabel).toBe('Cible');
    });
  });

  describe('setRequiredClasses', () => {
    it('sets the class restriction and clears the spec restriction', () => {
      const component = setup();
      component.addNameSlotCell();
      component.setRequiredSpecs(component.cells()[0], [71]);

      component.setRequiredClasses(component.cells()[0], [1]);

      expect(component.cells()[0].requiredClassIds).toEqual([1]);
      expect(component.cells()[0].requiredSpecIds).toEqual([]);
    });
  });

  describe('setRequiredRoles', () => {
    it('sets the role restriction', () => {
      const component = setup();
      component.addNameSlotCell();

      component.setRequiredRoles(component.cells()[0], [SpecRole.Healer]);

      expect(component.cells()[0].requiredRoles).toEqual([SpecRole.Healer]);
    });
  });

  describe('setRequiredSpecs', () => {
    it('sets the spec restriction', () => {
      const component = setup();
      component.addNameSlotCell();

      component.setRequiredSpecs(component.cells()[0], [71]);

      expect(component.cells()[0].requiredSpecIds).toEqual([71]);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('does nothing when canSubmit is false', () => {
      const component = setup({ definition: definition({ cells: [] }) });

      component.submit();

      expect(definitionsService.createDefinition).not.toHaveBeenCalled();
      expect(definitionsService.updateDefinition).not.toHaveBeenCalled();
    });

    it('creates a new definition when there is no existing one', () => {
      const component = setup({ guildId: 'guild-1', definition: null, cloneFrom: null });
      component.label.set('Innervate');
      component.section.set('Personals');
      component.isRepeatable.set(true);
      component.addNameSlotCell();

      component.submit();

      expect(definitionsService.createDefinition).toHaveBeenCalledWith(
        'guild-1',
        expect.objectContaining({ label: 'Innervate', section: 'Personals', isRepeatable: true, cells: expect.any(Array) }),
      );
      expect(definitionsService.updateDefinition).not.toHaveBeenCalled();
    });

    it('updates the existing definition when editing', () => {
      const def = definition({ id: 7, cells: [nameSlotCell()] });
      const component = setup({ definition: def });

      component.submit();

      expect(definitionsService.updateDefinition).toHaveBeenCalledWith('guild-1', 7, expect.any(Object));
    });

    it('trims the label/section and nulls a blank section', () => {
      const component = setup({ definition: null });
      component.label.set('  Innervate  ');
      component.section.set('   ');
      component.addNameSlotCell();

      component.submit();

      expect(definitionsService.createDefinition).toHaveBeenCalledWith('guild-1', expect.objectContaining({ label: 'Innervate', section: null }));
    });

    it('shows a success snackbar and closes the dialog with true on success', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell()] }) });

      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.attributions.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('resets submitting and shows a mapped error snackbar on a known server error', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell()] }) });
      definitionsService.updateDefinition.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'NoCellsInDefinition' } })));

      component.submit();

      expect(component.submitting()).toBe(false);
      expect(snackbar.error).toHaveBeenCalledWith('guildSettings.attributions.errors.NoCellsInDefinition');
    });

    it('falls back to a generic error snackbar when the server error carries no code', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell()] }) });
      definitionsService.updateDefinition.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('falls back to a generic error snackbar when the response carries no error body at all', () => {
      const component = setup({ definition: definition({ cells: [nameSlotCell()] }) });
      definitionsService.updateDefinition.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog with false', () => {
      const component = setup();

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
