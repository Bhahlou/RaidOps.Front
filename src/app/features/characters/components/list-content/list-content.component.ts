import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetLinkButtonComponent } from '../../../../shared/components/bnet-link-button/bnet-link-button.component';

/**
 * Content area for the characters list page.
 * Manages the loading spinner, not-linked empty state, and the (future) character grid.
 */
@Component({
  selector: 'app-character-list-content',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslocoPipe, BnetLinkButtonComponent],
  templateUrl: './list-content.component.html',
  styleUrl: './list-content.component.scss',
})
export class ListContentComponent {
  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();

  readonly linkBnet = output<string>();
}
