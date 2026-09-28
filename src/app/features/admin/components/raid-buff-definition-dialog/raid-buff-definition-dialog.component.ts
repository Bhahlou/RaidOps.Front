import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AdminStore } from '../../../../core/stores/admin.store';
import { CharacterStore } from '../../../characters/stores/character.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { CLASS_COLORS, wowClassIconUrl } from '../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { SpellIconComponent } from '../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidBuffDefinition, RaidBuffDefinitionInput } from '../../../../shared/models/raid-buff-definition.model';
import { RaidBuffKind, RAID_BUFF_KIND_ORDER } from '../../../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope, RAID_BUFF_SCOPE_ORDER } from '../../../../shared/models/raid-buff-scope.enum';
import { Spec } from '../../../../shared/models/spec.model';
import { WowClass } from '../../../../shared/models/wow-class.model';
import { WowClassService } from '../../../../shared/services/wow-class.service';
import { raidBuffSpellName } from '../../../../shared/utils/raid-buff.util';
import { SpellPickerComponent } from '../../../guilds/raids/components/spell-picker/spell-picker.component';
import { Spell } from '../../../guilds/raids/models/spell.model';

export interface RaidBuffDefinitionDialogData {
  expansionId: number;
  /** The definition to edit, or `null` to create a new one. Editing may change the definition's spell. */
  definition: RaidBuffDefinition | null;
  /** Sort order pre-filled on a new definition, so it lands at the end of the list. */
  nextSortOrder: number;
}

/** The spec option value meaning "any spec of the class" — `app-select` has no way to select a real `null`. */
const ANY_SPEC = 0;

/** One source as edited in the dialog. */
interface SourceRow {
  key: string;
  classId: number | null;
  specId: number;
}

let nextKey = 0;

function blankSource(): SourceRow {
  return { key: `source-${nextKey++}`, classId: null, specId: ANY_SPEC };
}

/** Add/edit dialog for one raid buff/debuff definition — owner-only, opened from the raid buffs admin page. */
@Component({
  selector: 'app-raid-buff-definition-dialog',
  imports: [TranslocoPipe, ButtonComponent, IconButtonComponent, FormFieldCardComponent, SelectComponent, SpellIconComponent, SpellPickerComponent],
  templateUrl: './raid-buff-definition-dialog.component.html',
  styleUrl: './raid-buff-definition-dialog.component.scss',
})
export class RaidBuffDefinitionDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #adminStore = inject(AdminStore);
  readonly #characterStore = inject(CharacterStore);
  readonly #wowClassService = inject(WowClassService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<RaidBuffDefinitionDialogData>(DIALOG_DATA);

  readonly isEditMode = !!this.data.definition;

  readonly spell = signal<{ id: number; name: string; iconUrl: string } | null>(
    this.data.definition
      ? {
          id: this.data.definition.spellId,
          name: this.data.definition.spell ? raidBuffSpellName(this.data.definition.spell, this.#transloco.getActiveLang()) : `#${this.data.definition.spellId}`,
          iconUrl: this.data.definition.spell?.iconUrl ?? '',
        }
      : null,
  );
  readonly scope = signal<RaidBuffScope>(this.data.definition?.scope ?? RaidBuffScope.Raid);
  readonly kind = signal<RaidBuffKind>(this.data.definition?.kind ?? RaidBuffKind.Buff);
  readonly labelEn = signal(this.data.definition?.labelEn ?? '');
  readonly labelFr = signal(this.data.definition?.labelFr ?? '');
  readonly labelDe = signal(this.data.definition?.labelDe ?? '');
  readonly exclusiveGroupKey = signal(this.data.definition?.exclusiveGroupKey ?? '');
  readonly capacityPoolKey = signal(this.data.definition?.capacityPoolKey ?? '');
  readonly sortOrder = signal(this.data.definition?.sortOrder ?? this.data.nextSortOrder);
  readonly sources = signal<SourceRow[]>(
    (this.data.definition?.sources ?? []).map((s) => ({ key: `source-${nextKey++}`, classId: s.classId, specId: s.specId ?? ANY_SPEC })),
  );

  readonly submitting = signal(false);
  readonly #classes = signal<WowClass[]>([]);
  readonly #specs = signal<Spec[]>([]);

  readonly scopeOptions = computed<SelectOption<RaidBuffScope>[]>(() =>
    RAID_BUFF_SCOPE_ORDER.map((scope) => ({ value: scope, label: this.#transloco.translate(`admin.raidBuffs.scope.${scope}`) })),
  );

  readonly kindOptions = computed<SelectOption<RaidBuffKind>[]>(() =>
    RAID_BUFF_KIND_ORDER.map((kind) => ({ value: kind, label: this.#transloco.translate(`admin.raidBuffs.kind.${kind}`) })),
  );

  /** Classes playable on the definition's expansion — resolved server-side (see `WowClassService.getAll`), so e.g. no Death Knight on Forever. */
  readonly classOptions = computed<SelectOption<number>[]>(() =>
    this.#classes().map((c) => ({
      value: c.id,
      label: this.#transloco.translate(`classes.${c.id}`),
      iconUrl: wowClassIconUrl(c.id),
      color: CLASS_COLORS[c.id] ?? null,
    })),
  );

  readonly canSubmit = computed(
    () =>
      !this.submitting() &&
      this.spell() !== null &&
      [this.labelEn(), this.labelFr(), this.labelDe()].every((label) => label.trim().length > 0) &&
      this.sources().length > 0 &&
      this.sources().every((s) => s.classId !== null),
  );

  constructor() {
    this.#wowClassService.getAll(this.data.expansionId).subscribe((classes) => this.#classes.set(classes));
    this.#characterStore.loadSpecs().subscribe((specs) => this.#specs.set(specs));
  }

  /** "Any spec" followed by the class's own specs — empty until a class is chosen. */
  specOptionsFor(row: SourceRow): SelectOption<number>[] {
    if (row.classId === null) return [];

    const specs = this.#specs()
      .filter((s) => s.classId === row.classId)
      .map((s) => ({ value: s.id, label: this.#transloco.translate(`specs.${s.id}`), iconUrl: s.iconUrl }));

    return [{ value: ANY_SPEC, label: this.#transloco.translate('admin.raidBuffs.dialog.anySpec') }, ...specs];
  }

  onSpellSelected(spell: Spell): void {
    this.spell.set({ id: spell.id, name: spell.name, iconUrl: spell.iconUrl });
  }

  addSource(): void {
    this.sources.update((rows) => [...rows, blankSource()]);
  }

  removeSource(key: string): void {
    this.sources.update((rows) => rows.filter((r) => r.key !== key));
  }

  /** Changing the class resets the spec, since the previous spec belonged to another class. */
  setSourceClass(key: string, classId: number | null): void {
    this.#patchSource(key, { classId, specId: ANY_SPEC });
  }

  setSourceSpec(key: string, specId: number | null): void {
    this.#patchSource(key, { specId: specId ?? ANY_SPEC });
  }

  submit(): void {
    const spell = this.spell();
    if (!this.canSubmit() || spell === null) return;

    const definition: RaidBuffDefinitionInput = {
      spellId: spell.id,
      scope: this.scope(),
      kind: this.kind(),
      labelEn: this.labelEn().trim(),
      labelFr: this.labelFr().trim(),
      labelDe: this.labelDe().trim(),
      exclusiveGroupKey: this.exclusiveGroupKey().trim() || null,
      capacityPoolKey: this.capacityPoolKey().trim() || null,
      sortOrder: this.sortOrder(),
      sources: this.sources().map((s) => ({ classId: s.classId as number, specId: s.specId === ANY_SPEC ? null : s.specId })),
    };

    this.submitting.set(true);

    const request: Observable<unknown> = this.data.definition
      ? this.#adminStore.updateRaidBuff(this.data.definition.id, definition)
      : this.#adminStore.saveRaidBuff(this.data.expansionId, definition);

    request.subscribe({
      next: () => {
        this.#snackbar.success('admin.raidBuffs.saveSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        // Owner-only screen: the back-end's validation detail is worth showing verbatim.
        this.#snackbar.error(err.error?.detail ?? 'errors.server');
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }

  #patchSource(key: string, patch: Partial<SourceRow>): void {
    this.sources.update((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
}
