import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ROADMAP_SECTIONS } from './data/roadmap-sections.data';
import { RoadmapItemStatus, RoadmapSection } from './models/roadmap-section.model';

@Component({
  selector: 'app-roadmap',
  imports: [MatIconModule, MatTooltipModule, TranslocoPipe],
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
}
