import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { TranslocoPipe } from '@jsverse/transloco';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { ROADMAP_SECTIONS } from './data/roadmap-sections.data';
import { RoadmapItemStatus, RoadmapSection } from './models/roadmap-section.model';

@Component({
  selector: 'app-roadmap',
  imports: [CdkAccordion, CdkAccordionItem, TooltipDirective, TranslocoPipe],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.scss',
})
export class RoadmapComponent {
  readonly #location = inject(Location);

  readonly sections = ROADMAP_SECTIONS;
  readonly ItemStatus = RoadmapItemStatus;

  // CDK's `[expanded]` fires `(opened)`/`(closed)` even on first render whenever the bound value
  // differs from the item's internal default of `false` — since sections start expanded here, that
  // would fire one spurious `opened` per section. Recording the *actual current* state explicitly
  // (set from that same event) avoids treating that initial emission as a real user toggle.
  readonly #expanded = signal<ReadonlyMap<string, boolean>>(new Map());

  goBack(): void {
    this.#location.back();
  }

  isExpanded(sectionId: string): boolean {
    return this.#expanded().get(sectionId) ?? true;
  }

  setExpanded(sectionId: string, expanded: boolean): void {
    this.#expanded.set(new Map(this.#expanded()).set(sectionId, expanded));
  }

  doneCount(section: RoadmapSection): number {
    return section.items.filter((i) => i.status === RoadmapItemStatus.Done).length;
  }

  isComplete(section: RoadmapSection): boolean {
    return section.items.length > 0 && this.doneCount(section) === section.items.length;
  }
}
