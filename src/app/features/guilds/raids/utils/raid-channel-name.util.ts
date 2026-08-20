import { formatDate } from '@angular/common';

/**
 * Suggests a Discord channel name for a raid: `<raid name> <short weekday+day+month>`, e.g.
 * `raid-kara-tue-18-aug` / `raid-kara-mar-18-août` / `raid-kara-di-18-aug` depending on
 * `language`. `startsAtLocal` is optional — a raid series has no single date (it recurs weekly),
 * so its channel is suggested from the name alone, e.g. `raid-kara`. Returns `''` only when the
 * raid name itself is empty, so callers can skip auto-filling.
 */
export function buildRaidChannelName(raidName: string, startsAtLocal: string, language: string): string {
  const trimmedName = raidName.trim();
  if (!trimmedName) return '';

  const date = startsAtLocal ? new Date(startsAtLocal) : null;
  const datePart = date && !Number.isNaN(date.getTime()) ? ` ${formatDate(date, 'EEE d MMM', language)}` : '';

  return slugifyChannelName(`${trimmedName}${datePart}`);
}

/** Lowercase, spaces to hyphens, strips punctuation Discord channel names don't need — keeps Unicode letters (accents included). */
function slugifyChannelName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}
