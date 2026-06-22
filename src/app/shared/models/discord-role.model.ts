export interface DiscordRole {
  id: string;
  name: string;
  /** Discord color integer (0 = no colour). Convert with `formatDiscordColor` from shared/utils. */
  color: number;
  /** Discord role icon hash, or null if the role has no custom icon. */
  iconHash: string | null;
}
