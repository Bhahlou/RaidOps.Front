import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { CompositionPreviewGridComponent } from './composition-preview-grid.component';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidCompositionPreview, RaidCompositionPreviewSlot } from '../../models/raid-composition-preview.model';
import { CompositionSpecDragItem } from '../../models/composition-spec-drag-item.model';
import { RaidBuffDefinition } from '../../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../../../../shared/models/raid-buff-scope.enum';

const buffDefinition = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: 1,
  expansionId: 12,
  spellId: 25289,
  scope: RaidBuffScope.Group,
  kind: RaidBuffKind.Buff,
  labelEn: '+140 attack power',
  labelFr: '+140 puissance d\'attaque',
  labelDe: '+140 Angriffskraft',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 0,
  sources: [],
  spell: { nameEn: 'Battle Shout', nameFr: 'Cri de guerre', nameDe: 'Schlachtruf', iconUrl: 'https://cdn/battle-shout.jpg' },
  ...overrides,
});

const slot = (overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: 1,
  wowClassName: 'Warrior',
  wowClassColor: '#C79C6E',
  specId: 71,
  specName: 'Arms',
  specIconUrl: 'https://cdn/arms.jpg',
  note: 'Bob',
  ...overrides,
});

const preview = (overrides?: Partial<RaidCompositionPreview>): RaidCompositionPreview => ({
  id: 11,
  name: '40-man',
  groupCount: 2,
  slotsPerGroup: 3,
  slots: [],
  ...overrides,
});

const dragItem = (overrides?: Partial<CompositionSpecDragItem>): CompositionSpecDragItem => ({
  wowClassId: 1,
  specId: 71,
  specIconUrl: 'https://cdn/arms.jpg',
  wowClassColor: '#C79C6E',
  ...overrides,
});

describe('CompositionPreviewGridComponent', () => {
  let fixture: ComponentFixture<CompositionPreviewGridComponent>;
  let component: CompositionPreviewGridComponent;
  let store: { updateSlot: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn> };

  const setup = (previewValue: RaidCompositionPreview, groupBuffs?: ReadonlyMap<number, RaidBuffDefinition[]>) => {
    store = { updateSlot: vi.fn().mockReturnValue(of(undefined)), reload: vi.fn() };
    snackbar = { error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CompositionPreviewGridComponent],
      providers: [
        { provide: RaidCompositionPreviewsStore, useValue: store },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'fr' } },
      ],
    }).overrideComponent(CompositionPreviewGridComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(CompositionPreviewGridComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('guildBranchId', 7);
    fixture.componentRef.setInput('preview', previewValue);
    if (groupBuffs) fixture.componentRef.setInput('groupBuffs', groupBuffs);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── groupNumbers / slotNumbers ───────────────────────────────────────────

  describe('groupNumbers / slotNumbers', () => {
    it('ranges over the preview grid dimensions', () => {
      setup(preview({ groupCount: 2, slotsPerGroup: 3 }));

      expect(component.groupNumbers()).toEqual([1, 2]);
      expect(component.slotNumbers()).toEqual([1, 2, 3]);
    });
  });

  // ── slotFor ──────────────────────────────────────────────────────────────

  describe('slotFor', () => {
    it('returns the slot at the given coordinates', () => {
      const s = slot({ groupNumber: 2, slotNumber: 3 });
      setup(preview({ slots: [s] }));

      expect(component.slotFor(2, 3)).toEqual(s);
    });

    it('returns null when no slot occupies the coordinates', () => {
      setup(preview({ slots: [] }));
      expect(component.slotFor(2, 3)).toBeNull();
    });
  });

  // ── onDropped ────────────────────────────────────────────────────────────

  describe('onDropped', () => {
    it('sets the class/spec placeholder, keeping the existing note', () => {
      setup(preview({ slots: [slot({ groupNumber: 1, slotNumber: 1, note: 'Existing note' })] }));

      component.onDropped(dragItem(), 1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, {
        groupNumber: 1,
        slotNumber: 1,
        wowClassId: 1,
        specId: 71,
        note: 'Existing note',
      });
      expect(store.reload).toHaveBeenCalled();
    });

    it('treats an empty slot as having no existing note', () => {
      setup(preview({ slots: [] }));

      component.onDropped(dragItem(), 1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, expect.objectContaining({ note: null }));
    });

    it('shows a snackbar error on failure', () => {
      setup(preview());
      store.updateSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'InvalidGroupOrSlotNumber' } })));

      component.onDropped(dragItem(), 1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('compositionPreviews.composer.errors.InvalidGroupOrSlotNumber');
    });
  });

  // ── onClear ──────────────────────────────────────────────────────────────

  describe('onClear', () => {
    it('clears the class/spec placeholder, keeping the existing note', () => {
      setup(preview({ slots: [slot({ groupNumber: 1, slotNumber: 1, note: 'Existing note' })] }));

      component.onClear(1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, {
        groupNumber: 1,
        slotNumber: 1,
        wowClassId: null,
        specId: null,
        note: 'Existing note',
      });
      expect(store.reload).toHaveBeenCalled();
    });

    it('treats an empty slot as having no existing note', () => {
      setup(preview({ slots: [] }));

      component.onClear(1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, expect.objectContaining({ note: null }));
    });

    it('shows a snackbar error on failure', () => {
      setup(preview({ slots: [slot()] }));
      store.updateSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: {} })));

      component.onClear(1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });
  });

  // ── onNoteChanged ────────────────────────────────────────────────────────

  describe('onNoteChanged', () => {
    it('updates just the note, keeping the existing class/spec', () => {
      setup(preview({ slots: [slot({ groupNumber: 1, slotNumber: 1 })] }));

      component.onNoteChanged('New note', 1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, {
        groupNumber: 1,
        slotNumber: 1,
        wowClassId: 1,
        specId: 71,
        note: 'New note',
      });
      expect(store.reload).toHaveBeenCalled();
    });

    it('treats an empty slot as having no existing class/spec', () => {
      setup(preview({ slots: [] }));

      component.onNoteChanged('New note', 1, 1);

      expect(store.updateSlot).toHaveBeenCalledWith('g1', 7, 11, { groupNumber: 1, slotNumber: 1, wowClassId: null, specId: null, note: 'New note' });
    });

    it('shows a snackbar error on failure', () => {
      setup(preview());
      store.updateSlot.mockReturnValue(throwError(() => new HttpErrorResponse({ error: { error: 'RaidCompositionPreviewNotFound' } })));

      component.onNoteChanged('New note', 1, 1);

      expect(snackbar.error).toHaveBeenCalledWith('compositionPreviews.composer.errors.RaidCompositionPreviewNotFound');
    });
  });

  // ── groupBuffsFor / buffLabel ────────────────────────────────────────────

  describe('groupBuffsFor', () => {
    it('returns the buffs of the given group number', () => {
      const buff = buffDefinition();
      setup(preview(), new Map([[1, [buff]]]));

      expect(component.groupBuffsFor(1)).toEqual([buff]);
    });

    it('returns an empty array for a group with no buffs', () => {
      setup(preview(), new Map([[1, [buffDefinition()]]]));

      expect(component.groupBuffsFor(2)).toEqual([]);
    });
  });

  describe('buffLabel', () => {
    it('resolves the label in the active language', () => {
      setup(preview());

      expect(component.buffLabel(buffDefinition())).toBe('+140 puissance d\'attaque');
    });
  });
});
