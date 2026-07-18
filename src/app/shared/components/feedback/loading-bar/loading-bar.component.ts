import { Component, inject } from '@angular/core';
import { LoadingStore } from '../../../../core/stores/loading.store';

/**
 * Fixed progress bar positioned just below the navbar.
 * Visible whenever at least one HTTP request is in flight.
 */
@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
})
export class LoadingBarComponent {
  readonly isLoading = inject(LoadingStore).isLoading;
}
