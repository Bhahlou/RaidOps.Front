/** Formats a Discord color integer (0 = no colour) as a CSS hex string, or null if unset. */
export function formatDiscordColor(color: number): string | null {
  return color === 0 ? null : '#' + color.toString(16).padStart(6, '0');
}
