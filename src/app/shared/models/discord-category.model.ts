/** A Discord channel category. */
export interface DiscordCategory {
  id: string;
  name: string;
  /** Whether the bot currently holds Manage Channels on this category — false blocks channel creation there. */
  canCreateChannel: boolean;
}

/** The guild's Discord channel categories, along with the bot's channel-creation reach. */
export interface GuildCategories {
  /** Whether the bot holds Manage Channels as a base guild permission — required to create a channel outside of any category. */
  canCreateRootChannel: boolean;
  categories: DiscordCategory[];
}
