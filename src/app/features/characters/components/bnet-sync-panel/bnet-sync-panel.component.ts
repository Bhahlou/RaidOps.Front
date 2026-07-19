import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterService } from '../../services/character.service';
import { CharacterStore } from '../../stores/character.store';
import { Branch } from '../../../../shared/models/branch.model';
import { environment } from '../../../../../environments/environment';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { DialogStateComponent } from '../../../../shared/components/feedback/dialog-state/dialog-state.component';

export type BnetSyncStep = 'branches' | 'authenticating' | 'syncing' | 'error';

/**
 * `success` — everything else: plain resync (single or multi-account, including one that happens
 *   to link a not-yet-known account along the way — accepted as a normal outcome, not flagged),
 *   first link, or "Ajouter un autre compte" that actually found a new account.
 * `accountAlreadyLinked` — "Ajouter un autre compte" was picked, but no new account appeared:
 *   the user logged back into one they already have linked. Only meaningful for that explicit
 *   intent — there's no equivalent check for a plain resync, since ending up on any already-known
 *   (or even not-yet-known) account there is a fine outcome either way.
 */
export type BnetSyncOutcome = 'success' | 'accountAlreadyLinked';

export interface BnetSyncResult {
  outcome: BnetSyncOutcome;
}

/**
 * Branch picker + BNet OAuth popup + sync flow. Presentational — no dialog dependency, so it can
 * be reused both inside {@link ../sync-bnet-dialog/sync-bnet-dialog.component!SyncBnetDialogComponent}
 * and inline in the get-started stepper.
 */
@Component({
  selector: 'app-bnet-sync-panel',
  standalone: true,
  imports: [TranslocoPipe, DialogStateComponent],
  templateUrl: './bnet-sync-panel.component.html',
  styleUrl: './bnet-sync-panel.component.scss',
})
export class BnetSyncPanelComponent implements OnInit, OnDestroy {
  readonly region = input.required<string>();

  /**
   * Set by the parent right after "Ajouter un autre compte" is picked — the intent is explicitly
   * to link a *different* account, so the next branch click both silently logs out first and
   * checks afterward whether a genuinely new account appeared (see `#syncCharacters`).
   */
  readonly startInAddAnotherMode = input(false);

  /** Emitted once the selected branch's characters have finished syncing. */
  readonly synced = output<BnetSyncResult>();

  readonly #wowBranchesService = inject(WowBrancheService);
  readonly #service = inject(CharacterService);
  readonly #store = inject(CharacterStore);
  readonly #api = environment.apiUrl;

  readonly step = signal<BnetSyncStep>('branches');
  readonly branches = signal<Branch[]>([]);
  readonly isLoadingBranches = signal(true);

  #selectedBranchId: number | null = null;
  #popup: Window | null = null;
  #messageHandler: ((e: MessageEvent) => void) | null = null;
  #popupPollTimer: ReturnType<typeof setInterval> | null = null;
  #logoutTimer: ReturnType<typeof setTimeout> | null = null;

  // Set only for an explicit "Ajouter un autre compte" attempt — lets #syncCharacters() detect
  // whether a genuinely new BNet account appeared afterward (see BnetSyncOutcome).
  #knownBnetIdsBeforeAdd: Set<string> | null = null;

  ngOnInit(): void {
    this.#wowBranchesService.getAll().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.isLoadingBranches.set(false);
      },
      error: () => {
        this.step.set('error');
        this.isLoadingBranches.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.#cleanup();
  }

  selectBranch(branch: Branch): void {
    this.#selectedBranchId = branch.id;
    this.step.set('authenticating');

    const url = `${this.#api}/bnet/link/initiate?region=${this.region()}`;
    const isAddingAnother = this.startInAddAnotherMode();
    const hasMultipleAccounts = (this.#store.bnetAccounts() ?? []).length > 1;

    // Two independent reasons to silently log out first:
    //  - explicitly adding another account (intent is a *different* account — must not silently
    //    reuse the active session);
    //  - a plain resync with 2+ accounts already linked — a single OAuth pass only refreshes
    //    whichever account's session happens to be active, silently leaving the other account(s)'
    //    stored tokens un-refreshed (BNet access tokens expire after 24h with no refresh token —
    //    see project_bnet_oauth_strategy). Forcing a fresh login makes that deterministic instead
    //    of depending on ambient browser session state.
    // A single linked account has no such ambiguity — reuse the active session, exactly as before.
    if (isAddingAnother || hasMultipleAccounts) {
      // Only track "did a genuinely new account appear" for an explicit add-another attempt —
      // for a plain multi-account resync, whichever account the login turns out to be for is an
      // accepted outcome (see BnetSyncOutcome), not worth id-diffing at all.
      this.#knownBnetIdsBeforeAdd = isAddingAnother
        ? new Set((this.#store.bnetAccounts() ?? []).map((a) => a.bnetId))
        : null;

      this.#openPopup('https://account.battle.net/logout?logout');
      // Same popup (window.open reuses an existing window opened under this name — no fresh user
      // gesture required, so no popup-blocker risk), navigated to the real OAuth link once the
      // logout has had time to complete server-side. No cross-origin way to detect that directly,
      // hence the fixed delay instead of chaining immediately.
      this.#logoutTimer = setTimeout(() => this.#openPopup(url), 1000);
      return;
    }

    this.#knownBnetIdsBeforeAdd = null;
    this.#openPopup(url);
  }

  /** Back to the branch grid — used both for "Réessayer" after an error and to sync another branch after a success. */
  reset(): void {
    this.step.set('branches');
    this.#selectedBranchId = null;
  }

  #openPopup(url: string): void {
    // Only detach the previous listeners/timer here — don't close the popup. When the scheduled
    // logout→auth navigation fires, this is the *same* popup (window.open reuses an existing
    // window opened under the same name, just navigating it) and closing it first would open a
    // brand-new one — which, unlike navigating in place, needs a fresh user gesture and risks
    // being popup-blocked.
    this.#detachListeners();

    const handler = (event: MessageEvent) => {
      if (event.origin !== globalThis.location.origin || event.data?.type !== 'bnet_oauth') return;
      this.#cleanup();

      if (event.data.error) {
        this.step.set('error');
        return;
      }

      this.#syncCharacters();
    };

    this.#messageHandler = handler;
    globalThis.addEventListener('message', handler);

    this.#popup = globalThis.open(
      url,
      'bnet_oauth',
      'width=520,height=680,menubar=no,toolbar=no,location=yes',
    );

    this.#popupPollTimer = setInterval(() => {
      if (this.#popup?.closed) {
        clearInterval(this.#popupPollTimer!);
        this.#popupPollTimer = null;
        // Defer to let any pending postMessage be processed first
        setTimeout(() => {
          if (this.step() === 'authenticating') {
            this.#detachListeners();
            this.step.set('error');
          }
        }, 200);
      }
    }, 500);
  }

  #syncCharacters(): void {
    if (this.#selectedBranchId === null) return;
    this.step.set('syncing');

    // Chain the store reload here (rather than leaving it to the caller) so bnetAccounts() is
    // guaranteed fresh by the time `synced` fires — required for the before/after id comparison.
    this.#service.syncCharacters(this.#selectedBranchId).pipe(
      switchMap(() => this.#store.loadCharacters(true)),
    ).subscribe({
      next: () => this.synced.emit({ outcome: this.#resolveOutcome() }),
      error: () => this.step.set('error'),
    });
  }

  #resolveOutcome(): BnetSyncOutcome {
    if (this.#knownBnetIdsBeforeAdd === null) return 'success';

    const newAccountAppeared = (this.#store.bnetAccounts() ?? [])
      .some((a) => !this.#knownBnetIdsBeforeAdd!.has(a.bnetId));

    return newAccountAppeared ? 'success' : 'accountAlreadyLinked';
  }

  #detachListeners(): void {
    if (this.#messageHandler) {
      globalThis.removeEventListener('message', this.#messageHandler);
      this.#messageHandler = null;
    }
    if (this.#popupPollTimer !== null) {
      clearInterval(this.#popupPollTimer);
      this.#popupPollTimer = null;
    }
    // Guards against the scheduled logout→auth navigation firing after the flow already errored
    // out or was torn down (e.g. the user closed the popup during the brief logout window).
    if (this.#logoutTimer !== null) {
      clearTimeout(this.#logoutTimer);
      this.#logoutTimer = null;
    }
  }

  #cleanup(): void {
    this.#detachListeners();
    if (this.#popup && !this.#popup.closed) {
      this.#popup.close();
      this.#popup = null;
    }
  }
}
