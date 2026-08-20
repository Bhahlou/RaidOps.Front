import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { RaidsService } from '../../services/raids.service';

export interface RaidGroupingCharacterDialogData {
  guildId: string;
  guildBranchId: number;
  eventId: number;
}

/**
 * Shown when an officer triggers the grouping ping but has no character assigned to the raid
 * themselves — the backend can't infer who the "/w ... inv" ping should reference, so this asks
 * to pick one of the raid's assigned characters and resubmits with it.
 */
@Component({
  selector: 'app-raid-grouping-character-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, SelectComponent],
  templateUrl: './raid-grouping-character-dialog.component.html',
  styleUrl: './raid-grouping-character-dialog.component.scss',
})
export class RaidGroupingCharacterDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #raidsService = inject(RaidsService);
  readonly data = inject<RaidGroupingCharacterDialogData>(DIALOG_DATA);

  readonly characterOptions = signal<SelectOption<string>[]>([]);
  readonly loadingCharacters = signal(true);
  readonly selectedCharacterName = signal<string | null>(null);

  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);

  readonly canSubmit = computed(() => !this.submitting() && !!this.selectedCharacterName());

  constructor() {
    this.#raidsService.getAssignedCharacters(this.data.guildId, this.data.guildBranchId, this.data.eventId).subscribe({
      next: (characters) => {
        this.characterOptions.set(characters.map((c) => ({ value: c.name, label: c.name })));
        this.loadingCharacters.set(false);
      },
      error: () => this.loadingCharacters.set(false),
    });
  }

  submit(): void {
    const characterName = this.selectedCharacterName();
    if (!this.canSubmit() || !characterName) return;

    this.submitting.set(true);
    this.errorKey.set(null);

    this.#raidsService.announceGrouping(this.data.guildId, this.data.guildBranchId, this.data.eventId, characterName).subscribe({
      next: () => this.#dialogRef.close(true),
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const code = (err.error as { error?: string } | null)?.error;
        this.errorKey.set(code === 'RaidGroupingCharacterNotFound' ? 'raidBuilder.detail.groupingCharacterNotFound' : 'raidBuilder.detail.groupingFailed');
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
