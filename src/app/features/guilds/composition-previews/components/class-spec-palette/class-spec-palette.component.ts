import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WowClassIconComponent } from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { Spec } from '../../../../../shared/models/spec.model';
import { CompositionSpecDragItem } from '../../models/composition-spec-drag-item.model';

/**
 * One drag source card per playable class (filtered to this branch's expansion), each listing its
 * specs as individual drag handles — drop one onto a grid slot to set that slot's placeholder.
 * Wrapped in its own `cdkDropList` (source-only, `rejectEnter` always true) so every spec item has
 * an origin container to connect to the grid's slot drop lists via the composer's shared
 * `cdkDropListGroup`, same convention as `RaidRosterPoolComponent`.
 */
@Component({
  selector: 'app-class-spec-palette',
  imports: [CdkDropList, CdkDrag, NgOptimizedImage, WowClassIconComponent, TranslocoPipe],
  templateUrl: './class-spec-palette.component.html',
  styleUrl: './class-spec-palette.component.scss',
})
export class ClassSpecPaletteComponent {
  /** Filters the class list to what's playable on this branch's current expansion, or `null` to show everything (expansion not resolved yet). */
  readonly expansionId = input<number | null>(null);

  readonly #wowClassService = inject(WowClassService);
  readonly #characterStore = inject(CharacterStore);
  readonly #transloco = inject(TranslocoService);

  readonly #classes = signal<WowClass[]>([]);
  readonly #specs = signal<Spec[]>([]);

  readonly classes = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return [...this.#classes()].sort((a, b) => this.#className(a.id).localeCompare(this.#className(b.id)));
  });

  readonly rejectEnter = (): boolean => false;

  constructor() {
    effect(() => {
      const expansionId = this.expansionId();
      this.#wowClassService.getAll(expansionId ?? undefined).subscribe((classes) => this.#classes.set(classes));
    });
    this.#characterStore.loadSpecs().subscribe((specs) => this.#specs.set(specs));
  }

  className(classId: number): string {
    return this.#className(classId);
  }

  specsFor(classId: number): Spec[] {
    return this.#specs().filter((s) => s.classId === classId);
  }

  dragItem(wowClass: WowClass, spec: Spec): CompositionSpecDragItem {
    return {
      wowClassId: wowClass.id,
      specId: spec.id,
      specIconUrl: spec.iconUrl,
      wowClassColor: `#${wowClass.color}`,
    };
  }

  #className(classId: number): string {
    return this.#transloco.translate(`classes.${classId}`);
  }
}
