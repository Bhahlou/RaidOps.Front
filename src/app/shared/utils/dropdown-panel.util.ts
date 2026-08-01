import { ElementRef, signal } from '@angular/core';

/**
 * Open/filter-reset/keyboard state machine shared by SelectComponent and MultiSelectComponent's
 * CDK-overlay trigger button — everything about opening/closing the panel that doesn't depend on
 * single- vs multi-select semantics.
 */
export function createDropdownPanel(
  disabled: () => boolean,
  trigger: () => ElementRef<HTMLButtonElement> | undefined,
  filterInput?: () => ElementRef<HTMLInputElement> | undefined,
) {
  const isOpen = signal(false);
  const filterQuery = signal('');
  const triggerWidth = signal<number>(200);

  function toggle(): void {
    if (disabled()) return;
    isOpen.update((open) => !open);
    if (isOpen()) {
      filterQuery.set('');
      triggerWidth.set(trigger()?.nativeElement.offsetWidth ?? 200);
      // A macrotask, not a microtask/effect — guaranteed to run after the overlay's own initial
      // focus handling, which otherwise wins the race and leaves the filter input unfocused.
      if (filterInput) setTimeout(() => filterInput()?.nativeElement.focus());
    }
  }

  function close(): void {
    isOpen.set(false);
  }

  function onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      close();
      trigger()?.nativeElement.focus();
    }
  }

  return { isOpen, filterQuery, triggerWidth, toggle, close, onPanelKeydown };
}
