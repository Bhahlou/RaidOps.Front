import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

/**
 * App-wide snackbar facade.
 *
 * Accepts either an i18n key or a literal message — TranslocoService handles
 * the resolution and falls back to the raw string if no key is found.
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  readonly #snackBar = inject(MatSnackBar);
  readonly #transloco = inject(TranslocoService);

  success(key: string): void {
    this.#snackBar.open(this.#t(key), undefined, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-success',
    });
  }

  error(key: string): void {
    this.#snackBar.open(this.#t(key), undefined, {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-error',
    });
  }

  info(key: string): void {
    this.#snackBar.open(this.#t(key), undefined, {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'snack-info',
    });
  }

  #t(key: string): string {
    return this.#transloco.translate(key);
  }
}
