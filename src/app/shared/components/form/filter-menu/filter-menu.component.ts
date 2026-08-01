import { booleanAttribute, Component, computed, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';

export interface FilterOption<T> {
  value: T;
  label: string;
  /** Optional icon shown before the label, both in the panel and (single-select) on the trigger once selected. */
  iconUrl?: string | null;
}

/**
 * Icon-button-triggered searchable filter dropdown — the "funnel" companion to
 * {@link SelectComponent}: same panel styling (elevated surface, accent-bordered search box,
 * rounded options), but for filtering a list rather than picking a form value.
 *
 * Single-select (default) uses `selected`/`selectedChange` — `undefined` means "no filter": it
 * renders as the leading "all" option and clears the selection. Multi-select (`multiple`) uses
 * `selectedMany`/`selectedManyChange` instead — an empty array means "no filter". Its rows are
 * plain toggle buttons, deliberately *not* `cdkMenuItem`/`cdkMenuItemCheckbox`: both close the
 * whole menu on every click (a CDK quirk — `CdkMenuItemCheckbox` still calls the base
 * `CdkMenuItem`'s unconditional `closeAll()` on a mouse click, only a spacebar keypress respects
 * "stay open"), which defeats picking several options in one open. The "all"/clear row stays a
 * real `cdkMenuItem`, since closing after it is the desired behavior.
 */
@Component({
  selector: 'app-filter-menu',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger],
  templateUrl: './filter-menu.component.html',
  styleUrl: './filter-menu.component.scss',
})
export class FilterMenuComponent<T> {
  readonly options = input.required<FilterOption<T>[]>();
  readonly selected = model<T | undefined>(undefined);
  /** Switches the panel to checkbox items backed by `selectedMany` instead of `selected`. */
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly selectedMany = model<T[]>([]);
  /** Label of the leading "no filter" option — translated by the caller. */
  readonly allLabel = input.required<string>();
  readonly searchPlaceholder = input('');
  readonly searchAriaLabel = input('');
  readonly triggerTitle = input('');
  /**
   * Short heading text (e.g. "Class") rendered next to the funnel icon, turning the trigger into
   * a labeled chip instead of a bare icon — needed wherever several filters sit side by side with
   * no other cue (like a table column header) for what each one filters. Left empty, the trigger
   * stays icon-only, e.g. next to a self-explanatory column header.
   */
  readonly label = input('');

  /** Narrows the options shown in the panel — does not touch the filtered list itself. */
  readonly query = signal('');

  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly filteredOptions = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  readonly hasSelection = computed(() => (this.multiple() ? this.selectedMany().length > 0 : this.selected() !== undefined));

  /**
   * What the chip shows once active: the picked option's own label for a single selection, or a
   * count against the static `label()` for several (a name list would overflow the chip's width).
   */
  readonly selectedSummary = computed(() => {
    if (this.multiple()) {
      const count = this.selectedMany().length;
      return count > 0 ? `${this.label()} (${count})` : null;
    }
    return this.options().find((o) => o.value === this.selected())?.label;
  });

  select(value: T | undefined): void {
    this.selected.set(value);
  }

  isChecked(value: T): boolean {
    return this.selectedMany().includes(value);
  }

  toggle(value: T): void {
    const current = this.selectedMany();
    this.selectedMany.set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  clearMany(): void {
    this.selectedMany.set([]);
  }

  /**
   * A stale search from the previous open would silently hide options. Focus is grabbed via a
   * macrotask, not synchronously here — CdkMenuTrigger's own click handler focuses the first
   * `cdkMenuItem` right after this fires, and a `setTimeout` is guaranteed to run after that
   * synchronous call, letting our focus win instead of its.
   */
  onOpened(): void {
    this.query.set('');
    setTimeout(() => this.searchInputRef()?.nativeElement.focus());
  }
}
