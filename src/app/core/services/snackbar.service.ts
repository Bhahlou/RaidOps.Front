import { inject, Service } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TranslocoService } from '@jsverse/transloco';
import { ToastComponent, ToastVariant } from '../../shared/components/feedback/toast/toast.component';

/**
 * App-wide toast facade — same public API previously backed by MatSnackBar, now a CDK-overlay
 * toast shown bottom-center. A new toast dismisses whatever is currently showing (one at a time,
 * matching MatSnackBar's own default behavior).
 *
 * Accepts either an i18n key or a literal message — TranslocoService handles
 * the resolution and falls back to the raw string if no key is found.
 */
@Service()
export class SnackbarService {
  readonly #overlay = inject(Overlay);
  readonly #transloco = inject(TranslocoService);

  #overlayRef: OverlayRef | null = null;
  #dismissTimeout: ReturnType<typeof setTimeout> | null = null;

  success(key: string): void {
    this.#show(key, 'success', 4000);
  }

  error(key: string): void {
    this.#show(key, 'error', 6000);
  }

  info(key: string): void {
    this.#show(key, 'info', 4000);
  }

  #show(key: string, variant: ToastVariant, duration: number): void {
    this.#dismiss();

    const positionStrategy = this.#overlay
      .position()
      .global()
      .centerHorizontally()
      .bottom('24px');

    this.#overlayRef = this.#overlay.create({ positionStrategy });
    const ref = this.#overlayRef.attach(new ComponentPortal(ToastComponent));
    ref.setInput('message', this.#t(key));
    ref.setInput('variant', variant);

    this.#dismissTimeout = setTimeout(() => this.#dismiss(), duration);
  }

  #dismiss(): void {
    if (this.#dismissTimeout) clearTimeout(this.#dismissTimeout);
    this.#overlayRef?.dispose();
    this.#overlayRef = null;
  }

  #t(key: string): string {
    return this.#transloco.translate(key);
  }
}
