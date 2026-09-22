/** A guild's visual strategy board for one boss. V1 only ever surfaces one per boss. */
export interface RaidPlan {
  id: number;
  name: string;
  raidBossId: number;
}
