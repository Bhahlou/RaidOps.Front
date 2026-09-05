import { effect, signal, Signal, WritableSignal } from '@angular/core';
import { SelectOption } from '../../../../shared/components/form/select/select.component';
import { RaidEventChoice } from '../models/raid-event.model';
import { RaidsService } from '../services/raids.service';

/**
 * Fetches the branch's raid-event choices (for the create/edit dialogs' "extends the lockout of"
 * picker) scoped to the lockout window around `startsAtLocal`, re-fetching whenever it changes.
 * Empty until a start date is set, since there's no window to scope the pick-list to yet.
 * Registers a signal effect internally, so this must be called from an injection context — in
 * practice, a dialog component's own constructor.
 */
export function watchRaidEventChoices(
  raidsService: RaidsService,
  guildId: string,
  guildBranchId: number,
  startsAtLocal: Signal<string>,
): Signal<RaidEventChoice[]> {
  const raidEventChoices = signal<RaidEventChoice[]>([]);

  effect(() => {
    const value = startsAtLocal();
    if (!value) {
      raidEventChoices.set([]);
      return;
    }
    const aroundStartsAtUtc = new Date(value).toISOString();
    raidsService.getEventChoices(guildId, guildBranchId, aroundStartsAtUtc).subscribe((choices) => raidEventChoices.set(choices));
  });

  return raidEventChoices.asReadonly();
}

/**
 * A previously-picked target can fall out of the window after a later date change — CdkListbox
 * throws (breaking the overlay's own positioning) if `value` ever points at a missing option.
 * Registers a signal effect internally, so this must be called from an injection context.
 */
export function resetStaleExtendsRaidEventId(extendCandidates: Signal<SelectOption<number>[]>, extendsRaidEventId: WritableSignal<number | null>): void {
  effect(() => {
    const candidates = extendCandidates();
    const current = extendsRaidEventId();
    if (current !== null && !candidates.some((o) => o.value === current)) {
      extendsRaidEventId.set(null);
    }
  });
}
