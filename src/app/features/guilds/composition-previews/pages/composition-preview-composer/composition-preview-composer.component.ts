import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/layout/page-header/page-header.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { injectGuildContext, injectGuildBranchContext } from '../../../inject-guild-context';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { WowBrancheService } from '../../../../../shared/services/wow-branche.service';
import { Branch } from '../../../../../shared/models/branch.model';
import { expansionIdFromShortCode } from '../../../../../shared/utils/expansion-id.util';
import { RaidCompositionPreviewsStore } from '../../stores/raid-composition-previews.store';
import { countPreviewRoles } from '../../utils/composition-role.util';
import { RAID_ROLE_ICON, RAID_ROLE_ORDER } from '../../../raids/utils/raid-role.util';
import { CompositionPreviewGridComponent } from '../../components/composition-preview-grid/composition-preview-grid.component';
import { ClassSpecPaletteComponent } from '../../components/class-spec-palette/class-spec-palette.component';
import { RenamePreviewDialogComponent, RenamePreviewDialogData } from '../../components/rename-preview-dialog/rename-preview-dialog.component';

/** Composer page for a single raid composition preview — its group/slot grid, reached from the previews list. */
@Component({
  selector: 'app-composition-preview-composer',
  imports: [
    PageHeaderComponent,
    IconButtonComponent,
    FormFieldCardComponent,
    CdkDropListGroup,
    CompositionPreviewGridComponent,
    ClassSpecPaletteComponent,
    TranslocoPipe,
  ],
  templateUrl: './composition-preview-composer.component.html',
  styleUrl: './composition-preview-composer.component.scss',
})
export class CompositionPreviewComposerComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #route = inject(ActivatedRoute);
  readonly #store = inject(RaidCompositionPreviewsStore);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #wowBrancheService = inject(WowBrancheService);
  readonly #dialog = inject(Dialog);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly previewId = Number(this.#route.snapshot.paramMap.get('previewId'));

  readonly preview = this.#store.preview;
  readonly isLoading = this.#store.isLoading;
  readonly roleOrder = RAID_ROLE_ORDER;
  readonly roleIcon = RAID_ROLE_ICON;

  readonly roleCounts = computed(() => countPreviewRoles(this.preview()?.slots ?? []));

  readonly #wowBranches = signal<Branch[]>([]);

  /** Filters the composer's class picker to what's actually playable on this branch's current expansion. `null` while still resolving. */
  readonly expansionId = computed<number | null>(() => {
    const guildBranch = this.#branchesStore.branches().find((b) => b.id === this.guildBranchId());
    const shortCode = this.#wowBranches().find((wb) => wb.id === guildBranch?.branchId)?.currentExpansionShortCode;
    return expansionIdFromShortCode(shortCode);
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const [guildCrumb] = this.#guildContext.breadcrumbs('sidenav.guild.compositionPreviews');
    const listCrumb: BreadcrumbItem = {
      i18nKey: 'sidenav.guild.compositionPreviews',
      link: ['/guilds', this.guildId(), String(this.guildBranchId()), 'composition-previews'],
    };
    const previewName = this.preview()?.name;
    const leafCrumb: BreadcrumbItem = previewName ? { label: previewName } : { i18nKey: 'compositionPreviews.composer.breadcrumb' };
    return [guildCrumb, listCrumb, leafCrumb];
  });

  constructor() {
    this.#store.loadPreview(this.guildId(), this.guildBranchId(), this.previewId);
    this.#branchesStore.load(this.guildId());
    this.#wowBrancheService.getAll().subscribe((branches) => this.#wowBranches.set(branches));
  }

  renamePreview(): void {
    const preview = this.preview();
    if (!preview) return;

    this.#dialog
      .open<boolean>(RenamePreviewDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          guildId: this.guildId(),
          guildBranchId: this.guildBranchId(),
          previewId: preview.id,
          mode: 'rename',
          initialName: preview.name,
        } satisfies RenamePreviewDialogData,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }
}
