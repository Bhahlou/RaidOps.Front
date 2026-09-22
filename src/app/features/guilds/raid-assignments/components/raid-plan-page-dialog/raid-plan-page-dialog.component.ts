import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidPlansService } from '../../../raids/services/raid-plans.service';
import { RaidPlanPage } from '../../../raids/models/raid-plan-page.model';

export interface RaidPlanPageDialogData {
  guildId: string;
  raidPlanId: number;
  /** `null` to create a new page, otherwise the page being renamed. */
  page: RaidPlanPage | null;
}

/** Create/rename dialog for a raid-plan page — a single name field, same dual-purpose shape as the attribution definition dialog. */
@Component({
  selector: 'app-raid-plan-page-dialog',
  imports: [TranslocoPipe, ButtonComponent, FormFieldCardComponent],
  templateUrl: './raid-plan-page-dialog.component.html',
})
export class RaidPlanPageDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #plansService = inject(RaidPlansService);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<RaidPlanPageDialogData>(DIALOG_DATA);

  readonly isEditMode = this.data.page !== null;
  readonly name = signal(this.data.page?.name ?? '');
  readonly submitting = signal(false);

  submit(): void {
    const name = this.name().trim();
    if (!name) return;

    this.submitting.set(true);

    const request$ = this.data.page
      ? this.#plansService.renamePage(this.data.guildId, this.data.raidPlanId, this.data.page.id, name)
      : this.#plansService.createPage(this.data.guildId, this.data.raidPlanId, name);

    request$.subscribe({
      next: () => this.#dialogRef.close(true),
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(err.error?.error ? `raidBuilder.raidPlan.errors.${err.error.error}` : 'errors.server');
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
