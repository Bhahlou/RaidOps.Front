import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of } from 'rxjs';

import { GuildAttributionSettingsComponent } from './guild-attribution-settings.component';
import { AttributionDefinitionsStore } from '../../stores/attribution-definitions.store';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildAttributionDefinition } from '../../../raids/models/guild-attribution-definition.model';
import { AttributionDefinitionDialogComponent } from '../attribution-definition-dialog/attribution-definition-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';

const definition = (overrides?: Partial<GuildAttributionDefinition>): GuildAttributionDefinition => ({
  id: 1,
  label: 'Innervate',
  section: null,
  isRepeatable: true,
  cells: [],
  sortOrder: 0,
  ...overrides,
});

describe('GuildAttributionSettingsComponent', () => {
  let definitionsSignal: ReturnType<typeof signal<GuildAttributionDefinition[]>>;
  let store: { definitions: ReturnType<typeof signal<GuildAttributionDefinition[]>>; isLoading: ReturnType<typeof signal<boolean>>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let definitionsService: { deleteDefinition: ReturnType<typeof vi.fn>; reorderDefinitions: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  const setup = (definitions: GuildAttributionDefinition[] = []) => {
    definitionsSignal = signal(definitions);
    store = { definitions: definitionsSignal, isLoading: signal(false), load: vi.fn(), reload: vi.fn() };
    definitionsService = { deleteDefinition: vi.fn().mockReturnValue(of(undefined)), reorderDefinitions: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };

    TestBed.configureTestingModule({
      imports: [GuildAttributionSettingsComponent],
      providers: [
        { provide: AttributionDefinitionsStore, useValue: store },
        { provide: AttributionDefinitionsService, useValue: definitionsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
      ],
    }).overrideComponent(GuildAttributionSettingsComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(GuildAttributionSettingsComponent);
    fixture.componentRef.setInput('guildId', 'guild-1');
    fixture.componentRef.setInput('expansionId', 2);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads the definitions store for the guild', () => {
      setup();
      expect(store.load).toHaveBeenCalledWith('guild-1');
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
        expect.objectContaining({ data: expect.objectContaining({ guildId: 'guild-1', expansionId: 2, definition: null, cloneFrom: null, existingSections: ['Curses'] }) }),
      );
    });

    it('excludes a definition with no section (null) from existingSections', () => {
      const component = setup([definition({ id: 1, section: 'Curses' }), definition({ id: 2, section: null })]);

      component.openCreateDialog();

      expect(dialog.open).toHaveBeenCalledWith(AttributionDefinitionDialogComponent, expect.objectContaining({ data: expect.objectContaining({ existingSections: ['Curses'] }) }));
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

      expect(definitionsService.deleteDefinition).toHaveBeenCalledWith('guild-1', 7);
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

      expect(definitionsService.reorderDefinitions).toHaveBeenCalledWith('guild-1', [2, 3, 1]);
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
