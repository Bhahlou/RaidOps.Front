import { Component, input, output } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { REGIONS, REGION_FLAGS, BnetRegion } from '../../../shared/constants/bnet-regions';

export type { BnetRegion };

/**
 * Battle.net branded button that opens a region picker menu.
 * Emits `regionSelected` with the chosen region when the user picks one.
 *
 * @example
 * <app-bnet-link-button (regionSelected)="linkBnet($event)" />
 * <app-bnet-link-button variant="large" (regionSelected)="linkBnet($event)" />
 */
@Component({
  selector: 'app-bnet-link-button',
  standalone: true,
  imports: [UpperCasePipe, MatIconModule, MatMenuModule],
  templateUrl: './bnet-link-button.component.html',
  styleUrl: './bnet-link-button.component.scss',
})
export class BnetLinkButtonComponent {
  /** Visual size variant. Defaults to `'default'`. */
  readonly variant = input<'default' | 'large'>('default');

  /** Emits the selected region code (e.g. `'eu'`) when the user picks one. */
  readonly regionSelected = output<BnetRegion>();

  readonly regions = REGIONS;
  readonly regionFlags = REGION_FLAGS;
}
