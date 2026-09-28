import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RaidBuffDefinitionDialogComponent, RaidBuffDefinitionDialogData } from './raid-buff-definition-dialog.component';
import { AdminStore } from '../../../../core/stores/admin.store';
import { CharacterStore } from '../../../characters/stores/character.store';
import { WowClassService } from '../../../../shared/services/wow-class.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Spec } from '../../../../shared/models/spec.model';
import { WowClass } from '../../../../shared/models/wow-class.model';
import { RaidBuffDefinition } from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../shared/models/raid-buff-scope.enum';
import { Spell } from '../../../guilds/raids/models/spell.model';

const wowClass = (overrides?: Partial<WowClass>): WowClass => ({ id: 7, name: 'Shaman', color: '0070DE', firstExpansionId: 1, ...overrides });
const spec = (overrides?: Partial<Spec>): Spec => ({ id: 264, name: 'Restoration', role: 'Healer', classId: 7, iconUrl: 'https://cdn/resto.jpg', ...overrides });

const definition = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: 1,
  expansionId: 12,
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: 'armor-pct',
  capacityPoolKey: null,
  sortOrder: 10,
  sources: [{ classId: 7, specId: 264 }],
  spell: { nameEn: 'Ancestral Healing', nameFr: 'Guérison des anciens', nameDe: 'Heilung der Ahnen', iconUrl: 'https://cdn/ancestral.jpg' },
  ...overrides,
});

const spell = (overrides?: Partial<Spell>): Spell => ({ id: 25289, name: 'Battle Shout', iconUrl: 'https://cdn/battle-shout.jpg', ...overrides });

describe('RaidBuffDefinitionDialogComponent', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let adminStore: { saveRaidBuff: ReturnType<typeof vi.fn>; updateRaidBuff: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let wowClassService: { getAll: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let translate: ReturnType<typeof vi.fn>;

  const setup = (data: Partial<RaidBuffDefinitionDialogData> = {}, specs: Spec[] = [spec()], classes: WowClass[] = [wowClass()]) => {
    dialogRef = { close: vi.fn() };
    adminStore = { saveRaidBuff: vi.fn().mockReturnValue(of({ created: 1, updated: 0, deleted: 0 })), updateRaidBuff: vi.fn().mockReturnValue(of(undefined)) };
    characterStore = { loadSpecs: vi.fn().mockReturnValue(of(specs)) };
    wowClassService = { getAll: vi.fn().mockReturnValue(of(classes)) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    translate = vi.fn((key: string) => key);

    const fullData: RaidBuffDefinitionDialogData = {
      expansionId: 12,
      definition: null,
      nextSortOrder: 10,
      ...data,
    };

    TestBed.configureTestingModule({
      imports: [RaidBuffDefinitionDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: fullData },
        { provide: AdminStore, useValue: adminStore },
        { provide: CharacterStore, useValue: characterStore },
        { provide: WowClassService, useValue: wowClassService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { translate, getActiveLang: () => 'fr' } },
      ],
    }).overrideComponent(RaidBuffDefinitionDialogComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidBuffDefinitionDialogComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── isEditMode / prefill ─────────────────────────────────────────────────

  describe('create mode', () => {
    it('starts with no spell, default scope/kind, no sources, and the given next sort order', () => {
      const component = setup({ definition: null, nextSortOrder: 42 });

      expect(component.isEditMode).toBe(false);
      expect(component.spell()).toBeNull();
      expect(component.scope()).toBe(RaidBuffScope.Raid);
      expect(component.kind()).toBe(RaidBuffKind.Buff);
      expect(component.labelEn()).toBe('');
      expect(component.exclusiveGroupKey()).toBe('');
      expect(component.sortOrder()).toBe(42);
      expect(component.sources()).toEqual([]);
    });
  });

  describe('edit mode', () => {
    it('prefills every field from the definition being edited', () => {
      const component = setup({ definition: definition({ capacityPoolKey: 'paladin-blessings' }) });

      expect(component.isEditMode).toBe(true);
      expect(component.scope()).toBe(RaidBuffScope.Raid);
      expect(component.kind()).toBe(RaidBuffKind.Buff);
      expect(component.labelEn()).toBe('+25% armor');
      expect(component.labelFr()).toBe('+25 % d\'armure');
      expect(component.labelDe()).toBe('+25 % Rüstung');
      expect(component.capacityPoolKey()).toBe('paladin-blessings');
      expect(component.exclusiveGroupKey()).toBe('armor-pct');
      expect(component.sortOrder()).toBe(10);
    });

    it('prefills the spell, resolving its name in the active language', () => {
      const component = setup({ definition: definition() });

      expect(component.spell()).toEqual({ id: 16176, name: 'Guérison des anciens', iconUrl: 'https://cdn/ancestral.jpg' });
    });

    it('shows #spellId as the spell name when the definition has no resolvable spell availability', () => {
      const component = setup({ definition: definition({ spell: null }) });

      expect(component.spell()).toEqual({ id: 16176, name: '#16176', iconUrl: '' });
    });

    it('maps every source, substituting the "any spec" sentinel for a null specId', () => {
      const component = setup({ definition: definition({ sources: [{ classId: 7, specId: 264 }, { classId: 5, specId: null }] }) });

      expect(component.sources().map((s) => ({ classId: s.classId, specId: s.specId }))).toEqual([
        { classId: 7, specId: 264 },
        { classId: 5, specId: 0 },
      ]);
    });
  });

  // ── constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('loads classes for the definition\'s expansion and every spec', () => {
      setup({ expansionId: 12 });

      expect(wowClassService.getAll).toHaveBeenCalledWith(12);
      expect(characterStore.loadSpecs).toHaveBeenCalled();
    });
  });

  // ── scopeOptions / kindOptions ───────────────────────────────────────────

  describe('scopeOptions', () => {
    it('lists every scope with a translated label, in display order', () => {
      const component = setup();

      expect(component.scopeOptions()).toEqual([
        { value: RaidBuffScope.Raid, label: 'admin.raidBuffs.scope.Raid' },
        { value: RaidBuffScope.Group, label: 'admin.raidBuffs.scope.Group' },
        { value: RaidBuffScope.Individual, label: 'admin.raidBuffs.scope.Individual' },
      ]);
    });
  });

  describe('kindOptions', () => {
    it('lists every kind with a translated label, in display order', () => {
      const component = setup();

      expect(component.kindOptions()).toEqual([
        { value: RaidBuffKind.Buff, label: 'admin.raidBuffs.kind.Buff' },
        { value: RaidBuffKind.Debuff, label: 'admin.raidBuffs.kind.Debuff' },
      ]);
    });
  });

  // ── classOptions ─────────────────────────────────────────────────────────

  describe('classOptions', () => {
    it('maps every loaded class to a select option with a translated label', () => {
      const component = setup({}, [spec()], [wowClass({ id: 7 })]);

      expect(component.classOptions()).toEqual([{ value: 7, label: 'classes.7', iconUrl: expect.any(String), color: '#0070DE' }]);
    });

    it('uses a null color for a class with no known official color', () => {
      const component = setup({}, [spec()], [wowClass({ id: 999 })]);

      expect(component.classOptions()).toEqual([{ value: 999, label: 'classes.999', iconUrl: null, color: null }]);
    });
  });

  // ── specOptionsFor ───────────────────────────────────────────────────────

  describe('specOptionsFor', () => {
    it('returns an empty list when no class is chosen', () => {
      const component = setup();

      expect(component.specOptionsFor({ key: 'k', classId: null, specId: 0 })).toEqual([]);
    });

    it('returns "any spec" followed by the class\'s own specs', () => {
      const component = setup({}, [spec({ id: 264, classId: 7 }), spec({ id: 65, classId: 2 })]);

      const options = component.specOptionsFor({ key: 'k', classId: 7, specId: 0 });

      expect(options).toEqual([
        { value: 0, label: 'admin.raidBuffs.dialog.anySpec' },
        { value: 264, label: 'specs.264', iconUrl: 'https://cdn/resto.jpg' },
      ]);
    });
  });

  // ── sources editing ──────────────────────────────────────────────────────

  describe('addSource / removeSource', () => {
    it('adds a blank source', () => {
      const component = setup();

      component.addSource();

      expect(component.sources()).toHaveLength(1);
      expect(component.sources()[0].classId).toBeNull();
    });

    it('removes a source by key', () => {
      const component = setup();
      component.addSource();
      const key = component.sources()[0].key;

      component.removeSource(key);

      expect(component.sources()).toEqual([]);
    });
  });

  describe('setSourceClass', () => {
    it('sets the class and resets the spec to "any spec"', () => {
      const component = setup();
      component.addSource();
      const key = component.sources()[0].key;
      component.setSourceSpec(key, 264);

      component.setSourceClass(key, 7);

      expect(component.sources()[0]).toEqual({ key, classId: 7, specId: 0 });
    });

    it('leaves every other source row untouched', () => {
      const component = setup();
      component.addSource();
      component.addSource();
      const [first, second] = component.sources();
      component.setSourceClass(first.key, 7);

      component.setSourceClass(second.key, 5);

      expect(component.sources()).toEqual([{ key: first.key, classId: 7, specId: 0 }, { key: second.key, classId: 5, specId: 0 }]);
    });
  });

  describe('setSourceSpec', () => {
    it('sets the chosen spec', () => {
      const component = setup();
      component.addSource();
      const key = component.sources()[0].key;

      component.setSourceSpec(key, 264);

      expect(component.sources()[0].specId).toBe(264);
    });

    it('treats a null spec as "any spec"', () => {
      const component = setup();
      component.addSource();
      const key = component.sources()[0].key;
      component.setSourceSpec(key, 264);

      component.setSourceSpec(key, null);

      expect(component.sources()[0].specId).toBe(0);
    });
  });

  // ── onSpellSelected ──────────────────────────────────────────────────────

  describe('onSpellSelected', () => {
    it('sets the chosen spell', () => {
      const component = setup();

      component.onSpellSelected(spell());

      expect(component.spell()).toEqual({ id: 25289, name: 'Battle Shout', iconUrl: 'https://cdn/battle-shout.jpg' });
    });
  });

  // ── canSubmit ────────────────────────────────────────────────────────────

  describe('canSubmit', () => {
    const validSetup = () => {
      const component = setup();
      component.onSpellSelected(spell());
      component.labelEn.set('en');
      component.labelFr.set('fr');
      component.labelDe.set('de');
      component.addSource();
      component.setSourceClass(component.sources()[0].key, 7);
      return component;
    };

    it('is true once a spell, every label and a fully-set source are present', () => {
      expect(validSetup().canSubmit()).toBe(true);
    });

    it('is false without a spell', () => {
      const component = setup();
      component.labelEn.set('en');
      component.labelFr.set('fr');
      component.labelDe.set('de');
      component.addSource();
      component.setSourceClass(component.sources()[0].key, 7);

      expect(component.canSubmit()).toBe(false);
    });

    it('is false when a label is blank', () => {
      const component = validSetup();
      component.labelFr.set('   ');

      expect(component.canSubmit()).toBe(false);
    });

    it('is false with no sources', () => {
      const component = setup();
      component.onSpellSelected(spell());
      component.labelEn.set('en');
      component.labelFr.set('fr');
      component.labelDe.set('de');

      expect(component.canSubmit()).toBe(false);
    });

    it('is false when a source has no class chosen', () => {
      const component = setup();
      component.onSpellSelected(spell());
      component.labelEn.set('en');
      component.labelFr.set('fr');
      component.labelDe.set('de');
      component.addSource();

      expect(component.canSubmit()).toBe(false);
    });

    it('is false while submitting', () => {
      const component = validSetup();
      component.submitting.set(true);

      expect(component.canSubmit()).toBe(false);
    });
  });

  // ── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    const fillValid = (component: RaidBuffDefinitionDialogComponent) => {
      component.onSpellSelected(spell());
      component.labelEn.set('  en  ');
      component.labelFr.set('fr');
      component.labelDe.set('de');
      component.exclusiveGroupKey.set('  Armor-Pct  ');
      component.capacityPoolKey.set('   ');
      // Edit mode already prefills a valid source from the definition — only add one from scratch in create mode.
      if (component.sources().length === 0) {
        component.addSource();
        component.setSourceClass(component.sources()[0].key, 7);
        component.setSourceSpec(component.sources()[0].key, 264);
      }
    };

    it('does nothing when the form is invalid', () => {
      const component = setup();

      component.submit();

      expect(adminStore.saveRaidBuff).not.toHaveBeenCalled();
    });

    it('creates a new definition, trimming labels and nulling a blank key', () => {
      const component = setup({ definition: null, expansionId: 12 });
      fillValid(component);

      component.submit();

      expect(adminStore.saveRaidBuff).toHaveBeenCalledWith(12, {
        spellId: 25289,
        scope: RaidBuffScope.Raid,
        kind: RaidBuffKind.Buff,
        labelEn: 'en',
        labelFr: 'fr',
        labelDe: 'de',
        exclusiveGroupKey: 'Armor-Pct',
        capacityPoolKey: null,
        sortOrder: 10,
        sources: [{ classId: 7, specId: 264 }],
      });
    });

    it('nulls a blank exclusive group key just like a blank capacity pool key', () => {
      const component = setup();
      fillValid(component);
      component.exclusiveGroupKey.set('   ');

      component.submit();

      expect(adminStore.saveRaidBuff).toHaveBeenCalledWith(12, expect.objectContaining({ exclusiveGroupKey: null }));
    });

    it('maps the "any spec" sentinel back to null in the payload', () => {
      const component = setup();
      fillValid(component);
      component.setSourceSpec(component.sources()[0].key, null);

      component.submit();

      expect(adminStore.saveRaidBuff).toHaveBeenCalledWith(12, expect.objectContaining({ sources: [{ classId: 7, specId: null }] }));
    });

    it('edits the existing definition by ID instead of creating a new one', () => {
      const component = setup({ definition: definition({ id: 99 }) });
      fillValid(component);

      component.submit();

      expect(adminStore.updateRaidBuff).toHaveBeenCalledWith(99, expect.objectContaining({ spellId: 25289 }));
      expect(adminStore.saveRaidBuff).not.toHaveBeenCalled();
    });

    it('shows a success snackbar and closes the dialog on success', () => {
      const component = setup();
      fillValid(component);

      component.submit();

      expect(snackbar.success).toHaveBeenCalledWith('admin.raidBuffs.saveSuccess');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('shows the server detail and re-enables the form on failure', () => {
      const component = setup();
      fillValid(component);
      adminStore.saveRaidBuff.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { detail: 'Spell 25289 already has a definition on this expansion.' } })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('Spell 25289 already has a definition on this expansion.');
      expect(component.submitting()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('falls back to a generic error when the server gives no detail', () => {
      const component = setup();
      fillValid(component);
      adminStore.saveRaidBuff.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('falls back to a generic error when the response has no error body at all', () => {
      const component = setup();
      fillValid(component);
      adminStore.saveRaidBuff.mockReturnValue(throwError(() => new HttpErrorResponse({})));

      component.submit();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── cancel ───────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog without saving', () => {
      const component = setup();

      component.cancel();

      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});
