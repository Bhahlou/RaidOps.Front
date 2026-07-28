import { Component, computed, ElementRef, model, viewChild, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { OverlayModule, STANDARD_DROPDOWN_BELOW_POSITIONS } from '@angular/cdk/overlay';
import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { filterOptionsByLabel, groupOptions, OptionGroup } from '../../../utils/select-options.util';
import { createDropdownPanel } from '../../../utils/dropdown-panel.util';

export interface SelectOption<T> {
  value: T;
  label: string;
  /**
   * Optional group header, rendered above consecutive options sharing the same value — the
   * caller is responsible for sorting `options` so same-group entries are contiguous.
   */
  group?: string;
}

/**
 * Headless select built on CDK overlay + listbox, styled entirely with our own CSS.
 * Implements Signal Forms' FormValueControl directly (unlike Material/PrimeNG's own
 * select components), so [formField] binds to it with no manual bridging.
 */
@Component({
  selector: 'app-select',
  imports: [OverlayModule, CdkListbox, CdkOption, FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent<T> implements FormValueControl<T | null> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly placeholder = input('');
  readonly filterable = input(false);
  readonly inputId = input<string | undefined>(undefined);
  readonly filterAriaLabel = input('Filter');
  /** Docked in-field label (PrimeNG IftaLabel-style) — sits above the value, inside the trigger. */
  readonly label = input<string | undefined>(undefined);
  readonly disabled = input(false);

  readonly value = model<T | null>(null);

  readonly dropdownPositions = STANDARD_DROPDOWN_BELOW_POSITIONS;

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly #panel = createDropdownPanel(this.disabled, this.trigger);
  readonly isOpen = this.#panel.isOpen;
  readonly filterQuery = this.#panel.filterQuery;
  readonly triggerWidth = this.#panel.triggerWidth;

  readonly filteredOptions = computed(() => filterOptionsByLabel(this.options(), this.filterQuery()));

  /** `filteredOptions` folded into runs of consecutive same-group entries, for group headers. */
  readonly groupedOptions = computed<OptionGroup<SelectOption<T>>[]>(() => groupOptions(this.filteredOptions()));

  readonly selectedLabel = computed(() => {
    const current = this.value();
    return this.options().find((o) => o.value === current)?.label ?? '';
  });

  readonly listboxValue = computed(() => {
    const current = this.value();
    return current === null ? [] : [current];
  });

  toggle(): void {
    this.#panel.toggle();
  }

  close(): void {
    this.#panel.close();
  }

  onListboxValueChange(event: ListboxValueChangeEvent<T>): void {
    this.value.set(event.value[0] ?? null);
    this.close();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    this.#panel.onPanelKeydown(event);
  }
}
