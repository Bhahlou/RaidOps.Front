import { Component, input } from '@angular/core';

/** Floating bubble rendered by {@link TooltipDirective} inside a CDK overlay. */
@Component({
  selector: 'app-tooltip-bubble',
  standalone: true,
  templateUrl: './tooltip-bubble.component.html',
  styleUrl: './tooltip-bubble.component.scss',
})
export class TooltipBubbleComponent {
  readonly text = input('');
}
