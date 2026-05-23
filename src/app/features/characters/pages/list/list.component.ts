import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LoadingStore } from '../../../../core/stores/loading.store';
import { environment } from '../../../../../environments/environment';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { ListContentComponent } from '../../components/list-content/list-content.component';
import { ImportDialogComponent } from '../../components/import-dialog/import-dialog.component';

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
  readonly #loadingStore = inject(LoadingStore);
  readonly #route = inject(ActivatedRoute);
  readonly #dialog = inject(MatDialog);
  readonly #api = environment.apiUrl;

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
   * Navigates the browser to the BNet OAuth initiation endpoint for the given region.
   * Manually increments the loading store because this is a browser-level redirect,
   * not an HttpClient call — the loading interceptor won't see it.
   * No matching decrement needed: the page reloads entirely after the OAuth flow.
   */
  linkBnet(region: string): void {
    this.#loadingStore.increment();
    window.location.href = `${this.#api}/api/v1/bnet/link/initiate?region=${region}`;
  }

  /** Opens the two-step character import dialog. */
  openImportDialog(): void {
    const dialogRef = this.#dialog.open(ImportDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });

    dialogRef.afterClosed().subscribe((result?: { imported: number; error?: boolean }) => {
      if (!result) return;
      if (result.error) {
        this.#snackbar.error('characters.import.importError');
      } else if (result.imported > 0) {
        this.#snackbar.success('characters.import.importSuccess');
        this.#store.loadCharacters().subscribe();
      }
    });
  }

  /** Handles query params set by the BNet OAuth callback redirect. */
  #handleOAuthCallback(): void {
    const params = this.#route.snapshot.queryParamMap;

    if (params.get('bnet_linked') === 'true') {
      setTimeout(() => this.#snackbar.success('characters.bnet.linkedSuccess'), 400);
      return;
    }

    const error = params.get('error');
    if (error) {
      setTimeout(() => this.#snackbar.error(this.#bnetErrorKey(error)), 200);
    }
  }

  /** Maps a BNet OAuth error code to its i18n key. */
  #bnetErrorKey(error: string): string {
    switch (error) {
      case 'invalid_state':
      case 'state_mismatch':
        return 'characters.bnet.linkErrorSession';
      case 'bnet_api_error':
        return 'characters.bnet.linkErrorBnet';
      default:
        return 'characters.bnet.linkError';
    }
  }
}
