import { raidRoleForSpec, RaidRole } from '../../raids/utils/raid-role.util';
import { RaidCompositionPreviewSlot } from '../models/raid-composition-preview.model';

/** Tally of placeholder specs per raid role, for the composer header's role counter. */
export function countPreviewRoles(slots: RaidCompositionPreviewSlot[]): Record<RaidRole, number> {
  const counts: Record<RaidRole, number> = { tank: 0, heal: 0, melee: 0, ranged: 0 };
  for (const slot of slots) {
    if (slot.specId == null) continue;
    const role = raidRoleForSpec(slot.specId);
    if (role) counts[role]++;
  }
  return counts;
}
