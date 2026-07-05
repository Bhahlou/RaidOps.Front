import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingStore } from '../../../core/stores/loading.store';

/**
 * Fixed progress bar positioned just below the navbar.
 * Visible whenever at least one HTTP request is in flight.
 */
@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: './loading-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loading-bar.component.scss',
})
export class LoadingBarComponent {
  readonly isLoading = inject(LoadingStore).isLoading;
}
