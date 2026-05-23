/** A WoW branch (game version) as returned by GET /api/v1/branches. */
export interface BranchDto {
  id: number;
  name: string;
  bnetNamespacePrefix: string;
  currentExpansionShortCode: string;
}
