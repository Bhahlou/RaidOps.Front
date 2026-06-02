import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { CharacterService } from '../../services/character.service';
import { Branch } from '../../../../shared/models/branch.model';
import { environment } from '../../../../../environments/environment';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';

export interface SyncBnetDialogData {
  region: string;
}

type SyncStep = 'branches' | 'authenticating' | 'syncing' | 'error';

/** Dialog for selecting a WoW branch, re-authenticating with BNet, and syncing characters. */
@Component({
  selector: 'app-sync-bnet-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
  ],
  templateUrl: './sync-bnet-dialog.component.html',
  styleUrl: './sync-bnet-dialog.component.scss',
})
export class SyncBnetDialogComponent implements OnInit, OnDestroy {
  readonly #wowBranchesService = inject(WowBrancheService);
  readonly #service = inject(CharacterService);
  readonly #dialogRef = inject(MatDialogRef<SyncBnetDialogComponent>);
  readonly #data = inject<SyncBnetDialogData>(MAT_DIALOG_DATA);
  readonly #api = environment.apiUrl;

  readonly step = signal<SyncStep>('branches');
  readonly branches = signal<Branch[]>([]);
  readonly isLoadingBranches = signal(true);

  #selectedBranchId: number | null = null;
  #iframe: HTMLIFrameElement | null = null;
  #messageHandler: ((e: MessageEvent) => void) | null = null;
  #fallbackTimer: ReturnType<typeof setTimeout> | null = null;

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

    const url = `${this.#api}/bnet/link/initiate?region=${this.#data.region}`;
    this.#openIframe(url);
  }

  retry(): void {
    this.step.set('branches');
    this.#selectedBranchId = null;
  }

  #openIframe(url: string): void {
    this.#cleanup();

    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;border:0;';
    document.body.appendChild(iframe);
    this.#iframe = iframe;

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'bnet_oauth') return;
      this.#cleanup();

      if (event.data.error) {
        this.step.set('error');
        return;
      }

      this.#syncCharacters();
    };

    this.#messageHandler = handler;
    window.addEventListener('message', handler);

    this.#fallbackTimer = setTimeout(() => {
      this.#cleanup();
      this.step.set('error');
    }, 15000);

    iframe.src = url;
  }

  #syncCharacters(): void {
    if (this.#selectedBranchId === null) return;
    this.step.set('syncing');

    this.#service.syncCharacters(this.#selectedBranchId).subscribe({
      next: () => this.#dialogRef.close({ synced: true }),
      error: () => this.step.set('error'),
    });
  }

  #cleanup(): void {
    if (this.#messageHandler) {
      window.removeEventListener('message', this.#messageHandler);
      this.#messageHandler = null;
    }
    if (this.#iframe && document.body.contains(this.#iframe)) {
      document.body.removeChild(this.#iframe);
      this.#iframe = null;
    }
    if (this.#fallbackTimer !== null) {
      clearTimeout(this.#fallbackTimer);
      this.#fallbackTimer = null;
    }
  }
}
