import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { ListContentComponent } from '../../components/list-content/list-content.component';
import { ImportDialogComponent } from '../../components/import-dialog/import-dialog.component';
import {
  SyncBnetDialogComponent,
  SyncBnetDialogData,
} from '../../components/sync-bnet-dialog/sync-bnet-dialog.component';

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
    this.#store.loadBnetAccount().subscribe((account) => {
      if (account) this.#store.loadCharacters().subscribe();
    });
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

  /** Opens the character activation dialog (select synced chars to use in RaidOps). */
  openImportDialog(): void {
    const dialogRef = this.#dialog.open(ImportDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });

    dialogRef
      .afterClosed()
      .subscribe((result?: { activated: number; error?: boolean; openSync?: boolean }) => {
        if (!result) return;
        if (result.openSync) {
          this.openSyncDialog();
          return;
        }
        if (result.error) {
          this.#snackbar.error('characters.import.importError');
        } else if (result.activated > 0) {
          this.#snackbar.success('characters.import.importSuccess');
          this.#store.loadCharacters().subscribe();
        }
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
      this.#store.loadBnetAccount().subscribe((account) => {
        if (account) this.#store.loadCharacters().subscribe();
      });
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
