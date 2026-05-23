import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CharacterStore } from '../../stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LoadingStore } from '../../../../core/stores/loading.store';
import { environment } from '../../../../../environments/environment';
import { ListHeaderComponent } from '../../components/list-header/list-header.component';
import { ListContentComponent } from '../../components/list-content/list-content.component';

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
  readonly #api = environment.apiUrl;

  readonly isBnetLoading = this.#store.isBnetLoading;
  readonly isBnetLinked = this.#store.isBnetLinked;
  readonly bnetAccount = this.#store.bnetAccount;

  ngOnInit(): void {
    this.#store.loadBnetAccount().subscribe();
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
