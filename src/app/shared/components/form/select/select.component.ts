import { Component, computed, ElementRef, model, signal, viewChild, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { OverlayModule, STANDARD_DROPDOWN_BELOW_POSITIONS } from '@angular/cdk/overlay';
import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';

export interface SelectOption<T> {
  value: T;
  label: string;
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

  readonly isOpen = signal(false);
  readonly filterQuery = signal('');
  readonly triggerWidth = signal<number>(200);

  readonly filteredOptions = computed(() => {
    const query = this.filterQuery().toLowerCase().trim();
    if (!query) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(query));
  });

  readonly selectedLabel = computed(() => {
    const current = this.value();
    return this.options().find((o) => o.value === current)?.label ?? '';
  });

  readonly listboxValue = computed(() => {
    const current = this.value();
    return current === null ? [] : [current];
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
    this.value.set(event.value[0] ?? null);
    this.close();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
      this.trigger()?.nativeElement.focus();
    }
  }
}
