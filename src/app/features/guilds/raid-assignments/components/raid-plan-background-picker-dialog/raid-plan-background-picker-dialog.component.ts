import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { raidPlanBackgroundsForZone, raidPlanBackgroundUrl } from '../../../raids/models/raid-plan-backgrounds.enum';

export interface RaidPlanBackgroundPickerDialogData {
  zoneShortCode: string;
}

/**
 * Picks a background key from the curated, built-in manifest for the page's raid zone — never a
 * pasted URL or upload. Closes with the chosen key, `null` to clear the current background, or
 * `undefined` if cancelled.
 */
@Component({
  selector: 'app-raid-plan-background-picker-dialog',
  imports: [TranslocoPipe, ButtonComponent, EmptyHintComponent],
  templateUrl: './raid-plan-background-picker-dialog.component.html',
  styleUrl: './raid-plan-background-picker-dialog.component.scss',
})
export class RaidPlanBackgroundPickerDialogComponent {
  readonly #dialogRef = inject(DialogRef<string | null | undefined>);
  readonly data = inject<RaidPlanBackgroundPickerDialogData>(DIALOG_DATA);

  readonly options = raidPlanBackgroundsForZone(this.data.zoneShortCode);

  urlFor(key: string): string | null {
    return raidPlanBackgroundUrl(key);
  }

  choose(key: string | null): void {
    this.#dialogRef.close(key);
  }

  cancel(): void {
    this.#dialogRef.close(undefined);
  }
}
