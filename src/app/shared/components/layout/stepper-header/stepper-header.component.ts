import { Component, input } from '@angular/core';

export interface StepItem {
  label: string;
  completed: boolean;
}

/**
 * Presentational row of numbered steps replacing mat-stepper — every consumer in this app drives
 * its active step from external application state (never `stepper.next()`/user click-through), so
 * this only needs to render the header; each consumer keeps its own `@if`/`@switch` on the active
 * index for step content, which is simpler than wiring up CDK's `CdkStepper`.
 */
@Component({
  selector: 'app-stepper-header',
  standalone: true,
  templateUrl: './stepper-header.component.html',
  styleUrl: './stepper-header.component.scss',
})
export class StepperHeaderComponent {
  readonly steps = input.required<StepItem[]>();
  readonly activeIndex = input.required<number>();
}
