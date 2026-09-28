import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AdminStore } from '../../../../core/stores/admin.store';
import { RaidBuffsStore } from '../../../../core/stores/raid-buffs.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CharacterStore } from '../../../characters/stores/character.store';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { wowClassIconUrl } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { SpellIconComponent } from '../../../../shared/components/icons/spell-icon/spell-icon.component';
import { BreadcrumbItem, PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import {
  RaidBuffDefinition,
  RaidBuffExportFile,
  RaidBuffSource,
  RaidBuffUpsertSummary,
} from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind, RAID_BUFF_KIND_ORDER } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope, RAID_BUFF_SCOPE_ORDER } from '../../../../shared/models/raid-buff-scope.enum';
import { Spec } from '../../../../shared/models/spec.model';
import { expansionIconUrl } from '../../../../shared/utils/expansion-icon.util';
import { allExpansions } from '../../../../shared/utils/expansion-id.util';
import { raidBuffLabel, raidBuffSpellName } from '../../../../shared/utils/raid-buff.util';
import {
  RaidBuffDefinitionDialogComponent,
  RaidBuffDefinitionDialogData,
} from '../../components/raid-buff-definition-dialog/raid-buff-definition-dialog.component';
import {
  RaidBuffImportDialogComponent,
  RaidBuffImportResult,
} from '../../components/raid-buff-import-dialog/raid-buff-import-dialog.component';

/** Expansion pre-selected on opening — the only one whose list is maintained for now. */
const DEFAULT_EXPANSION_ID = 12;

/** Gap left between two definitions' sort orders, so one can be slotted between them later without renumbering. */
const SORT_ORDER_STEP = 10;

interface DefinitionSection {
  key: string;
  scope: RaidBuffScope;
  kind: RaidBuffKind;
  definitions: RaidBuffDefinition[];
}

/** A source shown as an icon: its spec's icon, or its class's when any spec provides the effect. */
interface SourceIcon {
  url: string | null;
  label: string;
}

/** Owner-only screen maintaining the curated raid buff/debuff list of an expansion, with JSON export/import to align environments. */
@Component({
  selector: 'app-raid-buffs-admin',
  imports: [TranslocoPipe, PageHeaderComponent, ButtonComponent, IconButtonComponent, EmptyHintComponent, SelectComponent, SpellIconComponent],
  templateUrl: './raid-buffs-admin.component.html',
  styleUrl: './raid-buffs-admin.component.scss',
})
export class RaidBuffsAdminComponent {
  readonly #store = inject(RaidBuffsStore);
  readonly #adminStore = inject(AdminStore);
  readonly #characterStore = inject(CharacterStore);
  readonly #dialog = inject(Dialog);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly breadcrumb: BreadcrumbItem[] = [{ i18nKey: 'admin.raidBuffs.title' }];

  readonly expansionId = signal(DEFAULT_EXPANSION_ID);
  readonly lastSummary = signal<RaidBuffUpsertSummary | null>(null);
  readonly #specsById = signal<Map<number, Spec>>(new Map());

  readonly isLoading = this.#store.isLoading;

  readonly expansionOptions: SelectOption<number>[] = allExpansions().map((e) => ({
    value: e.id,
    label: e.shortCode,
    iconUrl: expansionIconUrl(e.shortCode),
  }));

  /** Definitions folded into (scope, kind) sections in a fixed order; empty sections are dropped. */
  readonly sections = computed<DefinitionSection[]>(() => {
    const definitions = this.#store.definitions();

    return RAID_BUFF_KIND_ORDER.flatMap((kind) =>
      RAID_BUFF_SCOPE_ORDER.map((scope) => ({
        key: `${scope}${kind}`,
        scope,
        kind,
        definitions: definitions.filter((d) => d.scope === scope && d.kind === kind),
      })),
    ).filter((section) => section.definitions.length > 0);
  });

  constructor() {
    this.#store.load(this.expansionId());
    this.#characterStore.loadSpecs().subscribe((specs) => this.#specsById.set(new Map(specs.map((s) => [s.id, s]))));
  }

  selectExpansion(expansionId: number | null): void {
    if (expansionId === null || expansionId === this.expansionId()) return;
    this.expansionId.set(expansionId);
    this.lastSummary.set(null);
    this.#store.load(expansionId);
  }

  spellName(definition: RaidBuffDefinition): string {
    return definition.spell ? raidBuffSpellName(definition.spell, this.#transloco.getActiveLang()) : `#${definition.spellId}`;
  }

  label(definition: RaidBuffDefinition): string {
    return raidBuffLabel(definition, this.#transloco.getActiveLang());
  }

  /** The spec's icon when the source is restricted to one spec (falling back to its class icon), the class icon otherwise. */
  sourceIcon(source: RaidBuffSource): SourceIcon {
    const className = this.#transloco.translate(`classes.${source.classId}`);
    const classIcon = wowClassIconUrl(source.classId);

    if (source.specId === null) return { url: classIcon, label: className };

    const specName = this.#transloco.translate(`specs.${source.specId}`);
    return { url: this.#specsById().get(source.specId)?.iconUrl ?? classIcon, label: `${className} — ${specName}` };
  }

  add(): void {
    const definitions = this.#store.definitions();
    const nextSortOrder = definitions.length > 0 ? Math.max(...definitions.map((d) => d.sortOrder)) + SORT_ORDER_STEP : SORT_ORDER_STEP;
    this.#openDefinitionDialog({ expansionId: this.expansionId(), definition: null, nextSortOrder });
  }

  edit(definition: RaidBuffDefinition): void {
    this.#openDefinitionDialog({ expansionId: this.expansionId(), definition, nextSortOrder: definition.sortOrder });
  }

  remove(definition: RaidBuffDefinition): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'admin.raidBuffs.deleteConfirmTitle',
          message: 'admin.raidBuffs.deleteConfirmMessage',
          messageParams: { name: this.spellName(definition) },
          confirmLabel: 'admin.raidBuffs.delete',
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#adminStore.deleteRaidBuff(definition.id).subscribe({
          next: () => {
            this.#snackbar.success('admin.raidBuffs.deleteSuccess');
            this.#store.reload();
          },
          error: () => this.#snackbar.error('errors.server'),
        });
      });
  }

  /** Copies the expansion's definitions to the clipboard as the JSON the import dialog accepts. */
  async copyExport(): Promise<void> {
    const file: RaidBuffExportFile = {
      expansionId: this.expansionId(),
      definitions: this.#store.definitions().map((d) => ({
        spellId: d.spellId,
        scope: d.scope,
        kind: d.kind,
        labelEn: d.labelEn,
        labelFr: d.labelFr,
        labelDe: d.labelDe,
        exclusiveGroupKey: d.exclusiveGroupKey,
        capacityPoolKey: d.capacityPoolKey,
        sortOrder: d.sortOrder,
        sources: d.sources.map((s) => ({ classId: s.classId, specId: s.specId })),
      })),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(file, null, 2));
      this.#snackbar.success('admin.raidBuffs.exportCopied');
    } catch {
      this.#snackbar.error('admin.raidBuffs.exportFailed');
    }
  }

  openImport(): void {
    this.#dialog
      .open<RaidBuffImportResult | null>(RaidBuffImportDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
      })
      .closed.subscribe((result) => {
        if (!result) return;

        // Follow the file to its expansion; when it's already the shown one, reload to pick up the new rows.
        if (result.expansionId === this.expansionId()) {
          this.#store.reload();
        } else {
          this.selectExpansion(result.expansionId);
        }
        this.lastSummary.set(result.summary);
        this.#snackbar.success('admin.raidBuffs.importSuccess');
      });
  }

  #openDefinitionDialog(data: RaidBuffDefinitionDialogData): void {
    this.#dialog
      .open<boolean>(RaidBuffDefinitionDialogComponent, {
        width: '720px',
        maxWidth: '95vw',
        data,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }
}
