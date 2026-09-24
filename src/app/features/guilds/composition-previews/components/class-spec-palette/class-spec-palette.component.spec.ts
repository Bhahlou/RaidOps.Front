import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ClassSpecPaletteComponent } from './class-spec-palette.component';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { Spec } from '../../../../../shared/models/spec.model';

const wowClass = (overrides?: Partial<WowClass>): WowClass => ({
  id: 1,
  name: 'Warrior',
  color: 'C79C6E',
  firstExpansionId: 1,
  ...overrides,
});

const spec = (overrides?: Partial<Spec>): Spec => ({
  id: 71,
  name: 'Arms',
  role: 'DPS',
  classId: 1,
  iconUrl: 'https://cdn/arms.jpg',
  ...overrides,
});

describe('ClassSpecPaletteComponent', () => {
  let fixture: ComponentFixture<ClassSpecPaletteComponent>;
  let component: ClassSpecPaletteComponent;
  let wowClassService: { getAll: ReturnType<typeof vi.fn> };
  let characterStore: { loadSpecs: ReturnType<typeof vi.fn> };
  let translate: ReturnType<typeof vi.fn>;

  const setup = (opts?: { classes?: WowClass[]; specs?: Spec[]; expansionId?: number | null; labels?: Record<number, string> }) => {
    wowClassService = { getAll: vi.fn().mockReturnValue(of(opts?.classes ?? [wowClass()])) };
    characterStore = { loadSpecs: vi.fn().mockReturnValue(of(opts?.specs ?? [spec()])) };
    const labels = opts?.labels ?? {};
    translate = vi.fn((key: string) => {
      const match = /^classes\.(\d+)$/.exec(key);
      if (match) return labels[+match[1]] ?? key;
      return key;
    });

    TestBed.configureTestingModule({
      imports: [ClassSpecPaletteComponent],
      providers: [
        { provide: WowClassService, useValue: wowClassService },
        { provide: CharacterStore, useValue: characterStore },
        { provide: TranslocoService, useValue: { activeLang: signal('en'), translate } },
      ],
    }).overrideComponent(ClassSpecPaletteComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(ClassSpecPaletteComponent);
    if (opts?.expansionId !== undefined) fixture.componentRef.setInput('expansionId', opts.expansionId);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── constructor / classes fetch ──────────────────────────────────────────

  describe('classes fetch', () => {
    it('fetches classes with no expansion filter when expansionId is null', () => {
      setup({ expansionId: null });
      expect(wowClassService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('fetches classes filtered to the given expansion', () => {
      setup({ expansionId: 12 });
      expect(wowClassService.getAll).toHaveBeenCalledWith(12);
    });

    it('loads specs once via the character store', () => {
      setup();
      expect(characterStore.loadSpecs).toHaveBeenCalled();
    });
  });

  // ── classes (sorted by translated name) ─────────────────────────────────

  describe('classes', () => {
    it('sorts classes alphabetically by their translated name', () => {
      setup({
        classes: [wowClass({ id: 2, name: 'Paladin' }), wowClass({ id: 1, name: 'Warrior' })],
        labels: { 1: 'Guerrier', 2: 'Paladin' },
      });

      // Translated: id 1 -> "Guerrier", id 2 -> "Paladin" — alphabetically "Guerrier" comes first.
      expect(component.classes().map((c) => c.id)).toEqual([1, 2]);
    });
  });

  // ── className ────────────────────────────────────────────────────────────

  describe('className', () => {
    it('translates the classes.<id> key', () => {
      setup({ labels: { 1: 'Warrior' } });
      expect(component.className(1)).toBe('Warrior');
    });
  });

  // ── specsFor ─────────────────────────────────────────────────────────────

  describe('specsFor', () => {
    it('returns only the specs belonging to the given class', () => {
      setup({ specs: [spec({ id: 71, classId: 1 }), spec({ id: 65, classId: 2 })] });

      expect(component.specsFor(1).map((s) => s.id)).toEqual([71]);
    });

    it('returns an empty array when no spec matches', () => {
      setup({ specs: [] });
      expect(component.specsFor(1)).toEqual([]);
    });
  });

  // ── dragItem ─────────────────────────────────────────────────────────────

  describe('dragItem', () => {
    it('builds the drag payload with a hash-prefixed class color', () => {
      setup();

      expect(component.dragItem(wowClass({ id: 1, color: 'C79C6E' }), spec({ id: 71, iconUrl: 'https://cdn/arms.jpg' }))).toEqual({
        wowClassId: 1,
        specId: 71,
        specIconUrl: 'https://cdn/arms.jpg',
        wowClassColor: '#C79C6E',
      });
    });
  });

  // ── rejectEnter ──────────────────────────────────────────────────────────

  describe('rejectEnter', () => {
    it('always rejects — this palette is a drag source only', () => {
      setup();
      expect(component.rejectEnter()).toBe(false);
    });
  });
});
