import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { RaidSeries, RaidSeriesPayload } from '../../models/raid-series.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { RaidZonePickerComponent } from '../raid-zone-picker/raid-zone-picker.component';

export interface CreateRaidSeriesDialogData {
  guildId: string;
  guildBranchId: number;
  /** The series to edit, or `null` to create a new one. */
  series: RaidSeries | null;
}

/** Backend `DayOfWeek` enum names, in English — the value sent to/received from the API. Never localized (see the enum's own culture-invariant serialization). */
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Dialog for creating or editing a raid series (recurring template). `SignupMode` is hardcoded to
 * `DefaultPresent` — the sign-up mode isn't functional yet (Milestone 2), so the field is hidden.
 */
@Component({
  selector: 'app-create-raid-series-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, SelectComponent, RaidZonePickerComponent],
  templateUrl: './create-raid-series-dialog.component.html',
  styleUrl: './create-raid-series-dialog.component.scss',
})
export class CreateRaidSeriesDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #seriesStore = inject(RaidSeriesStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<CreateRaidSeriesDialogData>(DIALOG_DATA);

  readonly isEditMode = !!this.data.series;
  readonly zones = this.#zoneStore.zones;

  readonly dayOptions = computed<SelectOption<string>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return WEEKDAYS.map((day) => ({ value: day, label: this.#transloco.translate(`raidBuilder.weekday.${day}`) }));
  });

  readonly name = signal(this.data.series?.name ?? '');
  readonly recurrenceDayOfWeek = signal(this.data.series?.recurrenceDayOfWeek ?? 'Tuesday');
  readonly startTime = signal(this.data.series?.recurrenceStartTimeLocal.slice(0, 5) ?? '21:00');
  readonly recurrenceIntervalWeeks = signal(this.data.series?.recurrenceIntervalWeeks ?? 1);
  readonly groupCount = signal(this.data.series?.groupCount ?? 5);
  readonly slotsPerGroup = signal(this.data.series?.slotsPerGroup ?? 5);
  readonly selectedZoneIds = signal<Set<number>>(new Set(this.data.series?.raidZones.map((z) => z.id) ?? []));

  readonly submitting = signal(false);

  readonly canSubmit = computed(
    () =>
      !this.submitting() &&
      this.name().trim().length > 0 &&
      this.selectedZoneIds().size > 0 &&
      this.groupCount() > 0 &&
      this.slotsPerGroup() > 0 &&
      this.recurrenceIntervalWeeks() > 0,
  );

  constructor() {
    this.#zoneStore.load(this.data.guildId, this.data.guildBranchId);
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const payload: RaidSeriesPayload = {
      name: this.name().trim(),
      recurrenceDayOfWeek: this.recurrenceDayOfWeek(),
      recurrenceStartTimeLocal: `${this.startTime()}:00`,
      recurrenceIntervalWeeks: this.recurrenceIntervalWeeks(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: SignupMode.DefaultPresent,
      raidZoneIds: [...this.selectedZoneIds()],
    };

    this.submitting.set(true);
    const request = this.data.series
      ? this.#seriesStore.updateSeries(this.data.guildId, this.data.guildBranchId, this.data.series.id, payload)
      : this.#seriesStore.createSeries(this.data.guildId, this.data.guildBranchId, payload);

    request.subscribe({
      next: () => {
        this.#snackbar.success('raidBuilder.seriesDialog.saveSuccess');
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
