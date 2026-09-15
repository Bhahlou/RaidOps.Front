import { AttributionCell, AttributionCellPayload } from './attribution-cell.model';

/** A single row of a guild's raid-attribution template. */
export interface GuildAttributionDefinition {
  id: number;
  label: string;
  /** Free-text grouping label, or `null` for an ungrouped row. */
  section: string | null;
  /** Whether officers can add a variable number of instances of this row per raid event (e.g. "Innervate"). */
  isRepeatable: boolean;
  cells: AttributionCell[];
  sortOrder: number;
}

/** Payload for creating/updating a `GuildAttributionDefinition`. */
export interface GuildAttributionDefinitionPayload {
  label: string;
  section: string | null;
  isRepeatable: boolean;
  cells: AttributionCellPayload[];
}
