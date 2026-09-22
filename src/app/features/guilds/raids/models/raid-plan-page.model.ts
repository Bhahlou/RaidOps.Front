/** One page of a `RaidPlan`'s tab bar (e.g. "Phase 1"), without its elements. */
export interface RaidPlanPage {
  id: number;
  name: string;
  sortOrder: number;
  /** Key into the bundled background-image manifest (see `raid-plan-backgrounds.enum.ts`), or `null` if none picked yet. */
  backgroundImageKey: string | null;
}
