import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { CheckboxComponent } from '../../../../../shared/components/form/checkbox/checkbox.component';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { MultiSelectComponent, MultiSelectOption } from '../../../../../shared/components/form/multi-select/multi-select.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { Spec } from '../../../../../shared/models/spec.model';
import { WowClass } from '../../../../../shared/models/wow-class.model';
import { SpecRole, SPEC_ROLE_ORDER, specRoleIconUrl } from '../../../../../shared/models/spec-role.enum';
import { CLASS_ICON_NAMES, wowClassIconUrl } from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { AttributionRoleIconComponent } from '../../../../../shared/components/icons/attribution-role-icon/attribution-role-icon.component';
import { AttributionDefinitionsService } from '../../../raids/services/attribution-definitions.service';
import { SpellPickerComponent } from '../../../raids/components/spell-picker/spell-picker.component';
import { RaidMarkerPickerComponent } from '../../../raids/components/raid-marker-picker/raid-marker-picker.component';
import { IconSourcePickerComponent, IconSourceState, BLANK_ICON_SOURCE } from '../../../raids/components/icon-source-picker/icon-source-picker.component';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import {
  CreateGuildAttributionDefinitionPayload,
  GuildAttributionDefinition,
  GuildAttributionDefinitionPayload,
  SetAttributionSectionIconPayload,
} from '../../../raids/models/guild-attribution-definition.model';
import { AttributionCell, AttributionCellPayload } from '../../../raids/models/attribution-cell.model';
import { AttributionCellKind } from '../../../raids/models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../../../raids/models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../../raids/models/raid-marker-icon.enum';
import { Spell } from '../../../raids/models/spell.model';

export interface AttributionDefinitionDialogData {
  guildId: string;
  guildBranchId: number;
  expansionId: number;
  /** The row to edit, or `null` to create a new one. */
  definition: GuildAttributionDefinition | null;
  /** When set (and `definition` is `null`), pre-fills a new row's fields from this existing one — the "duplicate" action. */
  cloneFrom?: GuildAttributionDefinition | null;
  /** Distinct, already-used section labels across the guild's template — offered as suggestions to avoid typos. */
  existingSections: string[];
  /** Every currently-known section's icon, keyed by label — lets typing an existing section name pick up its current icon instead of starting blank. */
  existingSectionIcons: { section: string; icon: IconSourceState }[];
  /** Scope to create a new row under — the boss's ID, or `null` for "General". Ignored when editing (a row's scope can't change). */
  raidBossId: number | null;
}

/** One cell as edited in the composer — mirrors `AttributionCell` but keyed locally since new cells have no server `id` yet. */
interface ComposerCell {
  key: string;
  kind: AttributionCellKind;
  iconSource: AttributionIconSource;
  spellId: number | null;
  spellIconUrl: string | null;
  raidMarker: RaidMarkerIcon | null;
  staticRole: SpecRole | null;
  slotLabel: string;
  requiredClassIds: number[];
  requiredRoles: SpecRole[];
  requiredSpecIds: number[];
}

let nextKey = 0;

function fromCell(cell: AttributionCell): ComposerCell {
  return {
    key: `existing-${cell.id}`,
    kind: cell.kind,
    iconSource: cell.iconSource,
    spellId: cell.spellId,
    spellIconUrl: cell.spellIconUrl,
    raidMarker: cell.raidMarker,
    staticRole: cell.staticRole,
    slotLabel: cell.slotLabel ?? '',
    requiredClassIds: cell.requiredClassIds,
    requiredRoles: cell.requiredRoles,
    requiredSpecIds: cell.requiredSpecIds,
  };
}

function blankCell(kind: AttributionCellKind): ComposerCell {
  return {
    key: `new-${nextKey++}`,
    kind,
    iconSource: AttributionIconSource.None,
    spellId: null,
    spellIconUrl: null,
    raidMarker: null,
    staticRole: null,
    slotLabel: '',
    requiredClassIds: [],
    requiredRoles: [],
    requiredSpecIds: [],
  };
}

function toPayload(cell: ComposerCell): AttributionCellPayload {
  return {
    kind: cell.kind,
    iconSource: cell.iconSource,
    spellId: cell.spellId,
    raidMarker: cell.raidMarker,
    staticRole: cell.staticRole,
    slotLabel: cell.slotLabel.trim() || null,
    requiredClassIds: cell.requiredClassIds,
    requiredRoles: cell.requiredRoles,
    requiredSpecIds: cell.requiredSpecIds,
  };
}

/** i18n key slug for a spec's English name (e.g. "Beast Mastery" → "beastmastery"). */
function specSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '');
}

/** Add/edit dialog for a single row of the guild's raid-attribution template — a composer of ordered icon/name-slot cells. */
@Component({
  selector: 'app-attribution-definition-dialog',
  imports: [
    TranslocoPipe,
    ButtonComponent,
    IconButtonComponent,
    CheckboxComponent,
    FormFieldCardComponent,
    MultiSelectComponent,
    AttributionRoleIconComponent,
    SpellPickerComponent,
    RaidMarkerPickerComponent,
    IconSourcePickerComponent,
    SpellIconComponent,
    RaidMarkerIconComponent,
  ],
  templateUrl: './attribution-definition-dialog.component.html',
  styleUrl: './attribution-definition-dialog.component.scss',
})
export class AttributionDefinitionDialogComponent {
  readonly CellKind = AttributionCellKind;
  readonly IconSource = AttributionIconSource;
  readonly Role = SpecRole;
  readonly staticRoleOrder = SPEC_ROLE_ORDER;

  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #definitionsService = inject(AttributionDefinitionsService);
  readonly #characterStore = inject(CharacterStore);
  readonly #wowClassService = inject(WowClassService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<AttributionDefinitionDialogData>(DIALOG_DATA);

  readonly isEditMode = !!this.data.definition;

  // Prefills come from the row being edited, or — when duplicating — from `cloneFrom`; the two
  // never both apply since duplicating always opens in create mode (`definition` is null there).
  readonly #prefill = this.data.definition ?? this.data.cloneFrom ?? null;

  readonly label = signal(
    // Only wrap in the "(copy)" template when there's an actual label to copy — an empty label
    // (icon-only row) stays empty instead of duplicating into a lone, confusing " (copy)".
    this.data.cloneFrom?.label
      ? this.#transloco.translate('guildSettings.attributions.dialog.duplicateLabel', { label: this.data.cloneFrom.label })
      : (this.#prefill?.label ?? ''),
  );
  readonly section = signal(this.#prefill?.section ?? '');
  readonly isRepeatable = signal(this.#prefill?.isRepeatable ?? false);
  readonly cells = signal<ComposerCell[]>((this.#prefill?.cells ?? []).map(fromCell));

  readonly #sectionIconsByLabel = new Map(this.data.existingSectionIcons.map((s) => [s.section, s.icon]));
  readonly sectionIcon = signal<IconSourceState>(
    this.#prefill
      ? {
          iconSource: this.#prefill.sectionIconSource,
          spellId: this.#prefill.sectionSpellId,
          spellIconUrl: this.#prefill.sectionSpellIconUrl,
          raidMarker: this.#prefill.sectionRaidMarker,
          staticRole: this.#prefill.sectionStaticRole,
        }
      : (this.#sectionIconsByLabel.get(this.section().trim()) ?? BLANK_ICON_SOURCE),
  );

  readonly submitting = signal(false);
  readonly #specs = signal<Spec[]>([]);
  readonly #classes = signal<WowClass[]>([]);

  /**
   * Classes already playable in this guild's branch (expansion), ordered alphabetically by
   * translated name. Availability itself is resolved server-side (see `WowClassService.getAll`) —
   * a plain `firstExpansionId <= expansionId` cutoff here would incorrectly include classes from a
   * forked branch's "future" mainline history (e.g. Death Knight on a Forever-scoped template).
   */
  readonly classes = computed(() =>
    this.#classes()
      .map((c) => ({ id: c.id, name: this.#className(c.id) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly classOptions = computed<MultiSelectOption<number>[]>(() =>
    this.classes().map((c) => ({ value: c.id, label: c.name, iconUrl: wowClassIconUrl(c.id) })),
  );

  readonly roleOptions = computed<MultiSelectOption<SpecRole>[]>(() =>
    SPEC_ROLE_ORDER.map((role) => ({ value: role, label: this.#roleLabel(role), iconUrl: specRoleIconUrl(role) })),
  );

  readonly canSubmit = computed(() => {
    if (this.submitting() || this.cells().length === 0) return false;
    return this.cells().every((cell) => {
      if (cell.kind === AttributionCellKind.Icon) {
        if (cell.iconSource === AttributionIconSource.Spell) return cell.spellId !== null;
        if (cell.iconSource === AttributionIconSource.RaidMarker) return cell.raidMarker !== null;
        if (cell.iconSource === AttributionIconSource.StaticRole) return cell.staticRole !== null;
        return false;
      }
      return true;
    });
  });

  constructor() {
    this.#characterStore.loadSpecs().subscribe((specs) => this.#specs.set(specs));
    this.#wowClassService.getAll(this.data.expansionId).subscribe((classes) => this.#classes.set(classes));
  }

  /**
   * Specs eligible for a cell's spec-restriction list — always narrowed to classes playable in
   * this branch (e.g. no Monk/Demon Hunter specs on TBC), further narrowed to the cell's selected
   * classes, if any; grouped and ordered by class (matching `classes()`'s order) rather than
   * flat-alphabetical, with translated names.
   */
  specOptionsFor(cell: ComposerCell): MultiSelectOption<number>[] {
    const branchClasses = this.classes();
    const branchClassIds = new Set(branchClasses.map((c) => c.id));
    const scopedClassIds = cell.requiredClassIds.length > 0 ? cell.requiredClassIds : [...branchClassIds];
    const classIndex = new Map(branchClasses.map((c, i) => [c.id, i]));
    const classNameById = new Map(branchClasses.map((c) => [c.id, c.name]));

    return this.#specs()
      .filter((s) => branchClassIds.has(s.classId) && scopedClassIds.includes(s.classId))
      .sort((a, b) => {
        const classDiff = (classIndex.get(a.classId) ?? 0) - (classIndex.get(b.classId) ?? 0);
        return classDiff !== 0 ? classDiff : this.#specName(a.name).localeCompare(this.#specName(b.name));
      })
      .map((s) => ({
        value: s.id,
        label: this.#specName(s.name),
        iconUrl: s.iconUrl,
        group: classNameById.get(s.classId),
      }));
  }

  addIconCell(): void {
    this.cells.update((cells) => [...cells, blankCell(AttributionCellKind.Icon)]);
  }

  addNameSlotCell(): void {
    this.cells.update((cells) => [...cells, blankCell(AttributionCellKind.NameSlot)]);
  }

  removeCell(key: string): void {
    this.cells.update((cells) => cells.filter((c) => c.key !== key));
  }

  moveCell(key: string, direction: -1 | 1): void {
    this.cells.update((cells) => {
      const index = cells.findIndex((c) => c.key === key);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= cells.length) return cells;
      const reordered = [...cells];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  }

  onSpellSelected(key: string, spell: Spell): void {
    this.#patchCell(key, { iconSource: AttributionIconSource.Spell, spellId: spell.id, spellIconUrl: spell.iconUrl, raidMarker: null, staticRole: null });
  }

  onMarkerSelected(key: string, marker: RaidMarkerIcon): void {
    this.#patchCell(key, { iconSource: AttributionIconSource.RaidMarker, raidMarker: marker, spellId: null, spellIconUrl: null, staticRole: null });
  }

  onStaticRoleSelected(key: string, role: SpecRole): void {
    this.#patchCell(key, { iconSource: AttributionIconSource.StaticRole, staticRole: role, spellId: null, spellIconUrl: null, raidMarker: null });
  }

  setSlotLabel(key: string, value: string): void {
    this.#patchCell(key, { slotLabel: value });
  }

  /** Typing a section name that matches an existing one picks up its current icon; anything else (new/blank) starts blank so it doesn't silently inherit a stale icon. */
  setSection(value: string): void {
    this.section.set(value);
    this.sectionIcon.set(this.#sectionIconsByLabel.get(value.trim()) ?? BLANK_ICON_SOURCE);
  }

  setSectionIcon(icon: IconSourceState): void {
    this.sectionIcon.set(icon);
  }

  setRequiredClasses(cell: ComposerCell, classIds: number[]): void {
    this.#patchCell(cell.key, { requiredClassIds: classIds, requiredSpecIds: [] });
  }

  setRequiredRoles(cell: ComposerCell, roles: SpecRole[]): void {
    this.#patchCell(cell.key, { requiredRoles: roles });
  }

  setRequiredSpecs(cell: ComposerCell, specIds: number[]): void {
    this.#patchCell(cell.key, { requiredSpecIds: specIds });
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const payload: GuildAttributionDefinitionPayload = {
      label: this.label().trim(),
      section: this.section().trim() || null,
      isRepeatable: this.isRepeatable(),
      cells: this.cells().map(toPayload),
    };

    this.submitting.set(true);

    const request = this.data.definition
      ? this.#definitionsService.updateDefinition(this.data.guildId, this.data.guildBranchId, this.data.definition.id, payload)
      : this.#definitionsService.createDefinition(this.data.guildId, this.data.guildBranchId, { ...payload, raidBossId: this.data.raidBossId } satisfies CreateGuildAttributionDefinitionPayload);

    request.subscribe({
      next: () => this.#saveSectionIconThenClose(),
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(err.error?.error ? `guildSettings.attributions.errors.${err.error.error}` : 'errors.server');
      },
    });
  }

  /**
   * Pushes the section icon (if a section is set) so every row sharing it stays in sync, then
   * closes — the row itself already saved successfully at this point, so a failure here is
   * surfaced but doesn't roll back or block closing the dialog.
   */
  #saveSectionIconThenClose(): void {
    const section = this.section().trim();
    if (!section) {
      this.#snackbar.success('guildSettings.attributions.saveSuccess');
      this.#dialogRef.close(true);
      return;
    }

    this.#definitionsService
      .setSectionIcon(this.data.guildId, this.data.guildBranchId, { raidBossId: this.data.raidBossId, section, ...this.sectionIcon() } satisfies SetAttributionSectionIconPayload)
      .subscribe({
        next: () => {
          this.#snackbar.success('guildSettings.attributions.saveSuccess');
          this.#dialogRef.close(true);
        },
        error: () => {
          this.#snackbar.error('guildSettings.attributions.sectionIcon.saveFailed');
          this.#dialogRef.close(true);
        },
      });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }

  #className(classId: number): string {
    const slug = CLASS_ICON_NAMES[classId];
    return slug ? this.#transloco.translate(`guildSettings.attributions.classes.${slug}`) : String(classId);
  }

  #specName(name: string): string {
    return this.#transloco.translate(`guildSettings.attributions.specs.${specSlug(name)}`);
  }

  #roleLabel(role: SpecRole): string {
    switch (role) {
      case SpecRole.Tank:
        return this.#transloco.translate('guildSettings.attributions.dialog.roleTank');
      case SpecRole.Healer:
        return this.#transloco.translate('guildSettings.attributions.dialog.roleHealer');
      case SpecRole.RangedDps:
        return this.#transloco.translate('guildSettings.attributions.dialog.roleRanged');
      case SpecRole.MeleeDps:
        return this.#transloco.translate('guildSettings.attributions.dialog.roleMelee');
    }
  }

  #patchCell(key: string, patch: Partial<ComposerCell>): void {
    this.cells.update((cells) => cells.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
}
