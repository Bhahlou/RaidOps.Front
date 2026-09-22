import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { CompositionPreviewSlotComponent } from './composition-preview-slot.component';
import { RaidCompositionPreviewSlot } from '../../models/raid-composition-preview.model';
import { CompositionSpecDragItem } from '../../models/composition-spec-drag-item.model';

const slot = (overrides?: Partial<RaidCompositionPreviewSlot>): RaidCompositionPreviewSlot => ({
  groupNumber: 1,
  slotNumber: 1,
  wowClassId: 1,
  wowClassName: 'Warrior',
  wowClassColor: '#C79C6E',
  specId: 71,
  specName: 'Arms',
  specIconUrl: 'https://cdn/arms.jpg',
  note: null,
  ...overrides,
});

describe('CompositionPreviewSlotComponent', () => {
  let fixture: ComponentFixture<CompositionPreviewSlotComponent>;
  let component: CompositionPreviewSlotComponent;

  const setup = (inputSlot: RaidCompositionPreviewSlot | null = null) => {
    TestBed.configureTestingModule({
      imports: [CompositionPreviewSlotComponent],
    }).overrideComponent(CompositionPreviewSlotComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(CompositionPreviewSlotComponent);
    fixture.componentRef.setInput('groupNumber', 1);
    fixture.componentRef.setInput('slotNumber', 1);
    if (inputSlot !== undefined) fixture.componentRef.setInput('slot', inputSlot);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── onDropped ────────────────────────────────────────────────────────────

  describe('onDropped', () => {
    it('emits dropped with the dragged spec data', () => {
      setup();
      const spy = vi.fn();
      component.dropped.subscribe(spy);
      const item: CompositionSpecDragItem = { wowClassId: 1, specId: 71, specIconUrl: 'https://cdn/arms.jpg', wowClassColor: '#C79C6E' };

      component.onDropped({ item: { data: item } } as CdkDragDrop<RaidCompositionPreviewSlot | null, unknown, CompositionSpecDragItem>);

      expect(spy).toHaveBeenCalledWith(item);
    });
  });

  // ── startEditingNote / commitNote / cancelEditingNote ───────────────────

  describe('startEditingNote', () => {
    it('copies the slot note into the draft and enters editing mode', () => {
      vi.useFakeTimers();
      setup(slot({ note: 'Bob' }));

      component.startEditingNote();
      vi.runAllTimers();

      expect(component.editingNote()).toBe(true);
      expect(component.draftNote()).toBe('Bob');
      vi.useRealTimers();
    });

    it('starts with an empty draft when the slot has no note', () => {
      vi.useFakeTimers();
      setup(slot({ note: null }));

      component.startEditingNote();
      vi.runAllTimers();

      expect(component.draftNote()).toBe('');
      vi.useRealTimers();
    });

    it('does not throw when there is no rendered input to focus', () => {
      vi.useFakeTimers();
      setup(null);

      expect(() => {
        component.startEditingNote();
        vi.runAllTimers();
      }).not.toThrow();
      vi.useRealTimers();
    });

    it('focuses the note input once rendered', () => {
      vi.useFakeTimers();
      setup();
      const focus = vi.fn();
      (component as unknown as { noteInputRef: () => { nativeElement: { focus: () => void } } | undefined }).noteInputRef = () => ({
        nativeElement: { focus },
      });

      component.startEditingNote();
      vi.runAllTimers();

      expect(focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('commitNote', () => {
    it('emits the trimmed note and exits editing mode', () => {
      setup(slot({ note: null }));
      component.startEditingNote();
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.draftNote.set('  Bob  ');
      component.commitNote();

      expect(spy).toHaveBeenCalledWith('Bob');
      expect(component.editingNote()).toBe(false);
    });

    it('emits a note added to a previously empty slot', () => {
      setup(null);
      component.startEditingNote();
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.draftNote.set('New note');
      component.commitNote();

      expect(spy).toHaveBeenCalledWith('New note');
    });

    it('emits null when the draft is cleared to blank', () => {
      setup(slot({ note: 'Bob' }));
      component.startEditingNote();
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.draftNote.set('   ');
      component.commitNote();

      expect(spy).toHaveBeenCalledWith(null);
    });

    it('does not emit when the note did not actually change', () => {
      setup(slot({ note: 'Bob' }));
      component.startEditingNote();
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.commitNote();

      expect(spy).not.toHaveBeenCalled();
    });

    it('does nothing when not currently editing', () => {
      setup(slot({ note: 'Bob' }));
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.commitNote();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('cancelEditingNote', () => {
    it('exits editing mode without emitting', () => {
      setup(slot({ note: 'Bob' }));
      component.startEditingNote();
      const spy = vi.fn();
      component.noteChanged.subscribe(spy);

      component.draftNote.set('Something else');
      component.cancelEditingNote();

      expect(component.editingNote()).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
