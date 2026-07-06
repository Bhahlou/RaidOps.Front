import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { ListContentComponent } from '../../components/list-content/list-content.component';
import { ImportDialogComponent } from '../../components/import-dialog/import-dialog.component';
import { ConfirmDeactivateDialogComponent } from '../../components/confirm-deactivate-dialog/confirm-deactivate-dialog.component';
import {
  SetRaidSpecsDialogComponent,
  SetRaidSpecsDialogData,
} from '../../components/set-raid-specs-dialog/set-raid-specs-dialog.component';
import {
  SyncBnetDialogComponent,
  SyncBnetDialogData,
} from '../../components/sync-bnet-dialog/sync-bnet-dialog.component';
import { Character } from '../../models/character.model';

/** Shell page for the characters list. Handles routing concerns and delegates UI to sub-components. */
@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [ListHeaderComponent, ListContentComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class CharacterListComponent implements OnInit {
  readonly #store = inject(CharacterStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #route = inject(ActivatedRoute);
  readonly #dialog = inject(MatDialog);

  readonly isBnetLoading = this.#store.isBnetLoading;
  readonly isBnetLinked = this.#store.isBnetLinked;
  readonly bnetAccount = this.#store.bnetAccount;
  readonly isCharactersLoading = this.#store.isCharactersLoading;
  readonly characters = this.#store.characterList;

  ngOnInit(): void {
    this.#handleOAuthCallback();
  }

  /**
   * Triggered by the "Lier BNet" region picker in the header/content.
   * Opens the sync dialog with the selected region for first-time account linking.
   */
  linkBnet(region: string): void {
    this.#openSyncDialog(region);
  }

  /** Opens the sync dialog using the region from the already-linked BNet account. */
  openSyncDialog(): void {
    const region = this.bnetAccount()?.region;
    if (!region) return;
    this.#openSyncDialog(region);
  }

  deactivateCharacter(id: number): void {
    const dialogRef = this.#dialog.open(ConfirmDeactivateDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.#store.deactivateCharacter(id).subscribe({
        error: () => this.#snackbar.error('characters.card.deactivateError'),
      });
    });
  }

  resyncCharacter(id: number): void {
    this.#store.resyncCharacter(id).subscribe({
      next: () => this.#snackbar.success('characters.card.resyncSuccess'),
      error: () => this.#snackbar.error('characters.card.resyncError'),
    });
  }

  /** Opens the raid-viable-specs dialog for a single already-activated character. Editing only — no rollback on cancel. */
  editRaidSpecs(characterId: number): void {
    const character = this.characters().find((c) => c.id === characterId);
    if (!character) return;

    this.#openRaidSpecsDialog([character], 'edit')
      .afterClosed()
      .subscribe((result?: { success?: boolean; error?: boolean }) => {
        if (result?.success) {
          this.#snackbar.success('characters.raidSpecs.submitSuccess');
        } else if (result?.error) {
          this.#snackbar.error('characters.raidSpecs.submitError');
        }
      });
  }

  /** Opens the character activation dialog (select synced chars to use in RaidOps). */
  openImportDialog(): void {
    const dialogRef = this.#dialog.open(ImportDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (result?: {
          activated: number;
          error?: boolean;
          openSync?: boolean;
          activatedCharacterIds?: number[];
        }) => {
          if (!result) return;
          if (result.openSync) {
            this.openSyncDialog();
            return;
          }
          if (result.error) {
            this.#snackbar.error('characters.import.importError');
          } else if (result.activated > 0 && result.activatedCharacterIds?.length) {
            this.#promptRaidSpecsAfterActivation(result.activatedCharacterIds);
          }
        },
      );
  }

  /**
   * Right after activation, the user must confirm raid-viable specs for each newly activated
   * character. Cancelling or failing to save rolls the activation back entirely — an activated
   * character with no raid specs configured is not a valid end state.
   */
  #promptRaidSpecsAfterActivation(characterIds: number[]): void {
    this.#store.loadCharacters(true).subscribe((characters) => {
      const activated = characters.filter((c) => characterIds.includes(c.id));

      this.#openRaidSpecsDialog(activated, 'activate')
        .afterClosed()
        .subscribe((result?: { success?: boolean }) => {
          if (result?.success) {
            this.#snackbar.success('characters.import.importSuccess');
          } else {
            this.#snackbar.error('characters.raidSpecs.importRolledBack');
            characterIds.forEach((id) => this.#store.deactivateCharacter(id).subscribe());
          }
        });
    });
  }

  #openRaidSpecsDialog(
    characters: Character[],
    mode: SetRaidSpecsDialogData['mode'],
  ): MatDialogRef<SetRaidSpecsDialogComponent> {
    return this.#dialog.open(SetRaidSpecsDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      data: { characters, mode } satisfies SetRaidSpecsDialogData,
    });
  }

  #openSyncDialog(region: string): void {
    const dialogRef = this.#dialog.open(SyncBnetDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { region } satisfies SyncBnetDialogData,
    });

    dialogRef.afterClosed().subscribe((result?: { synced: boolean }) => {
      if (!result?.synced) return;
      this.#snackbar.success('characters.bnet.syncSuccess');
      this.#store.loadCharacters(true).subscribe();
    });
  }

  /** Handles error query params set by the BNet OAuth callback in edge cases. */
  #handleOAuthCallback(): void {
    const error = this.#route.snapshot.queryParamMap.get('error');
    if (error) {
      setTimeout(() => this.#snackbar.error(this.#bnetErrorKey(error)), 200);
    }
  }

  #bnetErrorKey(error: string): string {
    switch (error) {
      case 'InvalidState':
      case 'StateMismatch':
      case 'Unauthorized':
        return 'characters.bnet.linkErrorSession';
      case 'BnetApiError':
        return 'characters.bnet.linkErrorBnet';
      default:
        return 'characters.bnet.linkError';
    }
  }
}
