import { Component, input, model } from '@angular/core';
import { RaidZone } from '../../models/raid-zone.model';
import { raidZoneIconUrl } from '../../utils/raid-zone-icon.util';

/**
 * Toggleable grid of raid-zone medallions — the icon-driven replacement for a plain checkbox
 * list, shared by every dialog that lets an officer pick a raid's target zones (create/edit event,
 * create/edit series). Same medallion look as the read-only zone icons in the raids page header.
 */
@Component({
  selector: 'app-raid-zone-picker',
  standalone: true,
  templateUrl: './raid-zone-picker.component.html',
  styleUrl: './raid-zone-picker.component.scss',
})
export class RaidZonePickerComponent {
  readonly zones = input.required<RaidZone[]>();
  readonly disabled = input(false);
  readonly selectedZoneIds = model.required<Set<number>>();

  isSelected(zoneId: number): boolean {
    return this.selectedZoneIds().has(zoneId);
  }

  toggle(zoneId: number): void {
    if (this.disabled()) return;
    this.selectedZoneIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }

  iconUrl(zone: RaidZone): string | null {
    return raidZoneIconUrl(zone.shortCode);
  }
}
