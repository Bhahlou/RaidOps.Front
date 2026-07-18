import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TooltipDirective } from '../../../directives/tooltip.directive';

/** Small "?" link next to a page/section title, deep-linking to the matching manual article. */
@Component({
  selector: 'app-manual-help-link',
  imports: [RouterLink, TooltipDirective, TranslocoPipe],
  templateUrl: './manual-help-link.component.html',
  styleUrl: './manual-help-link.component.scss',
})
export class ManualHelpLinkComponent {
  readonly category = input.required<string>();
  readonly article = input.required<string>();
}
