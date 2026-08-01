import { HttpErrorResponse } from '@angular/common/http';
import { raidErrorKey } from './raid-error-key.util';

const errorResponse = (code?: string): HttpErrorResponse => new HttpErrorResponse({ error: code ? { error: code } : null });

describe('raidErrorKey', () => {
  it('maps a known backend error code to its translated key', () => {
    expect(raidErrorKey(errorResponse('SlotOccupied'))).toBe('raidBuilder.errors.slotOccupied');
  });

  it('maps every known backend error code', () => {
    const codes: Record<string, string> = {
      RaidZoneNotFound: 'raidBuilder.errors.raidZoneNotFound',
      RaidSeriesNotFound: 'raidBuilder.errors.raidSeriesNotFound',
      RaidEventNotFound: 'raidBuilder.errors.raidEventNotFound',
      SlotOccupied: 'raidBuilder.errors.slotOccupied',
      BothSlotsMustBeOccupiedToSwap: 'raidBuilder.errors.bothSlotsMustBeOccupiedToSwap',
      InvalidGroupOrSlotNumber: 'raidBuilder.errors.invalidGroupOrSlotNumber',
      CharacterNotOnRoster: 'raidBuilder.errors.characterNotOnRoster',
      BranchMismatch: 'raidBuilder.errors.branchMismatch',
      PlayerAlreadyAssignedInEvent: 'raidBuilder.errors.playerAlreadyAssignedInEvent',
      MemberDeclaredAbsent: 'raidBuilder.errors.memberDeclaredAbsent',
      RaidLockoutConflict: 'raidBuilder.errors.raidLockoutConflict',
      RaidEventAlreadyPublished: 'raidBuilder.errors.raidEventAlreadyPublished',
      GridShrinkWouldOrphanAssignments: 'raidBuilder.errors.gridShrinkWouldOrphanAssignments',
    };

    for (const [code, key] of Object.entries(codes)) {
      expect(raidErrorKey(errorResponse(code))).toBe(key);
    }
  });

  it('falls back to the generic server error for an unknown backend code', () => {
    expect(raidErrorKey(errorResponse('SomethingUnmapped'))).toBe('errors.server');
  });

  it('falls back to the generic server error when the response body has no error code', () => {
    expect(raidErrorKey(errorResponse())).toBe('errors.server');
  });
});
