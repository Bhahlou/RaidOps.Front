import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { RaidBuffsAdminComponent } from './raid-buffs-admin.component';
import { RaidBuffDefinitionDialogComponent } from '../../components/raid-buff-definition-dialog/raid-buff-definition-dialog.component';
import { RaidBuffImportDialogComponent } from '../../components/raid-buff-import-dialog/raid-buff-import-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { AdminStore } from '../../../../core/stores/admin.store';
import { RaidBuffsStore } from '../../../../core/stores/raid-buffs.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterStore } from '../../../characters/stores/character.store';
import { Spec } from '../../../../shared/models/spec.model';
import { RaidBuffDefinition, RaidBuffSource } from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../shared/models/raid-buff-scope.enum';

const definition = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: 1,
  expansionId: 12,
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 10,
  sources: [{ classId: 7, specId: 264 }],
  spell: { nameEn: 'Ancestral Healing', nameFr: 'Guérison des anciens', nameDe: 'Heilung der Ahnen', iconUrl: 'https://cdn/ancestral.jpg' },
  ...overrides,
});

describe('RaidBuffsAdminComponent', () => {
  let store: { definitions: ReturnType<typeof signal>; isLoading: ReturnType<typeof signal>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let adminStore: { deleteRaidBuff: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let translate: ReturnType<typeof vi.fn>;

  const setup = (definitions: RaidBuffDefinition[] = [], specs: Spec[] = []) => {
    store = { definitions: signal(definitions), isLoading: signal(false), load: vi.fn(), reload: vi.fn() };
    adminStore = { deleteRaidBuff: vi.fn().mockReturnValue(of(undefined)) };
    characterStore = { loadSpecs: vi.fn().mockReturnValue(of(specs)) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };
    translate = vi.fn((key: string) => key);

    TestBed.configureTestingModule({
      imports: [RaidBuffsAdminComponent],
      providers: [
        { provide: RaidBuffsStore, useValue: store },
        { provide: AdminStore, useValue: adminStore },
        { provide: CharacterStore, useValue: characterStore },
        { provide: Dialog, useValue: dialog },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { translate, getActiveLang: () => 'fr' } },
      ],
    }).overrideComponent(RaidBuffsAdminComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidBuffsAdminComponent).componentInstance;
  };

  it('loads Forever (expansion 12) by default', () => {
    setup();

    expect(store.load).toHaveBeenCalledWith(12);
  });

  // ── sections ─────────────────────────────────────────────────────────────

  describe('sections', () => {
    it('groups definitions by scope and kind, dropping empty sections', () => {
      const component = setup([
        definition({ id: 1, scope: RaidBuffScope.Raid, kind: RaidBuffKind.Buff }),
        definition({ id: 2, scope: RaidBuffScope.Group, kind: RaidBuffKind.Debuff }),
      ]);

      const sections = component.sections();

      expect(sections).toHaveLength(2);
      expect(sections.find((s) => s.scope === RaidBuffScope.Raid && s.kind === RaidBuffKind.Buff)?.definitions).toHaveLength(1);
      expect(sections.some((s) => s.scope === RaidBuffScope.Individual)).toBe(false);
    });

    it('is empty when there are no definitions', () => {
      expect(setup([]).sections()).toEqual([]);
    });
  });

  // ── selectExpansion ──────────────────────────────────────────────────────

  describe('selectExpansion', () => {
    it('switches expansion, clears the last summary, and reloads the store', () => {
      const component = setup();
      component.lastSummary.set({ created: 1, updated: 0, deleted: 0 });

      component.selectExpansion(2);

      expect(component.expansionId()).toBe(2);
      expect(component.lastSummary()).toBeNull();
      expect(store.load).toHaveBeenCalledWith(2);
    });

    it('does nothing for null or the currently selected expansion', () => {
      const component = setup();
      store.load.mockClear();

      component.selectExpansion(null);
      component.selectExpansion(12);

      expect(store.load).not.toHaveBeenCalled();
    });
  });

  // ── spellName / label ────────────────────────────────────────────────────

  describe('spellName', () => {
    it('resolves the spell name in the active language', () => {
      const component = setup();
      expect(component.spellName(definition())).toBe('Guérison des anciens');
    });

    it('falls back to #spellId when there is no resolvable spell', () => {
      const component = setup();
      expect(component.spellName(definition({ spell: null }))).toBe('#16176');
    });
  });

  describe('label', () => {
    it('resolves the effect label in the active language', () => {
      const component = setup();
      expect(component.label(definition())).toBe('+25 % d\'armure');
    });
  });

  // ── sourceIcon ───────────────────────────────────────────────────────────

  describe('sourceIcon', () => {
    it('uses the class icon and name when the source has no spec', () => {
      const component = setup();
      const source: RaidBuffSource = { classId: 7, specId: null };

      const icon = component.sourceIcon(source);

      expect(icon.label).toBe('classes.7');
      expect(icon.url).toEqual(expect.any(String));
    });

    it('uses the spec icon and "class — spec" label when the source names a spec', () => {
      const component = setup([], [{ id: 264, name: 'Restoration', role: 'Healer', classId: 7, iconUrl: 'https://cdn/resto.jpg' }]);

      const icon = component.sourceIcon({ classId: 7, specId: 264 });

      expect(icon.url).toBe('https://cdn/resto.jpg');
      expect(icon.label).toBe('classes.7 — specs.264');
    });

    it('falls back to the class icon when the spec has none loaded yet', () => {
      const component = setup([], []); // spec 264 not (yet) in the loaded map

      const icon = component.sourceIcon({ classId: 7, specId: 264 });

      expect(icon.url).toEqual(expect.any(String));
    });
  });

  // ── add / edit ───────────────────────────────────────────────────────────

  describe('add', () => {
    it('opens the definition dialog with the next sort order after the highest existing one', () => {
      const component = setup([definition({ sortOrder: 10 }), definition({ id: 2, sortOrder: 30 })]);

      component.add();

      expect(dialog.open).toHaveBeenCalledWith(RaidBuffDefinitionDialogComponent, expect.objectContaining({
        data: { expansionId: 12, definition: null, nextSortOrder: 40 },
      }));
    });

    it('starts sort order at 10 for the very first definition', () => {
      const component = setup([]);

      component.add();

      expect(dialog.open).toHaveBeenCalledWith(RaidBuffDefinitionDialogComponent, expect.objectContaining({
        data: { expansionId: 12, definition: null, nextSortOrder: 10 },
      }));
    });

    it('reloads the store when the dialog reports a save', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.add();

      expect(store.reload).toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    it('opens the definition dialog prefilled with the definition and its own sort order', () => {
      const component = setup();
      const def = definition({ sortOrder: 25 });

      component.edit(def);

      expect(dialog.open).toHaveBeenCalledWith(RaidBuffDefinitionDialogComponent, expect.objectContaining({
        data: { expansionId: 12, definition: def, nextSortOrder: 25 },
      }));
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('does nothing when the confirmation is cancelled', () => {
      const component = setup();

      component.remove(definition());

      expect(adminStore.deleteRaidBuff).not.toHaveBeenCalled();
    });

    it('deletes and reloads on confirmation', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.remove(definition({ id: 7 }));

      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.objectContaining({
        data: expect.objectContaining({ messageParams: { name: 'Guérison des anciens' } }),
      }));
      expect(adminStore.deleteRaidBuff).toHaveBeenCalledWith(7);
      expect(snackbar.success).toHaveBeenCalledWith('admin.raidBuffs.deleteSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error snackbar when the delete fails', async () => {
      const { throwError } = await import('rxjs');
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      adminStore.deleteRaidBuff.mockReturnValue(throwError(() => new Error('boom')));

      component.remove(definition());

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── copyExport ───────────────────────────────────────────────────────────

  describe('copyExport', () => {
    let writeText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
    });

    it('copies the current expansion\'s definitions as JSON and shows a success snackbar', async () => {
      const component = setup([definition()]);

      await component.copyExport();

      const written = JSON.parse(writeText.mock.calls[0][0]);
      expect(written).toEqual({
        expansionId: 12,
        definitions: [{
          spellId: 16176,
          scope: 'Raid',
          kind: 'Buff',
          labelEn: '+25% armor',
          labelFr: '+25 % d\'armure',
          labelDe: '+25 % Rüstung',
          exclusiveGroupKey: null,
          capacityPoolKey: null,
          sortOrder: 10,
          sources: [{ classId: 7, specId: 264 }],
        }],
      });
      expect(snackbar.success).toHaveBeenCalledWith('admin.raidBuffs.exportCopied');
    });

    it('shows an error snackbar when the clipboard write fails', async () => {
      writeText.mockRejectedValue(new Error('denied'));
      const component = setup();

      await component.copyExport();

      expect(snackbar.error).toHaveBeenCalledWith('admin.raidBuffs.exportFailed');
    });
  });

  // ── openImport ───────────────────────────────────────────────────────────

  describe('openImport', () => {
    it('does nothing when the import dialog is cancelled', () => {
      dialog.open.mockReturnValue({ closed: of(null) });
      const component = setup();

      component.openImport();

      expect(store.reload).not.toHaveBeenCalled();
      expect(snackbar.success).not.toHaveBeenCalled();
    });

    it('reloads the store when the import targeted the currently shown expansion', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of({ expansionId: 12, summary: { created: 1, updated: 0, deleted: 0 } }) });

      component.openImport();

      expect(store.reload).toHaveBeenCalled();
      expect(store.load).toHaveBeenCalledTimes(1); // only the initial constructor load, no extra selectExpansion
      expect(component.lastSummary()).toEqual({ created: 1, updated: 0, deleted: 0 });
      expect(snackbar.success).toHaveBeenCalledWith('admin.raidBuffs.importSuccess');
    });

    it('switches to the imported expansion when it differs from the one currently shown', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of({ expansionId: 2, summary: { created: 1, updated: 0, deleted: 0 } }) });

      component.openImport();

      expect(component.expansionId()).toBe(2);
      expect(store.load).toHaveBeenCalledWith(2);
    });
  });
});
