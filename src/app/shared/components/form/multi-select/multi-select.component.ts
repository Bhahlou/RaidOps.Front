import { NgOptimizedImage } from '@angular/common';
import { Component, computed, ElementRef, model, signal, viewChild, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { OverlayModule, STANDARD_DROPDOWN_BELOW_POSITIONS } from '@angular/cdk/overlay';
import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { filterOptionsByLabel, groupOptions, OptionGroup } from '../../../utils/select-options.util';

export interface MultiSelectOption<T> {
  value: T;
  label: string;
  /**
   * Optional group header, rendered above consecutive options sharing the same value — the
   * caller is responsible for sorting `options` so same-group entries are contiguous.
   */
  group?: string;
  /** Optional colored dot rendered before the label (e.g. a Discord role color). */
  color?: string | null;
  /** Optional icon rendered before the label instead of the color dot, if set. */
  iconUrl?: string | null;
}

/**
 * Headless multi-select dropdown, sibling of SelectComponent (single-select) — same CDK
 * overlay + listbox scaffolding, but `cdkListboxMultiple` so clicking an option toggles it
 * in/out of the selection instead of replacing it. Used wherever a value is an explicit set
 * with no ordering/hierarchy semantics (guild branch activation, Discord role sets).
 */
@Component({
  selector: 'app-multi-select',
  imports: [OverlayModule, CdkListbox, CdkOption, FormsModule, NgOptimizedImage],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
})
export class MultiSelectComponent<T> implements FormValueControl<T[]> {
  readonly options = input.required<MultiSelectOption<T>[]>();
  readonly placeholder = input('');
  readonly filterable = input(false);
  readonly inputId = input<string | undefined>(undefined);
  readonly filterAriaLabel = input('Filter');
  readonly label = input<string | undefined>(undefined);
  readonly disabled = input(false);

  readonly value = model<T[]>([]);

  readonly dropdownPositions = STANDARD_DROPDOWN_BELOW_POSITIONS;

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly isOpen = signal(false);
  readonly filterQuery = signal('');
  readonly triggerWidth = signal<number>(200);

  readonly filteredOptions = computed(() => filterOptionsByLabel(this.options(), this.filterQuery()));

  readonly groupedOptions = computed<OptionGroup<MultiSelectOption<T>>[]>(() => groupOptions(this.filteredOptions()));

  /** Comma-joined labels of the current selection, in `options` order — ellipsized by CSS when it overflows. */
  readonly selectedLabel = computed(() => {
    const selected = new Set(this.value());
    if (selected.size === 0) return '';
    return this.options()
      .filter((o) => selected.has(o.value))
      .map((o) => o.label)
      .join(', ');
  });

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      this.filterQuery.set('');
      this.triggerWidth.set(this.trigger()?.nativeElement.offsetWidth ?? 200);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  onListboxValueChange(event: ListboxValueChangeEvent<T>): void {
    this.value.set([...event.value]);
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
      this.trigger()?.nativeElement.focus();
    }
  }

  isSelected(option: MultiSelectOption<T>): boolean {
    return this.value().includes(option.value);
  }
}
