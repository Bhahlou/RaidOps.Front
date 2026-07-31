import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { RaidEventPayload } from '../../models/raid-event.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { raidErrorKey } from '../../utils/raid-error-key.util';

export interface CreateRaidEventDialogData {
  guildId: string;
  guildBranchId: number;
}

/**
 * Dialog for creating an ad-hoc raid event (not backed by any recurring series). `SignupMode` is
 * hardcoded to `DefaultPresent` — sign-up mode isn't functional yet (Milestone 2).
 */
@Component({
  selector: 'app-create-raid-event-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './create-raid-event-dialog.component.html',
  styleUrl: './create-raid-event-dialog.component.scss',
})
export class CreateRaidEventDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<CreateRaidEventDialogData>(DIALOG_DATA);

  readonly zones = this.#zoneStore.zones;

  readonly name = signal('');
  /** `datetime-local` input value, `"yyyy-MM-ddTHH:mm"` in the browser's local timezone. */
  readonly startsAtLocal = signal('');
  readonly groupCount = signal(5);
  readonly slotsPerGroup = signal(5);
  readonly selectedZoneIds = signal<Set<number>>(new Set());

  readonly submitting = signal(false);

  readonly canSubmit = computed(
    () =>
      !this.submitting() &&
      this.name().trim().length > 0 &&
      this.startsAtLocal().length > 0 &&
      this.selectedZoneIds().size > 0 &&
      this.groupCount() > 0 &&
      this.slotsPerGroup() > 0,
  );

  constructor() {
    this.#zoneStore.load(this.data.guildId, this.data.guildBranchId);
  }

  toggleZone(zoneId: number): void {
    this.selectedZoneIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }

  isZoneSelected(zoneId: number): boolean {
    return this.selectedZoneIds().has(zoneId);
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const payload: RaidEventPayload = {
      name: this.name().trim(),
      startsAtUtc: new Date(this.startsAtLocal()).toISOString(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: SignupMode.DefaultPresent,
      raidZoneIds: [...this.selectedZoneIds()],
    };

    this.submitting.set(true);
    this.#boardStore.createEvent(this.data.guildId, this.data.guildBranchId, payload).subscribe({
      next: () => {
        this.#snackbar.success('raidBuilder.eventDialog.createSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(raidErrorKey(err));
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
