import { Component, inject, signal, viewChild } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { BnetLinkButtonComponent } from '../../../../shared/components/buttons/bnet-link-button/bnet-link-button.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { BnetIconComponent } from '../../../../shared/components/icons/bnet-icon/bnet-icon.component';
import { BnetSyncPanelComponent, BnetSyncResult } from '../../../characters/components/bnet-sync-panel/bnet-sync-panel.component';
import { BnetLinkedAccountsComponent } from '../../../characters/components/bnet-linked-accounts/bnet-linked-accounts.component';
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
    TranslocoPipe,
    ButtonComponent,
    BnetLinkButtonComponent,
    BnetIconComponent,
    BnetSyncPanelComponent,
    BnetLinkedAccountsComponent,
    CharacterActivationPanelComponent,
  ],
  templateUrl: './get-started-bnet-step.component.html',
  styleUrl: './get-started-bnet-step.component.scss',
})
export class GetStartedBnetStepComponent {
  readonly #characterStore = inject(CharacterStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);

  readonly isBnetLoading = this.#characterStore.isBnetLoading;
  readonly isBnetLinked = this.#characterStore.isBnetLinked;
  readonly isCharactersLoading = this.#characterStore.isCharactersLoading;

  /** Region picked to (re)link BNet — non-null while the sync panel should be shown. */
  readonly linkingRegion = signal<string | null>(null);

  /** True only when the panel was opened via "Ajouter un autre compte" — see BnetSyncPanelComponent.startInAddAnotherMode. */
  readonly isAddingAnotherAccount = signal(false);

  readonly syncPanel = viewChild(BnetSyncPanelComponent);
  readonly activationPanel = viewChild(CharacterActivationPanelComponent);

  /** First-time link, from the "Lier Battle.net" CTA — never an add-another attempt. */
  linkBnet(region: string): void {
    this.isAddingAnotherAccount.set(false);
    this.linkingRegion.set(region);
  }

  /** "Ajouter un autre compte" from the linked-accounts panel — routes through the account-switch guide. */
  addAnotherAccount(region: string): void {
    this.isAddingAnotherAccount.set(true);
    this.linkingRegion.set(region);
  }

  onSynced({ outcome }: BnetSyncResult): void {
    if (outcome === 'accountAlreadyLinked') {
      this.#snackbar.error('characters.bnet.accounts.accountAlreadyLinked');
      this.syncPanel()?.reset();
      return;
    }

    this.linkingRegion.set(null);
    this.isAddingAnotherAccount.set(false);
    this.#snackbar.success('characters.bnet.syncSuccess');
  }

  /** Re-sync requested from the activation panel — reuse the first already-linked account's region. */
  onOpenSyncRequested(): void {
    this.isAddingAnotherAccount.set(false);
    this.linkingRegion.set(this.#characterStore.bnetAccounts()?.[0]?.region ?? null);
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
        .open<{ success?: boolean; error?: boolean } | undefined>(SetRaidSpecsDialogComponent, {
          width: '560px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          data: { characters: activated, mode: 'activate' } satisfies SetRaidSpecsDialogData,
        })
        .closed.subscribe((result) => {
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
