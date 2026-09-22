/** Lightweight preview reference for the list page — no slot detail. */
export interface RaidCompositionPreviewSummary {
  id: number;
  name: string;
  groupCount: number;
  /** ISO datetime string — last update, or creation time if never updated. */
  updatedAt: string;
}

/** One filled (group, slot) coordinate of a preview's grid — empty coordinates are simply absent. */
export interface RaidCompositionPreviewSlot {
  groupNumber: number;
  slotNumber: number;
  wowClassId: number | null;
  wowClassName: string | null;
  /** Hex color of the placeholder class, prefixed with `#`, or `null` if unset. */
  wowClassColor: string | null;
  specId: number | null;
  specName: string | null;
  specIconUrl: string | null;
  note: string | null;
}

/** Full detail of a raid composition preview, backing the composer page. `slots` is sparse. */
export interface RaidCompositionPreview {
  id: number;
  name: string;
  groupCount: number;
  slotsPerGroup: number;
  slots: RaidCompositionPreviewSlot[];
}

export interface CreateRaidCompositionPreviewPayload {
  name: string;
  /** Number of groups in the grid — between 1 and 8. Slots per group is always 5. */
  groupCount: number;
}

export interface UpdateRaidCompositionPreviewSlotPayload {
  groupNumber: number;
  slotNumber: number;
  wowClassId: number | null;
  specId: number | null;
  note: string | null;
}
