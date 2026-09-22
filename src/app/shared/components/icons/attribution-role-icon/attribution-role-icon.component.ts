import { Component, computed, input } from '@angular/core';
import { SpecRole, specRoleIconUrl } from '../../../models/spec-role.enum';

/** Renders one of the 4 fixed role icons (Tank/Healer/RangedDps/MeleeDps), bundled as local assets (never fetched externally). */
@Component({
  selector: 'app-attribution-role-icon',
  imports: [],
  templateUrl: './attribution-role-icon.component.html',
  styleUrl: './attribution-role-icon.component.scss',
})
export class AttributionRoleIconComponent {
  readonly role = input.required<SpecRole>();
  /** Side length in pixels. The icon is always square. */
  readonly size = input(24);

  readonly iconUrl = computed(() => specRoleIconUrl(this.role()));
}
