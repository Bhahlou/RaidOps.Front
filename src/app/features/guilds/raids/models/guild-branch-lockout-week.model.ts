/**
 * The current weekly raid-lockout window for a guild branch, in local calendar dates
 * (`yyyy-MM-dd`). Both fields are `null` when the branch has no region configured yet — callers
 * should fall back to their own default range in that case.
 */
export interface GuildBranchLockoutWeek {
  weekStartLocal: string | null;
  weekEndLocal: string | null;
}
