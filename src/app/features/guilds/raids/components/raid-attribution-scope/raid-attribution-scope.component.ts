import { Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { RaidMarkerIconComponent } from '../../../../../shared/components/icons/raid-marker-icon/raid-marker-icon.component';
import { AttributionRoleIconComponent } from '../../../../../shared/components/icons/attribution-role-icon/attribution-role-icon.component';
import { Spec } from '../../../../../shared/models/spec.model';
import { SpecRole } from '../../../../../shared/models/spec-role.enum';
import { GuildAttributionDefinition } from '../../models/guild-attribution-definition.model';
import { AttributionCell } from '../../models/attribution-cell.model';
import { AttributionCellKind } from '../../models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../../models/attribution-icon-source.enum';
import { RaidEventAttributions, SeatedCharacter } from '../../models/raid-event-attributions.model';

const UNASSIGNED = -1;

// Matches `.select-trigger`'s own CSS exactly (font-size: 0.875rem off a 16px root, family from
// `html` in styles.scss) — a `ch`-unit estimate was tried first and came out visibly too wide,
// since `ch` resolves against the *host* element's inherited font-size/metrics, not necessarily
// the actual rendered glyphs deep inside the select's own template; measuring the real string
// with the real font via canvas sidesteps that unit-conversion guesswork entirely.
const PICKER_FONT = '14px Inter, sans-serif';
let measureCanvasContext: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string): number {
  measureCanvasContext ??= document.createElement('canvas').getContext('2d');
  if (!measureCanvasContext) return text.length * 8;
  measureCanvasContext.font = PICKER_FONT;
  return measureCanvasContext.measureText(text).width;
}

export interface SlotChangeEvent {
  definitionId: number;
  cellId: number;
  instanceIndex: number;
  characterId: number | null;
}

/**
 * Renders one attribution scope's sections/rows/pickers — either the "General" data or one
 * specific boss's data. Presentational: the page hosting it (`raid-attributions.component`) owns
 * which scope(s) are loaded and how a slot change is persisted, since both a General block and a
 * boss block can be on screen at once and each needs its own store scope on save.
 */
@Component({
  selector: 'app-raid-attribution-scope',
  imports: [EmptyHintComponent, SelectComponent, SpellIconComponent, RaidMarkerIconComponent, AttributionRoleIconComponent, TranslocoPipe],
  templateUrl: './raid-attribution-scope.component.html',
  styleUrl: './raid-attribution-scope.component.scss',
})
export class RaidAttributionScopeComponent {
  readonly IconSource = AttributionIconSource;
  readonly CellKind = AttributionCellKind;

  readonly data = input<RaidEventAttributions | undefined>(undefined);
  readonly isLoading = input(false);
  readonly specs = input.required<Spec[]>();
  readonly classColorById = input.required<Map<number, string>>();
  readonly isOfficer = input(false);
  /** Lay sections out side by side (wrapping), instead of stacked in one column — for a wide host area (the boss column) with room to spare; General stays stacked in its narrow sidebar. */
  readonly horizontal = input(false);

  readonly slotChange = output<SlotChangeEvent>();

  /**
   * Definitions grouped by their (possibly empty) section, in template-render order — rows whose
   * `instanceCount` comes out to 0 (nobody in the current raid is eligible to fill them) are
   * dropped: an unassignable row is noise, not a useful reminder.
   */
  sections(): { label: string; definitions: GuildAttributionDefinition[] }[] {
    const definitions = (this.data()?.definitions ?? []).filter((d) => this.instanceCount(d) > 0);
    const groups: { label: string; definitions: GuildAttributionDefinition[] }[] = [];

    for (const definition of definitions) {
      const label = definition.section?.trim() || '';
      const lastGroup = groups.at(-1);
      if (lastGroup?.label === label) {
        lastGroup.definitions.push(definition);
      } else {
        groups.push({ label, definitions: [definition] });
      }
    }

    return groups;
  }

  /** Cells rendered once at the start of the row — everything before the first name-slot cell (typically the row's icon(s)). */
  headCells(definition: GuildAttributionDefinition): AttributionCell[] {
    const firstSlot = definition.cells.findIndex((c) => c.kind === AttributionCellKind.NameSlot);
    return firstSlot === -1 ? definition.cells : definition.cells.slice(0, firstSlot);
  }

  /** Cells repeated once per instance — from the first name-slot cell onward, in their original order (so an icon interleaved between two name slots stays put, e.g. tank-icon, tank-slot, heal-icon, heal-slot). */
  repeatingCells(definition: GuildAttributionDefinition): AttributionCell[] {
    const firstSlot = definition.cells.findIndex((c) => c.kind === AttributionCellKind.NameSlot);
    return firstSlot === -1 ? [] : definition.cells.slice(firstSlot);
  }

  /**
   * `repeatingCells()` grouped so an icon cell always wraps together with the name-slot it labels
   * (e.g. a heal-icon never lands on its own line, separated from the heal picker that follows
   * it) — a new group starts at every icon cell; the leading name-slot (the one with no icon of
   * its own, its icon already shown once in `headCells()`) forms its own single-cell group.
   */
  pairedCells(definition: GuildAttributionDefinition): AttributionCell[][] {
    const groups: AttributionCell[][] = [];
    for (const cell of this.repeatingCells(definition)) {
      if (cell.kind === AttributionCellKind.Icon || groups.length === 0) groups.push([]);
      groups.at(-1)!.push(cell);
    }
    return groups;
  }

  /**
   * One shared width for every picker in this scope — not just within a single attribution — so
   * pickers line up by their right edge too, instead of each definition settling on its own width
   * and producing a patchwork of slightly-different boxes down the page. Measured in real pixels
   * off what's actually shown right now (the picked name, or the slot's placeholder while empty)
   * rather than the longest name among every character who could theoretically be picked — a
   * restricted slot's full eligible pool (e.g. every warlock in the raid for a curse) is usually
   * far wider than whatever ends up assigned, and sizing for that worst case made every picker
   * needlessly bulky. Plus the select's own chrome (padding + chevron + gap).
   */
  readonly pickerWidth = computed<string>(() => {
    let maxTextWidth = 0;
    for (const section of this.sections()) {
      for (const definition of section.definitions) {
        maxTextWidth = Math.max(maxTextWidth, this.#maxSlotTextWidth(definition));
      }
    }
    return `${Math.ceil(maxTextWidth) + 46}px`;
  });

  /** Widest rendered text (picked name, or placeholder while empty) among a definition's own name-slot cells, across every instance. */
  #maxSlotTextWidth(definition: GuildAttributionDefinition): number {
    let maxTextWidth = 0;
    for (const cell of this.repeatingCells(definition)) {
      if (cell.kind !== AttributionCellKind.NameSlot) continue;
      for (const instanceIndex of this.instanceIndexes(definition)) {
        maxTextWidth = Math.max(maxTextWidth, measureTextWidth(this.#slotText(cell, instanceIndex)));
      }
    }
    return maxTextWidth;
  }

  #slotText(cell: AttributionCell, instanceIndex: number): string {
    const filledId = this.filledCharacterId(cell.id, instanceIndex);
    return filledId === UNASSIGNED ? (cell.slotLabel ?? '') : (this.characterOptions(cell).find((o) => o.value === filledId)?.label ?? '');
  }

  /**
   * A fixed-width gutter for `.attribution-head`'s icons, sized for the row with the most head
   * icons in this scope (e.g. Trash rows: a role icon + a raid-marker icon) — every other row's
   * (fewer) icons get padded up to that same width, so the picker that follows always starts at
   * the same x position regardless of how many icons precede it on that particular row.
   */
  readonly headIconGutterWidth = computed<string>(() => {
    const iconSize = 22;
    const gap = 4;
    let maxIcons = 0;
    for (const section of this.sections()) {
      for (const definition of section.definitions) {
        const count = this.headCells(definition).length;
        if (count > maxIcons) maxIcons = count;
      }
    }
    return `${maxIcons * iconSize + Math.max(0, maxIcons - 1) * gap}px`;
  });

  /**
   * How many instance-rows to render for this definition:
   * - Repeatable rows auto-size to the number of characters eligible for their first restricted
   *   name-slot cell (the "caster"/source slot, by convention) — e.g. one Innervate row per druid
   *   seated, zero (hidden) if nobody in the raid can cast it at all.
   * - Fixed (non-repeatable) rows stay at 1, unless every one of their name-slot cells is both
   *   restricted and has nobody eligible, in which case the row is entirely unfillable and hidden.
   * Either way, a floor from already-filled instances keeps existing assignments visible even if
   * the roster changed since (e.g. the assigned druid left) rather than silently dropping data.
   */
  instanceCount(definition: GuildAttributionDefinition): number {
    const filledMax = Math.max(0, ...(this.data()?.fills ?? []).filter((f) => f.definitionId === definition.id).map((f) => f.instanceIndex + 1));

    if (definition.isRepeatable) {
      const countingCell = this.repeatingCells(definition).find((c) => c.kind === AttributionCellKind.NameSlot && this.#hasRestriction(c));
      const eligible = countingCell ? this.characterOptions(countingCell).length - 1 : 1;
      return Math.max(eligible, filledMax);
    }

    if (filledMax > 0) return 1;
    return this.#isFixedRowUsable(definition) ? 1 : 0;
  }

  instanceIndexes(definition: GuildAttributionDefinition): number[] {
    return Array.from({ length: this.instanceCount(definition) }, (_, i) => i);
  }

  #hasRestriction(cell: AttributionCell): boolean {
    return cell.requiredClassIds.length > 0 || cell.requiredSpecIds.length > 0 || cell.requiredRoles.length > 0;
  }

  /** A fixed row stays visible as long as at least one of its name-slot cells is fillable by someone (unrestricted, or restricted with ≥1 eligible) — hiding only when every slot is a dead end. */
  #isFixedRowUsable(definition: GuildAttributionDefinition): boolean {
    const slots = this.repeatingCells(definition).filter((c) => c.kind === AttributionCellKind.NameSlot);
    if (slots.length === 0) return true;
    return slots.some((c) => !this.#hasRestriction(c) || this.characterOptions(c).length - 1 > 0);
  }

  /**
   * Seated characters eligible for a name-slot cell, restricted by its class/role/spec requirement
   * (if any) — labeled with the character's own class color instead of a class icon, and an empty
   * label for the "unassign" sentinel so the select falls back to showing the slot's placeholder
   * once nothing (or nobody eligible) is picked, rather than a redundant "—".
   */
  characterOptions(cell: AttributionCell): SelectOption<number>[] {
    const specsById = new Map(this.specs().map((s) => [s.id, s]));
    const colorsById = this.classColorById();
    const eligible = (this.data()?.seatedCharacters ?? []).filter((c: SeatedCharacter) => {
      if (cell.requiredClassIds.length > 0 && !cell.requiredClassIds.includes(c.classId)) return false;
      if (cell.requiredSpecIds.length > 0 && !cell.requiredSpecIds.includes(c.specId)) return false;
      if (cell.requiredRoles.length > 0 && !cell.requiredRoles.includes(specsById.get(c.specId)?.role as SpecRole)) return false;
      return true;
    });

    return [
      { value: UNASSIGNED, label: '' },
      ...eligible.map((c) => ({ value: c.characterId, label: c.name, color: colorsById.get(c.classId) ?? null })),
    ];
  }

  filledCharacterId(cellId: number, instanceIndex: number): number {
    return this.data()?.fills.find((f) => f.cellId === cellId && f.instanceIndex === instanceIndex)?.characterId ?? UNASSIGNED;
  }

  onSlotChange(definitionId: number, cellId: number, instanceIndex: number, characterId: number | null): void {
    this.slotChange.emit({ definitionId, cellId, instanceIndex, characterId: characterId === UNASSIGNED ? null : characterId });
  }
}
