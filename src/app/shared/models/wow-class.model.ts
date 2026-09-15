/** A WoW class as returned by GET /api/v1/wowclasses. */
export interface WowClass {
  id: number;
  name: string;
  color: string;
  firstExpansionId: number;
}
