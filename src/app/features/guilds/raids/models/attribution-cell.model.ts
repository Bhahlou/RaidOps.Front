import { AttributionCellKind } from './attribution-cell-kind.enum';
import { AttributionIconSource } from './attribution-icon-source.enum';
import { RaidMarkerIcon } from './raid-marker-icon.enum';
import { SpecRole } from '../../../../shared/models/spec-role.enum';

/** One ordered cell of a `GuildAttributionDefinition` row — either a display-only icon or a fillable name slot. */
export interface AttributionCell {
  id: number;
  kind: AttributionCellKind;
  iconSource: AttributionIconSource;
  spellId: number | null;
  spellIconUrl: string | null;
  raidMarker: RaidMarkerIcon | null;
  staticRole: SpecRole | null;
  slotLabel: string | null;
  requiredClassIds: number[];
  requiredRoles: SpecRole[];
  requiredSpecIds: number[];
}

/** Payload for one cell within a `GuildAttributionDefinitionPayload`. */
export interface AttributionCellPayload {
  kind: AttributionCellKind;
  iconSource: AttributionIconSource;
  spellId: number | null;
  raidMarker: RaidMarkerIcon | null;
  staticRole: SpecRole | null;
  slotLabel: string | null;
  requiredClassIds: number[];
  requiredRoles: SpecRole[];
  requiredSpecIds: number[];
}
