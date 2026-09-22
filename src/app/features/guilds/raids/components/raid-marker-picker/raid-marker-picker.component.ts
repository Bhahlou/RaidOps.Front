import { Component, input, output } from '@angular/core';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import { RAID_MARKER_ORDER, RaidMarkerIcon } from '../../models/raid-marker-icon.enum';

/** Single-row picker for WoW's 8 fixed raid target markers — no search needed, just a small fixed set. */
@Component({
  selector: 'app-raid-marker-picker',
  imports: [RaidMarkerIconComponent],
  templateUrl: './raid-marker-picker.component.html',
  styleUrl: './raid-marker-picker.component.scss',
})
export class RaidMarkerPickerComponent {
  readonly markers = RAID_MARKER_ORDER;
  /** The currently active marker, if any, so it can be highlighted. */
  readonly activeMarker = input<RaidMarkerIcon | null>(null);
  readonly selected = output<RaidMarkerIcon>();
}
