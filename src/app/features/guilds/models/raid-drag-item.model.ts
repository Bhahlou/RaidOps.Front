/**
 * CDK drag payload shared by the roster pool (drag source only) and occupied raid slots
 * (drag source + drop target) — internal UI shape, not part of the API contract. Only carries
 * what the drop handlers actually consume (`characterId`) plus minimal display data available
 * from both sources (roster member and slot assignment alike) — `className`/`raidSpecs` aren't
 * on `RaidSlotAssignment`, so they're deliberately left off this shared shape.
 */
export interface RaidDragItem {
  characterId: number;
  characterName: string;
  classId: number;
  classColor: string;
  /** The assigned player, so a drop target can tell whether they're declared absent for it while the drag is in progress. */
  playerDiscordId: string;
  /**
   * Set when the drag started from an already-occupied slot (repositioning within the grid, or
   * swapping with another occupied slot). Carries the origin event's ID so a drop target can tell
   * a same-event swap (allowed) apart from a cross-event drag onto an occupied slot (rejected —
   * `SwapSlotAssignmentsCommand` only operates within a single event).
   */
  fromSlot?: { eventId: number; groupNumber: number; slotNumber: number };
}
