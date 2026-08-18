import { Component, input, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RaidZone } from '../../models/raid-zone.model';
import { RaidZonePickerComponent } from '../raid-zone-picker/raid-zone-picker.component';

/**
 * The "target raid zones" field-group shared verbatim by the create/edit event and
 * create/edit series dialogs — label, empty-zones hint, and the zone picker itself.
 */
@Component({
  selector: 'app-raid-zone-field',
  standalone: true,
  imports: [TranslocoPipe, RaidZonePickerComponent],
  templateUrl: './raid-zone-field.component.html',
  styleUrl: './raid-zone-field.component.scss',
})
export class RaidZoneFieldComponent {
  readonly zones = input.required<RaidZone[]>();
  readonly selectedZoneIds = model.required<Set<number>>();
  readonly disabled = input(false);
}
