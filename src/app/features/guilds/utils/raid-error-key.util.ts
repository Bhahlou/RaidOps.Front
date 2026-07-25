import { HttpErrorResponse } from '@angular/common/http';

/** Mirrors the backend's `ResponseDetail` raid-builder constants onto `raidBuilder.errors.*` i18n keys. */
const RAID_ERROR_KEYS: Record<string, string> = {
  RaidZoneNotFound: 'raidBuilder.errors.raidZoneNotFound',
  RaidSeriesNotFound: 'raidBuilder.errors.raidSeriesNotFound',
  RaidEventNotFound: 'raidBuilder.errors.raidEventNotFound',
  RaidEventCancelled: 'raidBuilder.errors.raidEventCancelled',
  RaidEventHasAssignments: 'raidBuilder.errors.raidEventHasAssignments',
  SlotOccupied: 'raidBuilder.errors.slotOccupied',
  InvalidGroupOrSlotNumber: 'raidBuilder.errors.invalidGroupOrSlotNumber',
  CharacterNotOnRoster: 'raidBuilder.errors.characterNotOnRoster',
  BranchMismatch: 'raidBuilder.errors.branchMismatch',
  PlayerAlreadyAssignedInEvent: 'raidBuilder.errors.playerAlreadyAssignedInEvent',
  MemberDeclaredAbsent: 'raidBuilder.errors.memberDeclaredAbsent',
  RaidLockoutConflict: 'raidBuilder.errors.raidLockoutConflict',
  RaidEventAlreadyPublished: 'raidBuilder.errors.raidEventAlreadyPublished',
};

/** Resolves a failed raid-builder API call to its translated error key, falling back to the generic server error. */
export function raidErrorKey(err: HttpErrorResponse): string {
  const code = (err.error as { error?: string } | null)?.error;
  return (code && RAID_ERROR_KEYS[code]) || 'errors.server';
}
