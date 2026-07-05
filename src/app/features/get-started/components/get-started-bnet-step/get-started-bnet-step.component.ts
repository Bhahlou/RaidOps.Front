import { Component, inject, signal, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { BnetLinkButtonComponent } from '../../../../shared/components/bnet-link-button/bnet-link-button.component';
import { BnetSyncPanelComponent } from '../../../characters/components/bnet-sync-panel/bnet-sync-panel.component';
import { CharacterActivationPanelComponent } from '../../../characters/components/character-activation-panel/character-activation-panel.component';
import {
  SetRaidSpecsDialogComponent,
  SetRaidSpecsDialogData,
} from '../../../characters/components/set-raid-specs-dialog/set-raid-specs-dialog.component';

/**
 * Step 3 of get-started: link Battle.net, sync, and activate characters — reusing the same panels
 * as the characters page (extracted from the BNet sync / import dialogs) so the logic isn't
 * duplicated. Activation still requires confirming raid-viable specs immediately after, with the
 * same rollback-on-cancel rule as the characters page: an activated character with no raid specs
 * configured is not a valid end state.
 */
@Component({
  selector: 'app-get-started-bnet-step',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
    BnetLinkButtonComponent,
    BnetSyncPanelComponent,
    CharacterActivationPanelComponent,
  ],
  templateUrl: './get-started-bnet-step.component.html',
  styleUrl: './get-started-bnet-step.component.scss',
})
export class GetStartedBnetStepComponent {
  readonly #characterStore = inject(CharacterStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(MatDialog);

  readonly isBnetLoading = this.#characterStore.isBnetLoading;
  readonly isBnetLinked = this.#characterStore.isBnetLinked;
  readonly isCharactersLoading = this.#characterStore.isCharactersLoading;

  /** Region picked to (re)link BNet — non-null while the sync panel should be shown. */
  readonly linkingRegion = signal<string | null>(null);

  readonly syncPanel = viewChild(BnetSyncPanelComponent);
  readonly activationPanel = viewChild(CharacterActivationPanelComponent);

  linkBnet(region: string): void {
    this.linkingRegion.set(region);
  }

  onSynced(): void {
    this.linkingRegion.set(null);
    this.#snackbar.success('characters.bnet.syncSuccess');
    this.#characterStore.loadCharacters(true).subscribe();
  }

  /** Re-sync requested from the activation panel — reuse the already-linked account's region. */
  onOpenSyncRequested(): void {
    this.linkingRegion.set(this.#characterStore.bnetAccount()?.region ?? null);
  }

  onActivated(result: { activated: number; activatedCharacterIds: number[] }): void {
    if (result.activated === 0) return;
    this.#promptRaidSpecsAfterActivation(result.activatedCharacterIds);
  }

  onActivateError(): void {
    this.#snackbar.error('characters.import.importError');
  }

  /**
   * Right after activation, the user must confirm raid-viable specs for each newly activated
   * character. Cancelling or failing to save rolls the activation back entirely — mirrors
   * CharacterListComponent's behavior so activating from get-started can't leave a character
   * active with no raid specs configured.
   */
  #promptRaidSpecsAfterActivation(characterIds: number[]): void {
    this.#characterStore.loadCharacters(true).subscribe((characters) => {
      const activated = characters.filter((c) => characterIds.includes(c.id));

      this.#dialog
        .open(SetRaidSpecsDialogComponent, {
          width: '560px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          data: { characters: activated, mode: 'activate' } satisfies SetRaidSpecsDialogData,
        })
        .afterClosed()
        .subscribe((result?: { success?: boolean }) => {
          if (result?.success) {
            this.#snackbar.success('characters.import.importSuccess');
          } else {
            this.#snackbar.error('characters.raidSpecs.importRolledBack');
            characterIds.forEach((id) => this.#characterStore.deactivateCharacter(id).subscribe());
          }
        });
    });
  }
}
