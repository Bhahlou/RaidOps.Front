/** A WoW branch (game version) as returned by GET /api/v1/branches. */
export interface Branch {
  id: number;
  name: string;
  bnetNamespacePrefix: string;
  currentExpansionShortCode: string;
}
