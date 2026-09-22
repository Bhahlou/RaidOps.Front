import { Component, computed, effect, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { injectGuildContext, injectGuildBranchContext } from '../../../inject-guild-context';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { RaidCompositionPreviewSummary } from '../../models/raid-composition-preview.model';
import { CreatePreviewDialogComponent, CreatePreviewDialogData } from '../../components/create-preview-dialog/create-preview-dialog.component';
import { RenamePreviewDialogComponent, RenamePreviewDialogData } from '../../components/rename-preview-dialog/rename-preview-dialog.component';

/** List of a guild branch's raid composition previews — create/rename/duplicate/delete, click a row to open its composer. */
@Component({
  selector: 'app-composition-previews-list',
  imports: [RouterLink, TranslocoPipe, PageHeaderComponent, ButtonComponent, IconButtonComponent, FormFieldCardComponent],
  templateUrl: './composition-previews-list.component.html',
  styleUrl: './composition-previews-list.component.scss',
})
export class CompositionPreviewsListComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;

  readonly #store = inject(RaidCompositionPreviewsStore);
  readonly #dialog = inject(Dialog);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly previews = this.#store.previews;
  readonly isLoading = this.#store.isLoading;
  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.compositionPreviews'));

  constructor() {
    effect(() => this.#store.loadList(this.guildId(), this.guildBranchId()));
  }

  openCreateDialog(): void {
    this.#dialog
      .open<boolean>(CreatePreviewDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId() } satisfies CreatePreviewDialogData,
      })
      .closed.subscribe((created) => {
        if (created) this.#store.reload();
      });
  }

  renamePreview(preview: RaidCompositionPreviewSummary): void {
    this.#openRenameOrDuplicate(preview, 'rename', preview.name);
  }

  duplicatePreview(preview: RaidCompositionPreviewSummary): void {
    const copyName = this.#transloco.translate('compositionPreviews.list.duplicateName', { name: preview.name });
    this.#openRenameOrDuplicate(preview, 'duplicate', copyName);
  }

  #openRenameOrDuplicate(preview: RaidCompositionPreviewSummary, mode: 'rename' | 'duplicate', initialName: string): void {
    this.#dialog
      .open<boolean>(RenamePreviewDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), previewId: preview.id, mode, initialName } satisfies RenamePreviewDialogData,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  deletePreview(preview: RaidCompositionPreviewSummary): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'compositionPreviews.list.deleteConfirmTitle',
          message: 'compositionPreviews.list.deleteConfirmMessage',
          messageParams: { name: preview.name },
          confirmLabel: 'compositionPreviews.list.delete',
          danger: true,
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.#store.deletePreview(this.guildId(), this.guildBranchId(), preview.id).subscribe({
          next: () => {
            this.#snackbar.success('compositionPreviews.list.deleteSuccess');
            this.#store.reload();
          },
          error: () => this.#snackbar.error('errors.server'),
        });
      });
  }
}
