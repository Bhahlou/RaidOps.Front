import { Component, computed, input, model, signal } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';

export interface FilterOption<T> {
  value: T;
  label: string;
}

/**
 * Icon-button-triggered searchable filter dropdown — the "funnel" companion to
 * {@link SelectComponent}: same panel styling (elevated surface, accent-bordered search box,
 * rounded options), but for filtering a list rather than picking a form value. `undefined`
 * means "no filter": it renders as the leading "all" option and clears the selection.
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
  /** Label of the leading "no filter" option — translated by the caller. */
  readonly allLabel = input.required<string>();
  readonly searchPlaceholder = input('');
  readonly searchAriaLabel = input('');
  readonly triggerTitle = input('');

  /** Narrows the options shown in the panel — does not touch the filtered list itself. */
  readonly query = signal('');

  readonly filteredOptions = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  select(value: T | undefined): void {
    this.selected.set(value);
  }

  /** A stale search from the previous open would silently hide options. */
  onOpened(): void {
    this.query.set('');
  }
}
