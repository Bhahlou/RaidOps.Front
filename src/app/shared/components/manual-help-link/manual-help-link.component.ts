import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';

/** Small "?" link next to a page/section title, deep-linking to the matching manual article. */
@Component({
  selector: 'app-manual-help-link',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, TranslocoPipe],
  templateUrl: './manual-help-link.component.html',
  styleUrl: './manual-help-link.component.scss',
})
export class ManualHelpLinkComponent {
  readonly category = input.required<string>();
  readonly article = input.required<string>();
}
