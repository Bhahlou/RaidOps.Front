import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { GuildAttributionSettingsComponent } from './guild-attribution-settings.component';
import { AttributionDefinitionsStore } from '../../stores/attribution-definitions.store';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildAttributionDefinition } from '../../../raids/models/guild-attribution-definition.model';
import { RaidBoss } from '../../../raids/models/raid-boss.model';
import { RaidZone } from '../../../raids/models/raid-zone.model';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../../raids/models/raid-marker-icon.enum';
import { AttributionDefinitionDialogComponent } from '../attribution-definition-dialog/attribution-definition-dialog.component';
import { SectionIconDialogComponent } from '../section-icon-dialog/section-icon-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

const definition = (overrides?: Partial<GuildAttributionDefinition>): GuildAttributionDefinition => ({
  id: 1,
  label: 'Innervate',
  section: null,
  isRepeatable: true,
  raidBossId: null,
  sectionIconSource: AttributionIconSource.None,
  sectionSpellId: null,
  sectionSpellIconUrl: null,
  sectionRaidMarker: null,
  sectionStaticRole: null,
  cells: [],
  sortOrder: 0,
  ...overrides,
});

const raidZone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 4,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 4,
  ...overrides,
});

const raidBoss = (overrides?: Partial<RaidBoss>): RaidBoss => ({
  id: 14,
  name: 'Hydross the Unstable',
  iconUrl: null,
  sortOrder: 1,
  raidZoneId: 4,
  raidZoneName: 'Serpentshrine Cavern',
  raidZoneShortCode: 'SSC',
  ...overrides,
});

describe('GuildAttributionSettingsComponent', () => {
  let definitionsSignal: ReturnType<typeof signal<GuildAttributionDefinition[]>>;
  let store: { definitions: ReturnType<typeof signal<GuildAttributionDefinition[]>>; isLoading: ReturnType<typeof signal<boolean>>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let definitionsService: {
    deleteDefinition: ReturnType<typeof vi.fn>;
    reorderDefinitions: ReturnType<typeof vi.fn>;
    getRaidZones: ReturnType<typeof vi.fn>;
    getBossesForZone: ReturnType<typeof vi.fn>;
  };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<GuildAttributionSettingsComponent>;

  const setup = (definitions: GuildAttributionDefinition[] = [], zones: RaidZone[] = []) => {
    definitionsSignal = signal(definitions);
    store = { definitions: definitionsSignal, isLoading: signal(false), load: vi.fn(), reload: vi.fn() };
    definitionsService = {
      deleteDefinition: vi.fn().mockReturnValue(of(undefined)),
      reorderDefinitions: vi.fn().mockReturnValue(of(undefined)),
      getRaidZones: vi.fn().mockReturnValue(of(zones)),
      getBossesForZone: vi.fn().mockReturnValue(of([])),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };

    TestBed.configureTestingModule({
      imports: [GuildAttributionSettingsComponent],
      providers: [
        { provide: AttributionDefinitionsStore, useValue: store },
        { provide: AttributionDefinitionsService, useValue: definitionsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
        { provide: TranslocoService, useValue: { activeLang: signal('en'), translate: (key: string) => key } },
      ],
    }).overrideComponent(GuildAttributionSettingsComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildAttributionSettingsComponent);
    fixture.componentRef.setInput('guildId', 'guild-1');
    fixture.componentRef.setInput('guildBranchId', 3);
    fixture.componentRef.setInput('expansionId', 2);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── initial load ─────────────────────────────────────────────────────────────

  describe('initial load', () => {
    it('loads the branch raid zones', () => {
      setup();
      expect(definitionsService.getRaidZones).toHaveBeenCalledWith('guild-1', 3);
    });

    it('loads the definitions store for the General scope (null)', () => {
      setup();
      expect(store.load).toHaveBeenCalledWith('guild-1', 3, null);
    });

    it('populates raidZones() from the response', () => {
      const zones = [raidZone()];
      const component = setup([], zones);

      expect(component.raidZones()).toEqual(zones);
    });
  });

  // ── branch switch ───────────────────────────────────────────────────────────

  describe('when the guildBranchId input changes', () => {
    it('resets to the General scope and reloads the raid zones and definitions for the new branch', () => {
      const component = setup([], [raidZone({ id: 4 })]);
      definitionsService.getBossesForZone.mockReturnValue(of([raidBoss({ id: 14 })]));
      component.onRaidChange(4);
      expect(component.selectedRaidId()).toBe(4);
      expect(component.bosses()).toHaveLength(1);
      const otherBranchZones = [raidZone({ id: 9, shortCode: 'TK' })];
      definitionsService.getRaidZones.mockReturnValue(of(otherBranchZones));
      definitionsService.getRaidZones.mockClear();
      store.load.mockClear();

      fixture.componentRef.setInput('guildBranchId', 8);
      fixture.detectChanges();

      expect(definitionsService.getRaidZones).toHaveBeenCalledOnce();
      expect(definitionsService.getRaidZones).toHaveBeenCalledWith('guild-1', 8);
      expect(component.raidZones()).toEqual(otherBranchZones);
      expect(component.selectedRaidId()).toBe(-1);
      expect(component.selectedBossId()).toBeNull();
      expect(component.bosses()).toEqual([]);
      expect(store.load).toHaveBeenCalledOnce();
      expect(store.load).toHaveBeenCalledWith('guild-1', 8, null);
    });

    it('does not reload anything when an unrelated input (expansionId) changes', () => {
      setup();
      definitionsService.getRaidZones.mockClear();
      store.load.mockClear();

      fixture.componentRef.setInput('expansionId', 5);
      fixture.detectChanges();

      expect(definitionsService.getRaidZones).not.toHaveBeenCalled();
      expect(store.load).not.toHaveBeenCalled();
    });
  });

  // ── raidOptions ──────────────────────────────────────────────────────────

  describe('raidOptions', () => {
    it('always starts with the General scope', () => {
      const component = setup();

      expect(component.raidOptions()[0]).toEqual(expect.objectContaining({ label: 'guildSettings.attributions.scope.general' }));
    });

    it('appends one option per loaded raid zone, translated by its short code', () => {
      const component = setup([], [raidZone({ id: 4, shortCode: 'SSC' })]);

      expect(component.raidOptions()).toHaveLength(2);
      expect(component.raidOptions()[1]).toEqual(expect.objectContaining({ value: 4, label: 'raidBuilder.zones.ssc' }));
    });
  });

  // ── bossOptions ──────────────────────────────────────────────────────────

  describe('bossOptions', () => {
    it('is empty before any raid is selected', () => {
      expect(setup().bossOptions()).toEqual([]);
    });

    it('maps each loaded boss, translated by its name', () => {
      const component = setup();
      component.bosses.set([raidBoss({ id: 14, name: 'Hydross the Unstable' })]);

      expect(component.bossOptions()).toEqual([expect.objectContaining({ value: 14, label: 'raidBuilder.bosses.hydrosstheunstable' })]);
    });
  });

  // ── showBossPicker / currentRaidBossId ──────────────────────────────────

  describe('showBossPicker', () => {
    it('is false on the General scope', () => {
      expect(setup().showBossPicker()).toBe(false);
    });

    it('is true once a specific raid is selected', () => {
      const component = setup();
      component.selectedRaidId.set(4);

      expect(component.showBossPicker()).toBe(true);
    });
  });

  describe('currentRaidBossId', () => {
    it('is null on the General scope regardless of selectedBossId', () => {
      const component = setup();
      component.selectedBossId.set(14);

      expect(component.currentRaidBossId()).toBeNull();
    });

    it('is the selected boss id once a specific raid is selected', () => {
      const component = setup();
      component.selectedRaidId.set(4);
      component.selectedBossId.set(14);

      expect(component.currentRaidBossId()).toBe(14);
    });
  });

  // ── onRaidChange ─────────────────────────────────────────────────────────

  describe('onRaidChange', () => {
    it('reloads the General scope (bossId null) when switching back to General', () => {
      const component = setup();
      store.load.mockClear();

      component.onRaidChange(-1);

      expect(component.selectedRaidId()).toBe(-1);
      expect(component.selectedBossId()).toBeNull();
      expect(store.load).toHaveBeenCalledWith('guild-1', 3, null);
    });

    it('treats a null raidId the same as General', () => {
      const component = setup();

      component.onRaidChange(null);

      expect(component.selectedRaidId()).toBe(-1);
    });

    it('fetches the zone bosses and auto-selects the first one, loading its scope', () => {
      const component = setup();
      definitionsService.getBossesForZone.mockReturnValue(of([raidBoss({ id: 14 }), raidBoss({ id: 15 })]));

      component.onRaidChange(4);

      expect(definitionsService.getBossesForZone).toHaveBeenCalledWith('guild-1', 4);
      expect(component.bosses().map((b) => b.id)).toEqual([14, 15]);
      expect(component.selectedBossId()).toBe(14);
      expect(store.load).toHaveBeenCalledWith('guild-1', 3, 14);
      expect(component.loadingBosses()).toBe(false);
    });

    it('selects null (no boss) when the zone has no bosses, without loading a scope', () => {
      const component = setup();
      definitionsService.getBossesForZone.mockReturnValue(of([]));
      store.load.mockClear();

      component.onRaidChange(4);

      expect(component.selectedBossId()).toBeNull();
      expect(store.load).not.toHaveBeenCalled();
    });
  });

  // ── onBossChange ─────────────────────────────────────────────────────────

  describe('onBossChange', () => {
    it('sets selectedBossId and loads that scope', () => {
      const component = setup();
      component.selectedRaidId.set(4);
      store.load.mockClear();

      component.onBossChange(14);

      expect(component.selectedBossId()).toBe(14);
      expect(store.load).toHaveBeenCalledWith('guild-1', 3, 14);
    });

    it('does not load a scope when clearing to null', () => {
      const component = setup();
      store.load.mockClear();

      component.onBossChange(null);

      expect(component.selectedBossId()).toBeNull();
      expect(store.load).not.toHaveBeenCalled();
    });
  });

  // ── sectionLabel ─────────────────────────────────────────────────────────

  describe('sectionLabel', () => {
    it('returns the trimmed section', () => {
      expect(setup().sectionLabel(definition({ section: '  Curses  ' }))).toBe('Curses');
    });

    it('returns an empty string for a null section', () => {
      expect(setup().sectionLabel(definition({ section: null }))).toBe('');
    });

    it('returns an empty string for a blank section', () => {
      expect(setup().sectionLabel(definition({ section: '   ' }))).toBe('');
    });
  });

  // ── groupedSections ──────────────────────────────────────────────────────

  describe('groupedSections', () => {
    it('is empty with no definitions', () => {
      expect(setup([]).groupedSections()).toEqual([]);
    });

    it('folds consecutive same-section definitions into one group', () => {
      const defs = [definition({ id: 1, section: 'Curses' }), definition({ id: 2, section: 'Curses' }), definition({ id: 3, section: 'Personals' })];
      const component = setup(defs);

      expect(component.groupedSections()).toEqual([
        { label: 'Curses', definitions: [defs[0], defs[1]] },
        { label: 'Personals', definitions: [defs[2]] },
      ]);
    });

    it('starts a new group entry when the same section reappears non-consecutively', () => {
      const defs = [definition({ id: 1, section: 'Curses' }), definition({ id: 2, section: 'Personals' }), definition({ id: 3, section: 'Curses' })];
      const component = setup(defs);

      expect(component.groupedSections()).toEqual([
        { label: 'Curses', definitions: [defs[0]] },
        { label: 'Personals', definitions: [defs[1]] },
        { label: 'Curses', definitions: [defs[2]] },
      ]);
    });

    it('groups unlabeled (null/blank section) definitions under the empty label', () => {
      const defs = [definition({ id: 1, section: null }), definition({ id: 2, section: '  ' })];
      const component = setup(defs);

      expect(component.groupedSections()).toEqual([{ label: '', definitions: defs }]);
    });
  });

  // ── openCreateDialog / openEditDialog / duplicateDefinition ─────────────

  describe('openCreateDialog', () => {
    it('opens the dialog with a null definition and cloneFrom', () => {
      const component = setup([definition({ section: 'Curses' })]);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(
        AttributionDefinitionDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ guildId: 'guild-1', guildBranchId: 3, expansionId: 2, definition: null, cloneFrom: null, existingSections: ['Curses'] }) }),
      );
    });

    it('passes the distinct existingSections trimmed and sorted alphabetically', () => {
      const component = setup([
        definition({ id: 1, section: 'Personals' }),
        definition({ id: 2, section: ' Curses ' }),
        definition({ id: 3, section: 'Personals' }),
      ]);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ existingSections: ['Curses', 'Personals'] }) }));
    });

    it('excludes a definition with no section (null) from existingSections', () => {
      const component = setup([definition({ id: 1, section: 'Curses' }), definition({ id: 2, section: null })]);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ existingSections: ['Curses'] }) }));
    });

    it('passes existingSectionIcons keyed off each section’s first row', () => {
      const withIcon = definition({ id: 1, section: 'Interrupts', sectionIconSource: AttributionIconSource.RaidMarker, sectionRaidMarker: RaidMarkerIcon.Skull });
      const component = setup([withIcon]);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(
        AttributionDefinitionDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            existingSectionIcons: [
              {
                section: 'Interrupts',
                icon: { iconSource: AttributionIconSource.RaidMarker, spellId: null, spellIconUrl: null, raidMarker: RaidMarkerIcon.Skull, staticRole: null },
              },
            ],
          }),
        }),
      );
    });

    it('scopes the new row to the currently selected boss', () => {
      const component = setup();
      component.selectedRaidId.set(4);
      component.selectedBossId.set(14);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ raidBossId: 14 }) }));
    });

    it('reloads the store when the dialog reports a save', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openCreateDialog();

      expect(store.reload).toHaveBeenCalled();
    });

    it('does not reload the store when the dialog is dismissed', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });

      component.openCreateDialog();

      expect(store.reload).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    it('opens the dialog with the given definition and no cloneFrom', () => {
      const component = setup();
      const target = definition();

      component.openEditDialog(target);

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ definition: target, cloneFrom: null }) }));
    });
  });

  describe('duplicateDefinition', () => {
    it('opens the dialog with a null definition and the source as cloneFrom', () => {
      const component = setup();
      const source = definition();

      component.duplicateDefinition(source);

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ definition: null, cloneFrom: source }) }));
    });
  });

  // ── openSectionIconDialog ────────────────────────────────────────────────

  describe('openSectionIconDialog', () => {
    it('does nothing for a section with no known icon entry (no rows in it)', () => {
      const component = setup();

      component.openSectionIconDialog('No such section');

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the dialog with the current scope, section, and its icon', () => {
      const withIcon = definition({ id: 1, section: 'Interrupts', sectionIconSource: AttributionIconSource.RaidMarker, sectionRaidMarker: RaidMarkerIcon.Skull });
      const component = setup([withIcon]);
      component.selectedRaidId.set(4);
      component.selectedBossId.set(14);

      component.openSectionIconDialog('Interrupts');

      expect(dialog.open).toHaveBeenCalledWith(
        SectionIconDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            guildId: 'guild-1',
            guildBranchId: 3,
            raidBossId: 14,
            section: 'Interrupts',
            icon: { iconSource: AttributionIconSource.RaidMarker, spellId: null, spellIconUrl: null, raidMarker: RaidMarkerIcon.Skull, staticRole: null },
          }),
        }),
      );
    });

    it('reloads the store when the dialog reports a save', () => {
      const withIcon = definition({ id: 1, section: 'Interrupts' });
      const component = setup([withIcon]);
      dialog.open.mockReturnValue({ closed: of(true) });

      component.openSectionIconDialog('Interrupts');

      expect(store.reload).toHaveBeenCalled();
    });
  });

  // ── deleteDefinition ─────────────────────────────────────────────────────

  describe('deleteDefinition', () => {
    it('does nothing when the confirm dialog is dismissed', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });

      component.deleteDefinition(definition());

      expect(definitionsService.deleteDefinition).not.toHaveBeenCalled();
    });

    it('opens the confirm dialog with the definition label', () => {
      const component = setup();

      component.deleteDefinition(definition({ label: 'Innervate' }));

      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        expect.objectContaining({ data: expect.objectContaining({ messageParams: { label: 'Innervate' }, danger: true }) }),
      );
    });

    it('deletes, shows a success snackbar, and reloads on confirm', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });

      component.deleteDefinition(definition({ id: 7 }));

      expect(definitionsService.deleteDefinition).toHaveBeenCalledWith('guild-1', 3, 7);
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.attributions.deleteSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error snackbar when the delete request fails', () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      definitionsService.deleteDefinition.mockReturnValue({
        subscribe: ({ error }: { error: (e: unknown) => void }) => error(new Error('boom')),
      });

      component.deleteDefinition(definition());

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── onDrop ───────────────────────────────────────────────────────────────

  describe('onDrop', () => {
    it('does nothing when dropped at the same index', () => {
      const component = setup([definition({ id: 1 }), definition({ id: 2 })]);

      component.onDrop({ previousIndex: 0, currentIndex: 0 } as CdkDragDrop<GuildAttributionDefinition[]>);

      expect(definitionsService.reorderDefinitions).not.toHaveBeenCalled();
    });

    it('reorders and reloads on success', () => {
      const component = setup([definition({ id: 1 }), definition({ id: 2 }), definition({ id: 3 })]);

      component.onDrop({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<GuildAttributionDefinition[]>);

      expect(definitionsService.reorderDefinitions).toHaveBeenCalledWith('guild-1', 3, [2, 3, 1]);
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error snackbar when the reorder request fails', () => {
      const component = setup([definition({ id: 1 }), definition({ id: 2 })]);
      definitionsService.reorderDefinitions.mockReturnValue({
        subscribe: ({ error }: { error: (e: unknown) => void }) => error(new Error('boom')),
      });

      component.onDrop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<GuildAttributionDefinition[]>);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });
});
