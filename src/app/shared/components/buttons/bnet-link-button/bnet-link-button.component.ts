import { Component, computed, input, output } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { REGIONS, REGION_FLAGS, BnetRegion } from '../../../../shared/constants/bnet-regions';
import { BnetIconComponent } from '../../icons/bnet-icon/bnet-icon.component';

export type { BnetRegion };

// Matches CDK's own default (STANDARD_DROPDOWN_BELOW_POSITIONS) — kept explicit so 'end' has an
// equally explicit counterpart rather than relying on cdkMenuPosition being unset.
const START_ALIGNED_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

const END_ALIGNED_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

/**
 * Battle.net branded button that opens a region picker menu.
 * Emits `regionSelected` with the chosen region when the user picks one.
 *
 * @example
 * <app-bnet-link-button (regionSelected)="linkBnet($event)" />
 * <app-bnet-link-button variant="large" (regionSelected)="linkBnet($event)" />
 * <app-bnet-link-button menuAlign="end" (regionSelected)="linkBnet($event)" />
 */
@Component({
  selector: 'app-bnet-link-button',
  standalone: true,
  imports: [UpperCasePipe, CdkMenu, CdkMenuItem, CdkMenuTrigger, BnetIconComponent],
  templateUrl: './bnet-link-button.component.html',
  styleUrl: './bnet-link-button.component.scss',
})
export class BnetLinkButtonComponent {
  /** Visual size variant. Defaults to `'default'`. */
  readonly variant = input<'default' | 'large'>('default');

  /**
   * Which edge of the button the region menu aligns to. Defaults to `'start'` (left) — set to
   * `'end'` for buttons sitting near the right edge of their container, so the menu doesn't
   * overflow past it.
   */
  readonly menuAlign = input<'start' | 'end'>('start');

  /** Emits the selected region code (e.g. `'eu'`) when the user picks one. */
  readonly regionSelected = output<BnetRegion>();

  readonly regions = REGIONS;
  readonly regionFlags = REGION_FLAGS;

  readonly menuPosition = computed<ConnectedPosition[]>(() =>
    this.menuAlign() === 'end' ? END_ALIGNED_POSITIONS : START_ALIGNED_POSITIONS,
  );
}
