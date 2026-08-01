import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { RaidEvent, RaidEventPayload } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { RaidZonePickerComponent } from '../raid-zone-picker/raid-zone-picker.component';

export interface EditRaidEventDialogData {
  guildId: string;
  guildBranchId: number;
  event: RaidEvent;
}

/**
 * Dialog for editing or deleting a single raid event occurrence. Deletion is always available and
 * permanently removes the event along with any slot assignments it has — the confirm dialog warns
 * more strongly when there's roster history to lose (see `hasAssignments`).
 */
@Component({
  selector: 'app-edit-raid-event-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, RaidZonePickerComponent],
  templateUrl: './edit-raid-event-dialog.component.html',
  styleUrl: './edit-raid-event-dialog.component.scss',
})
export class EditRaidEventDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);
  readonly data = inject<EditRaidEventDialogData>(DIALOG_DATA);

  readonly Publication = RaidPublicationStatus;
  readonly zones = this.#zoneStore.zones;

  readonly isReadOnly = this.data.event.status !== RaidEventStatus.Scheduled;
  readonly hasAssignments = this.data.event.assignments.length > 0;
  readonly isDraft = this.data.event.publicationStatus === RaidPublicationStatus.Draft;

  readonly name = signal(this.data.event.name);
  readonly startsAtLocal = signal(toDatetimeLocal(this.data.event.startsAtUtc));
  readonly groupCount = signal(this.data.event.groupCount);
  readonly slotsPerGroup = signal(this.data.event.slotsPerGroup);
  readonly selectedZoneIds = signal<Set<number>>(new Set(this.data.event.raidZones.map((z) => z.id)));

  readonly submitting = signal(false);

  readonly canSubmit = computed(
    () =>
      !this.isReadOnly &&
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

  submit(): void {
    if (!this.canSubmit()) return;

    const payload: RaidEventPayload = {
      name: this.name().trim(),
      startsAtUtc: new Date(this.startsAtLocal()).toISOString(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: this.data.event.signupMode,
      raidZoneIds: [...this.selectedZoneIds()],
    };

    this.submitting.set(true);
    this.#boardStore.updateEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id, payload).subscribe({
      next: () => {
        this.#snackbar.success('raidBuilder.eventDialog.saveSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(raidErrorKey(err));
      },
    });
  }

  publish(): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.eventDialog.publishConfirmTitle',
          message: 'raidBuilder.publishConfirm',
          messageParams: { name: this.data.event.name },
          confirmLabel: 'raidBuilder.publish',
          danger: false,
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#boardStore.publishEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id).subscribe({
          next: () => {
            this.#snackbar.success('raidBuilder.eventDialog.publishSuccess');
            this.#dialogRef.close(true);
          },
          error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
        });
      });
  }

  deleteEvent(): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.eventDialog.deleteConfirmTitle',
          message: this.hasAssignments
            ? 'raidBuilder.eventDialog.deleteConfirmMessageWithAssignments'
            : 'raidBuilder.eventDialog.deleteConfirmMessage',
          messageParams: { name: this.data.event.name },
          confirmLabel: 'raidBuilder.eventDialog.deleteEvent',
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#boardStore.deleteEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id).subscribe({
          next: () => {
            this.#snackbar.success('raidBuilder.eventDialog.deleteSuccess');
            this.#dialogRef.close(true);
          },
          error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
        });
      });
  }

  close(): void {
    this.#dialogRef.close(false);
  }
}

/** Converts a UTC ISO datetime string to a `datetime-local` input value in the browser's local timezone. */
function toDatetimeLocal(isoUtc: string): string {
  const date = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
