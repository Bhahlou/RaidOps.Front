/** One Discord permission the bot needs on a channel to post notification embeds there. */
export enum DiscordChannelPermissionFlag {
  ViewChannel = 'ViewChannel',
  SendMessages = 'SendMessages',
  EmbedLinks = 'EmbedLinks',
}

export interface DiscordChannel {
  id: string;
  name: string;
  /** Which permissions the bot currently lacks in this channel — empty when it can post there. */
  missingPermissions: DiscordChannelPermissionFlag[];
  /** Name of the category this channel is nested under, or null if it isn't in one. */
  categoryName: string | null;
}
