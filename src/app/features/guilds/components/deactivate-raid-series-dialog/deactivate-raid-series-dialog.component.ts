import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidSeries } from '../../models/raid-series.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';

export interface DeactivateRaidSeriesDialogData {
  guildId: string;
  guildBranchId: number;
  series: RaidSeries;
}

/**
 * Confirms stopping a recurring raid series — future materialization stops either way, the
 * checkbox is the only thing that changes. Checked, it additionally bulk-deletes the occurrences
 * the series already produced that are still empty and unpublished (draft, no assignments);
 * anything with roster history or already published is always left untouched, so this can never
 * silently erase attendance the way deleting a single populated event without asking would.
 */
@Component({
  selector: 'app-deactivate-raid-series-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, CheckboxComponent],
  templateUrl: './deactivate-raid-series-dialog.component.html',
  styleUrl: './deactivate-raid-series-dialog.component.scss',
})
export class DeactivateRaidSeriesDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #seriesStore = inject(RaidSeriesStore);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<DeactivateRaidSeriesDialogData>(DIALOG_DATA);

  readonly deleteEmptyOccurrences = signal(false);
  readonly submitting = signal(false);

  confirm(): void {
    this.submitting.set(true);
    this.#seriesStore
      .deactivateSeries(this.data.guildId, this.data.guildBranchId, this.data.series.id, this.deleteEmptyOccurrences())
      .subscribe({
        next: () => {
          this.#snackbar.success('raidBuilder.series.deactivateSuccess');
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
