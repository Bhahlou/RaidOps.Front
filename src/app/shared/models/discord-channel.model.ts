export interface DiscordChannel {
  id: string;
  name: string;
  /** Whether the bot currently has permission to post messages in this channel. */
  botCanSendMessages: boolean;
  /** Name of the category this channel is nested under, or null if it isn't in one. */
  categoryName: string | null;
}
