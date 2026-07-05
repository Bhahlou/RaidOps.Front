import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UnderConstructionComponent } from '../../shared/components/under-construction/under-construction.component';

@Component({
  selector: 'app-gear-planner',
  imports: [UnderConstructionComponent],
  templateUrl: './gear-planner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gear-planner.component.scss',
})
export class GearPlannerComponent {}
