/** Builds the `/characters/:branch/:realm/:name` route segments for a character's detail page. */
export function characterLink(branchName: string, realmSlug: string, characterName: string): string[] {
  return ['/characters', branchName.toLowerCase().replace(/[\s_]+/g, '-'), realmSlug, characterName.toLowerCase()];
}
