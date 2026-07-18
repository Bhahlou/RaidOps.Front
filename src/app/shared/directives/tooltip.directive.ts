import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipBubbleComponent } from '../components/feedback/tooltip-bubble/tooltip-bubble.component';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
];

/**
 * Lightweight replacement for matTooltip — a static/interpolated string shown in a CDK-overlay
 * bubble on hover/focus. Every current usage in the app is a plain string with no rich content
 * or custom positioning, so this covers 100% of it without matTooltip's larger config surface.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class TooltipDirective implements OnDestroy {
  readonly appTooltip = input('', { alias: 'appTooltip' });

  readonly #elementRef = inject(ElementRef);
  readonly #overlay = inject(Overlay);
  #overlayRef: OverlayRef | null = null;

  show(): void {
    const text = this.appTooltip();
    if (!text || this.#overlayRef) return;

    const positionStrategy = this.#overlay
      .position()
      .flexibleConnectedTo(this.#elementRef)
      .withPositions(POSITIONS);

    this.#overlayRef = this.#overlay.create({
      positionStrategy,
      scrollStrategy: this.#overlay.scrollStrategies.reposition(),
    });

    const ref = this.#overlayRef.attach(new ComponentPortal(TooltipBubbleComponent));
    ref.setInput('text', text);
  }

  hide(): void {
    this.#overlayRef?.dispose();
    this.#overlayRef = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
