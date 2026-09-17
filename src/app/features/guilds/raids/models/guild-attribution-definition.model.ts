import { AttributionCell, AttributionCellPayload } from './attribution-cell.model';
import { AttributionIconSource } from './attribution-icon-source.enum';
import { RaidMarkerIcon } from './raid-marker-icon.enum';
import { SpecRole } from '../../../../shared/models/spec-role.enum';

/** A single row of a guild's raid-attribution template. */
export interface GuildAttributionDefinition {
  id: number;
  label: string;
  /** Free-text grouping label, or `null` for an ungrouped row. */
  section: string | null;
  /** Whether officers can add a variable number of instances of this row per raid event (e.g. "Innervate"). */
  isRepeatable: boolean;
  /** FK to the boss this row is scoped to, or `null` for a "General" row shown on every raid event. */
  raidBossId: number | null;
  /** What icon-related field to render for this row's section header, independent of any cell icon. Denormalized across every row sharing the same section — see `SetAttributionSectionIconPayload`. */
  sectionIconSource: AttributionIconSource;
  sectionSpellId: number | null;
  sectionSpellIconUrl: string | null;
  sectionRaidMarker: RaidMarkerIcon | null;
  sectionStaticRole: SpecRole | null;
  cells: AttributionCell[];
  sortOrder: number;
}

/** Payload for updating a `GuildAttributionDefinition` — the row's boss scope can't be changed after creation. */
export interface GuildAttributionDefinitionPayload {
  label: string;
  section: string | null;
  isRepeatable: boolean;
  cells: AttributionCellPayload[];
}

/** Payload for creating a `GuildAttributionDefinition`. */
export interface CreateGuildAttributionDefinitionPayload extends GuildAttributionDefinitionPayload {
  /** Scope to create the row under — the boss's ID, or `null` for a "General" row. */
  raidBossId: number | null;
}

/** Payload for setting the section-header icon shared by every row of a (scope, section) tuple. */
export interface SetAttributionSectionIconPayload {
  raidBossId: number | null;
  section: string;
  iconSource: AttributionIconSource;
  spellId: number | null;
  raidMarker: RaidMarkerIcon | null;
  staticRole: SpecRole | null;
}
