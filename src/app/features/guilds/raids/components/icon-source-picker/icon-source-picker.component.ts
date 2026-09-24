import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import { AttributionRoleIconComponent } from '../../../../../shared/components/icons/attribution-role-icon/attribution-role-icon.component';
import { SpellPickerComponent } from '../spell-picker/spell-picker.component';
import { RaidMarkerPickerComponent } from '../raid-marker-picker/raid-marker-picker.component';
import { SpecRole, SPEC_ROLE_ORDER } from '../../../../../shared/models/spec-role.enum';
import { AttributionIconSource } from '../../models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../models/raid-marker-icon.enum';
import { Spell } from '../../models/spell.model';

export interface IconSourceState {
  iconSource: AttributionIconSource;
  spellId: number | null;
  spellIconUrl: string | null;
  raidMarker: RaidMarkerIcon | null;
  staticRole: SpecRole | null;
}

export const BLANK_ICON_SOURCE: IconSourceState = {
  iconSource: AttributionIconSource.None,
  spellId: null,
  spellIconUrl: null,
  raidMarker: null,
  staticRole: null,
};

/**
 * Standalone marker/role/spell icon picker — a preview of the current icon (or "no icon") plus the
 * three pick-a-source rows, with a clear button. Used wherever an icon needs picking independent
 * of an attribution cell (a section header icon, in the settings dialog and inline in the row
 * composer) — deliberately NOT used by the row composer's own per-cell icon picker, which is a
 * settled, already-shipped UI not worth touching just to share this markup.
 */
@Component({
  selector: 'app-icon-source-picker',
  imports: [TranslocoPipe, ButtonComponent, SpellIconComponent, RaidMarkerIconComponent, AttributionRoleIconComponent, SpellPickerComponent, RaidMarkerPickerComponent],
  templateUrl: './icon-source-picker.component.html',
  styleUrl: './icon-source-picker.component.scss',
})
export class IconSourcePickerComponent {
  readonly IconSource = AttributionIconSource;
  readonly staticRoleOrder = SPEC_ROLE_ORDER;

  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  readonly value = input.required<IconSourceState>();

  readonly changed = output<IconSourceState>();

  onMarkerSelected(marker: RaidMarkerIcon): void {
    this.changed.emit({ iconSource: AttributionIconSource.RaidMarker, raidMarker: marker, spellId: null, spellIconUrl: null, staticRole: null });
  }

  onStaticRoleSelected(role: SpecRole): void {
    this.changed.emit({ iconSource: AttributionIconSource.StaticRole, staticRole: role, spellId: null, spellIconUrl: null, raidMarker: null });
  }

  onSpellSelected(spell: Spell): void {
    this.changed.emit({ iconSource: AttributionIconSource.Spell, spellId: spell.id, spellIconUrl: spell.iconUrl, raidMarker: null, staticRole: null });
  }

  clear(): void {
    this.changed.emit(BLANK_ICON_SOURCE);
  }
}
