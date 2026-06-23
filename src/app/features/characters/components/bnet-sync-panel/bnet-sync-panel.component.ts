import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterService } from '../../services/character.service';
import { Branch } from '../../../../shared/models/branch.model';
import { environment } from '../../../../../environments/environment';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';

export type BnetSyncStep = 'branches' | 'authenticating' | 'syncing' | 'error';

/**
 * Branch picker + BNet OAuth popup + sync flow. Presentational — no dialog dependency, so it can
 * be reused both inside {@link ../sync-bnet-dialog/sync-bnet-dialog.component!SyncBnetDialogComponent}
 * and inline in the get-started stepper.
 */
@Component({
  selector: 'app-bnet-sync-panel',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, TranslocoPipe],
  templateUrl: './bnet-sync-panel.component.html',
  styleUrl: './bnet-sync-panel.component.scss',
})
export class BnetSyncPanelComponent implements OnInit, OnDestroy {
  readonly region = input.required<string>();

  /** Emitted once the selected branch's characters have finished syncing. */
  readonly synced = output<void>();

  readonly #wowBranchesService = inject(WowBrancheService);
  readonly #service = inject(CharacterService);
  readonly #api = environment.apiUrl;

  readonly step = signal<BnetSyncStep>('branches');
  readonly branches = signal<Branch[]>([]);
  readonly isLoadingBranches = signal(true);

  #selectedBranchId: number | null = null;
  #popup: Window | null = null;
  #messageHandler: ((e: MessageEvent) => void) | null = null;
  #popupPollTimer: ReturnType<typeof setInterval> | null = null;

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
    this.#openPopup(url);
  }

  retry(): void {
    this.step.set('branches');
    this.#selectedBranchId = null;
  }

  #openPopup(url: string): void {
    this.#cleanup();

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
            this.#cleanup();
            this.step.set('error');
          }
        }, 200);
      }
    }, 500);
  }

  #syncCharacters(): void {
    if (this.#selectedBranchId === null) return;
    this.step.set('syncing');

    this.#service.syncCharacters(this.#selectedBranchId).subscribe({
      next: () => this.synced.emit(),
      error: () => this.step.set('error'),
    });
  }

  #cleanup(): void {
    if (this.#messageHandler) {
      globalThis.removeEventListener('message', this.#messageHandler);
      this.#messageHandler = null;
    }
    if (this.#popupPollTimer !== null) {
      clearInterval(this.#popupPollTimer);
      this.#popupPollTimer = null;
    }
    if (this.#popup && !this.#popup.closed) {
      this.#popup.close();
      this.#popup = null;
    }
  }
}
