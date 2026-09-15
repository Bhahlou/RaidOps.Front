import { Component, computed, input } from '@angular/core';
import { RaidMarkerIcon, raidMarkerIconUrl } from '../../../../features/guilds/raids/models/raid-marker-icon.enum';

/** Renders one of WoW's 8 fixed raid target markers, bundled as local assets (never fetched externally). */
@Component({
  selector: 'app-raid-marker-icon',
  imports: [],
  templateUrl: './raid-marker-icon.component.html',
  styleUrl: './raid-marker-icon.component.scss',
})
export class RaidMarkerIconComponent {
  readonly marker = input.required<RaidMarkerIcon>();
  /** Side length in pixels. The icon is always square. */
  readonly size = input(24);

  readonly iconUrl = computed(() => raidMarkerIconUrl(this.marker()));
}
