const KEY_PREFIX = 'guild-last-branch:';

/** Last branch the user visited on a given guild, or null if none recorded (or malformed). */
export function getLastVisitedBranchId(guildId: string): number | null {
  const raw = localStorage.getItem(`${KEY_PREFIX}${guildId}`);
  if (raw === null) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Records the branch the user is currently viewing, read back by `guildDefaultBranchGuard`. */
export function setLastVisitedBranchId(guildId: string, branchId: number): void {
  localStorage.setItem(`${KEY_PREFIX}${guildId}`, String(branchId));
}
