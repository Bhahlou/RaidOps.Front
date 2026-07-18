import { Component, input } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

/** Rendered by {@link SnackbarService} inside a CDK overlay — replaces MatSnackBar's panel. */
@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly message = input('');
  readonly variant = input<ToastVariant>('info');
}
