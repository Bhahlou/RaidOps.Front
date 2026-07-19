import { Component, inject, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterStore } from '../../stores/character.store';
import { BnetIconComponent } from '../../../../shared/components/icons/bnet-icon/bnet-icon.component';
import {
  BnetLinkButtonComponent,
  BnetRegion,
} from '../../../../shared/components/buttons/bnet-link-button/bnet-link-button.component';
import { REGION_FLAGS } from '../../../../shared/constants/bnet-regions';
import { BnetAccount } from '../../models/bnet-account.model';

/**
 * Lists the user's linked Battle.net accounts with per-account unlink, a manual refresh, and the
 * "add another account" entry point. Reads/writes {@link CharacterStore} directly rather than
 * taking inputs, so it drops into both {@link ../sync-bnet-dialog/sync-bnet-dialog.component!SyncBnetDialogComponent}
 * and the get-started BNet step without extra plumbing.
 */
@Component({
  selector: 'app-bnet-linked-accounts',
  standalone: true,
  imports: [TranslocoPipe, BnetIconComponent, BnetLinkButtonComponent],
  templateUrl: './bnet-linked-accounts.component.html',
  styleUrl: './bnet-linked-accounts.component.scss',
})
export class BnetLinkedAccountsComponent {
  readonly #store = inject(CharacterStore);

  /** Emits the region picked to link an additional account — parent opens the OAuth flow. */
  readonly addAnother = output<BnetRegion>();

  readonly accounts = this.#store.bnetAccounts;
  readonly regionFlags = REGION_FLAGS;
  readonly unlinkingBnetId = signal<string | null>(null);
  readonly isRefreshing = signal(false);

  refresh(): void {
    this.isRefreshing.set(true);
    this.#store.loadCharacters(true).subscribe({
      next: () => this.isRefreshing.set(false),
      error: () => this.isRefreshing.set(false),
    });
  }

  unlink(account: BnetAccount): void {
    this.unlinkingBnetId.set(account.bnetId);
    this.#store.confirmAndUnlinkBnetAccount(account).subscribe(() => this.unlinkingBnetId.set(null));
  }
}
