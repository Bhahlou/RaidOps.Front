/** A WoW spec (specialisation) as returned by GET /api/v1/specs. */
export interface Spec {
  id: number;
  name: string;
  role: string;
  classId: number;
  iconUrl: string | null;
}
