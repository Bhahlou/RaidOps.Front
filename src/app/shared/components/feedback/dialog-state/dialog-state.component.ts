import { Component, input } from '@angular/core';

/**
 * Loading/error/info placeholder for dialog and panel bodies — spinner for 'loading', a material
 * icon + optional message otherwise, tinted red for 'error'.
 */
@Component({
  selector: 'app-dialog-state',
  standalone: true,
  imports: [],
  templateUrl: './dialog-state.component.html',
  styleUrl: './dialog-state.component.scss',
})
export class DialogStateComponent {
  readonly variant = input<'loading' | 'info' | 'error'>('info');
  /** Ignored when variant is 'loading' (spinner shown instead). */
  readonly icon = input('');
  readonly message = input('');
}
