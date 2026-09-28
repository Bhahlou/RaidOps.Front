import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminStore } from '../../../../core/stores/admin.store';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { RaidBuffUpsertSummary } from '../../../../shared/models/raid-buff-definition.model';
import { allExpansions } from '../../../../shared/utils/expansion-id.util';
import { MAX_IMPORT_CHARS, parseRaidBuffExport } from '../../../../shared/utils/raid-buff-import.util';

/** What the dialog closes with once an import went through. */
export interface RaidBuffImportResult {
  /** The expansion the file was written to. */
  expansionId: number;
  summary: RaidBuffUpsertSummary;
}

/** Owner-only dialog to paste an exported definitions JSON and write it to the file's expansion. */
@Component({
  selector: 'app-raid-buff-import-dialog',
  imports: [TranslocoPipe, ButtonComponent, CheckboxComponent],
  templateUrl: './raid-buff-import-dialog.component.html',
  styleUrl: './raid-buff-import-dialog.component.scss',
})
export class RaidBuffImportDialogComponent {
  readonly #dialogRef = inject(DialogRef<RaidBuffImportResult | null>);
  readonly #adminStore = inject(AdminStore);

  readonly maxChars = MAX_IMPORT_CHARS;

  readonly text = signal('');
  readonly pruneMissing = signal(false);
  readonly submitting = signal(false);
  /** The back-end's validation detail from the last refused import, shown verbatim (owner-only screen). */
  readonly serverError = signal<string | null>(null);

  /** The parse outcome of the pasted text; `null` while nothing is pasted. */
  readonly parsed = computed(() => (this.text().trim() ? parseRaidBuffExport(this.text()) : null));

  readonly preview = computed(() => {
    const parsed = this.parsed();
    if (!parsed?.ok) return null;

    return {
      count: parsed.file.definitions.length,
      expansion: allExpansions().find((e) => e.id === parsed.file.expansionId)?.shortCode ?? `#${parsed.file.expansionId}`,
    };
  });

  readonly canSubmit = computed(() => this.parsed()?.ok === true && !this.submitting());

  onTextInput(value: string): void {
    this.text.set(value);
    this.serverError.set(null);
  }

  submit(): void {
    const parsed = this.parsed();
    if (!parsed?.ok || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    this.#adminStore.importRaidBuffs(parsed.file.expansionId, parsed.file.definitions, this.pruneMissing()).subscribe({
      next: (summary) => this.#dialogRef.close({ expansionId: parsed.file.expansionId, summary }),
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.serverError.set(err.error?.detail ?? null);
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(null);
  }
}
