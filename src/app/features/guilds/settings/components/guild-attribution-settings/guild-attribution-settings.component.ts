import { Component, inject, input, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import { AttributionRoleIconComponent } from '../../../../../shared/components/icons/attribution-role-icon/attribution-role-icon.component';
import { AttributionDefinitionsStore } from '../../stores/attribution-definitions.store';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { GuildAttributionDefinition } from '../../../raids/models/guild-attribution-definition.model';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { AttributionCellKind } from '../../../raids/models/attribution-cell-kind.enum';
import {
  AttributionDefinitionDialogComponent,
  AttributionDefinitionDialogData,
} from '../attribution-definition-dialog/attribution-definition-dialog.component';

/** Guild-wide raid-attribution template editor — one evolving, reorderable list of rows the guild curates as its raid content changes. */
@Component({
  selector: 'app-guild-attribution-settings',
  imports: [
    CdkDropList,
    CdkDrag,
    ButtonComponent,
    IconButtonComponent,
    FormFieldCardComponent,
    SpellIconComponent,
    RaidMarkerIconComponent,
    AttributionRoleIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './guild-attribution-settings.component.html',
  styleUrl: './guild-attribution-settings.component.scss',
})
export class GuildAttributionSettingsComponent implements OnInit {
  readonly guildId = input.required<string>();
  /** The expansion the spell picker searches against — currently the guild's single active expansion. */
  readonly expansionId = input.required<number>();

  readonly IconSource = AttributionIconSource;
  readonly CellKind = AttributionCellKind;

  readonly #store = inject(AttributionDefinitionsStore);
  readonly #definitionsService = inject(AttributionDefinitionsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);

  readonly definitions = this.#store.definitions;
  readonly isLoading = this.#store.isLoading;

  ngOnInit(): void {
    this.#store.load(this.guildId());
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

  #openDialog(definition: GuildAttributionDefinition | null, cloneFrom: GuildAttributionDefinition | null): void {
    const existingSections = [...new Set(this.definitions().map((d) => d.section?.trim()).filter((s): s is string => !!s))].sort((a, b) => a.localeCompare(b));

    this.#dialog
      .open<boolean>(AttributionDefinitionDialogComponent, {
        width: 'min(1100px, 96vw)',
        maxHeight: '85vh',
        data: {
          guildId: this.guildId(),
          expansionId: this.expansionId(),
          definition,
          cloneFrom,
          existingSections,
        } satisfies AttributionDefinitionDialogData,
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
        this.#definitionsService.deleteDefinition(this.guildId(), definition.id).subscribe({
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

    this.#definitionsService.reorderDefinitions(this.guildId(), reordered.map((d) => d.id)).subscribe({
      next: () => this.#store.reload(),
      error: () => this.#snackbar.error('errors.server'),
    });
  }
}
