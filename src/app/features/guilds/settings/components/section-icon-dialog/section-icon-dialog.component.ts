import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { IconSourcePickerComponent, IconSourceState } from '../../../raids/components/icon-source-picker/icon-source-picker.component';

export interface SectionIconDialogData {
  guildId: string;
  expansionId: number;
  /** Scope of the section being edited — the boss's ID, or `null` for a "General" section. */
  raidBossId: number | null;
  section: string;
  icon: IconSourceState;
}

/** Small dialog to set the icon shown on a section header — independent of any row's own cell icon. */
@Component({
  selector: 'app-section-icon-dialog',
  imports: [TranslocoPipe, ButtonComponent, IconSourcePickerComponent],
  templateUrl: './section-icon-dialog.component.html',
  styleUrl: './section-icon-dialog.component.scss',
})
export class SectionIconDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #definitionsService = inject(AttributionDefinitionsService);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<SectionIconDialogData>(DIALOG_DATA);

  readonly icon = signal(this.data.icon);
  readonly submitting = signal(false);

  submit(): void {
    this.submitting.set(true);

    this.#definitionsService
      .setSectionIcon(this.data.guildId, { raidBossId: this.data.raidBossId, section: this.data.section, ...this.icon() })
      .subscribe({
        next: () => {
          this.#snackbar.success('guildSettings.attributions.sectionIcon.saveSuccess');
          this.#dialogRef.close(true);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.#snackbar.error(err.error?.error ? `guildSettings.attributions.errors.${err.error.error}` : 'errors.server');
        },
      });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
