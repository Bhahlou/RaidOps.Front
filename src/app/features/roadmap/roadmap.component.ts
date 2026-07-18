import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { ROADMAP_SECTIONS } from './data/roadmap-sections.data';
import { RoadmapItemStatus, RoadmapSection } from './models/roadmap-section.model';

@Component({
  selector: 'app-roadmap',
  imports: [TooltipDirective, TranslocoPipe],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.scss',
})
export class RoadmapComponent {
  readonly #location = inject(Location);

  readonly sections = ROADMAP_SECTIONS;
  readonly ItemStatus = RoadmapItemStatus;

  goBack(): void {
    this.#location.back();
  }

  doneCount(section: RoadmapSection): number {
    return section.items.filter((i) => i.status === RoadmapItemStatus.Done).length;
  }

  isComplete(section: RoadmapSection): boolean {
    return section.items.length > 0 && this.doneCount(section) === section.items.length;
  }
}
