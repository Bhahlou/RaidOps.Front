import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import { AttributionRoleIconComponent } from '../../../../../shared/components/icons/attribution-role-icon/attribution-role-icon.component';
import { AttributionDefinitionsStore } from '../../stores/attribution-definitions.store';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { GuildAttributionDefinition } from '../../../raids/models/guild-attribution-definition.model';
import { RaidBoss } from '../../../raids/models/raid-boss.model';
import { RaidZone } from '../../../raids/models/raid-zone.model';
import { raidBossIconUrl, raidBossNameKey, raidZoneNameKey } from '../../../raids/utils/raid-boss-name.util';
import { raidZoneIconUrl } from '../../../raids/utils/raid-zone-icon.util';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { AttributionCellKind } from '../../../raids/models/attribution-cell-kind.enum';
import {
  AttributionDefinitionDialogComponent,
  AttributionDefinitionDialogData,
} from '../attribution-definition-dialog/attribution-definition-dialog.component';
import { SectionIconDialogComponent, SectionIconDialogData } from '../section-icon-dialog/section-icon-dialog.component';
import { IconSourceState } from '../../../raids/components/icon-source-picker/icon-source-picker.component';

/** Sentinel `raidOptions` value for the "General" scope — every real raid zone has a positive seeded ID. */
const GENERAL_SCOPE = -1;

/** Raid-attribution template editor for one guild branch — one evolving, reorderable list of rows the branch curates as its raid content changes. */
@Component({
  selector: 'app-guild-attribution-settings',
  imports: [
    CdkDropList,
    CdkDrag,
    ButtonComponent,
    IconButtonComponent,
    FormFieldCardComponent,
    SelectComponent,
    SpellIconComponent,
    RaidMarkerIconComponent,
    AttributionRoleIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './guild-attribution-settings.component.html',
  styleUrl: './guild-attribution-settings.component.scss',
})
export class GuildAttributionSettingsComponent {
  readonly guildId = input.required<string>();
  /** The guild branch whose template is edited — every row, spell search and raid zone is scoped to it. */
  readonly guildBranchId = input.required<number>();
  /** The branch's expansion, used to filter the class picker (the spell picker resolves it server-side from the branch). */
  readonly expansionId = input.required<number>();

  readonly IconSource = AttributionIconSource;
  readonly CellKind = AttributionCellKind;

  readonly #store = inject(AttributionDefinitionsStore);
  readonly #definitionsService = inject(AttributionDefinitionsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);
  readonly #transloco = inject(TranslocoService);

  readonly definitions = this.#store.definitions;
  readonly isLoading = this.#store.isLoading;

  readonly raidZones = signal<RaidZone[]>([]);
  readonly bosses = signal<RaidBoss[]>([]);
  readonly selectedRaidId = signal<number>(GENERAL_SCOPE);
  readonly selectedBossId = signal<number | null>(null);
  readonly loadingBosses = signal(false);

  readonly raidOptions = computed<SelectOption<number>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return [
      { value: GENERAL_SCOPE, label: this.#transloco.translate('guildSettings.attributions.scope.general') },
      ...this.raidZones().map((z) => ({ value: z.id, label: this.#transloco.translate(raidZoneNameKey(z.shortCode)), iconUrl: raidZoneIconUrl(z.shortCode) })),
    ];
  });

  readonly bossOptions = computed<SelectOption<number>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return this.bosses().map((b) => ({ value: b.id, label: this.#transloco.translate(raidBossNameKey(b.name)), iconUrl: raidBossIconUrl(b.name) }));
  });

  readonly showBossPicker = computed(() => this.selectedRaidId() !== GENERAL_SCOPE);

  /** The scope currently loaded/edited — the boss's ID, or `null` for "General". */
  readonly currentRaidBossId = computed<number | null>(() => (this.selectedRaidId() === GENERAL_SCOPE ? null : this.selectedBossId()));

  constructor() {
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      untracked(() => this.#resetForBranch(guildId, guildBranchId));
    });
  }

  /** (Re)starts the editor on a branch: back to the "General" scope, with that branch's own raid zones. */
  #resetForBranch(guildId: string, guildBranchId: number): void {
    this.selectedRaidId.set(GENERAL_SCOPE);
    this.selectedBossId.set(null);
    this.bosses.set([]);
    this.raidZones.set([]);
    this.#definitionsService.getRaidZones(guildId, guildBranchId).subscribe((zones) => this.raidZones.set(zones));
    this.#loadScope();
  }

  /** Switches the "Raid" picker — General or a specific zone — auto-selecting its first boss so the editor never sits on an unresolved scope. */
  onRaidChange(raidId: number | null): void {
    this.selectedRaidId.set(raidId ?? GENERAL_SCOPE);
    this.selectedBossId.set(null);
    this.bosses.set([]);

    if (raidId === null || raidId === GENERAL_SCOPE) {
      this.#loadScope();
      return;
    }

    this.loadingBosses.set(true);
    this.#definitionsService.getBossesForZone(this.guildId(), raidId).subscribe((bosses) => {
      this.bosses.set(bosses);
      this.loadingBosses.set(false);
      this.onBossChange(bosses[0]?.id ?? null);
    });
  }

  onBossChange(bossId: number | null): void {
    this.selectedBossId.set(bossId);
    if (bossId != null) this.#loadScope();
  }

  #loadScope(): void {
    this.#store.load(this.guildId(), this.guildBranchId(), this.currentRaidBossId());
  }

  /** `null`/empty section renders under this fallback heading. */
  sectionLabel(definition: GuildAttributionDefinition): string {
    return definition.section?.trim() || '';
  }

  /** Definitions grouped by their (possibly empty) section, in template-render order — each group renders as its own nested card. */
  groupedSections(): { label: string; definitions: GuildAttributionDefinition[] }[] {
    const groups: { label: string; definitions: GuildAttributionDefinition[] }[] = [];

    for (const definition of this.definitions()) {
      const label = this.sectionLabel(definition);
      const lastGroup = groups.at(-1);
      if (lastGroup?.label === label) {
        lastGroup.definitions.push(definition);
      } else {
        groups.push({ label, definitions: [definition] });
      }
    }

    return groups;
  }

  openCreateDialog(): void {
    this.#openDialog(null, null);
  }

  openEditDialog(definition: GuildAttributionDefinition): void {
    this.#openDialog(definition, null);
  }

  duplicateDefinition(definition: GuildAttributionDefinition): void {
    this.#openDialog(null, definition);
  }

  /** Every currently-known section's icon, keyed by label — lets the row dialog prefill/preserve a section's icon when its rows are created/edited. */
  #sectionIcons(): { section: string; icon: IconSourceState }[] {
    return this.groupedSections()
      .filter((g) => g.label)
      .map((g) => {
        const first = g.definitions[0];
        return {
          section: g.label,
          icon: {
            iconSource: first.sectionIconSource,
            spellId: first.sectionSpellId,
            spellIconUrl: first.sectionSpellIconUrl,
            raidMarker: first.sectionRaidMarker,
            staticRole: first.sectionStaticRole,
          },
        };
      });
  }

  #openDialog(definition: GuildAttributionDefinition | null, cloneFrom: GuildAttributionDefinition | null): void {
    const existingSections = [...new Set(this.definitions().map((d) => d.section?.trim()).filter((s): s is string => !!s))].sort((a, b) => a.localeCompare(b));

    this.#dialog
      .open<boolean>(AttributionDefinitionDialogComponent, {
        width: 'min(1100px, 96vw)',
        maxHeight: '85vh',
        data: {
          guildId: this.guildId(),
          guildBranchId: this.guildBranchId(),
          expansionId: this.expansionId(),
          definition,
          cloneFrom,
          existingSections,
          existingSectionIcons: this.#sectionIcons(),
          raidBossId: this.currentRaidBossId(),
        } satisfies AttributionDefinitionDialogData,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  openSectionIconDialog(section: string): void {
    const found = this.#sectionIcons().find((s) => s.section === section);
    if (!found) return;

    this.#dialog
      .open<boolean>(SectionIconDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          guildId: this.guildId(),
          guildBranchId: this.guildBranchId(),
          raidBossId: this.currentRaidBossId(),
          section,
          icon: found.icon,
        } satisfies SectionIconDialogData,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reload();
      });
  }

  deleteDefinition(definition: GuildAttributionDefinition): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'guildSettings.attributions.deleteConfirmTitle',
          message: 'guildSettings.attributions.deleteConfirmMessage',
          messageParams: { label: definition.label },
          confirmLabel: 'guildSettings.attributions.delete',
          danger: true,
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.#definitionsService.deleteDefinition(this.guildId(), this.guildBranchId(), definition.id).subscribe({
          next: () => {
            this.#snackbar.success('guildSettings.attributions.deleteSuccess');
            this.#store.reload();
          },
          error: () => this.#snackbar.error('errors.server'),
        });
      });
  }

  onDrop(event: CdkDragDrop<GuildAttributionDefinition[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const reordered = [...this.definitions()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    this.#definitionsService.reorderDefinitions(this.guildId(), this.guildBranchId(), reordered.map((d) => d.id)).subscribe({
      next: () => this.#store.reload(),
      error: () => this.#snackbar.error('errors.server'),
    });
  }
}
