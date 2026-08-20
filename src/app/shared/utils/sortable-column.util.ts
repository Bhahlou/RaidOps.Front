import { signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

/**
 * Click-to-sort column header state shared by sortable table/list components — tracks the active
 * column and direction, flipping asc/desc on repeat clicks and resetting to asc on a new column.
 */
export function createSortableColumn<TColumn extends string>() {
  const column = signal<TColumn | null>(null);
  const direction = signal<SortDirection>('asc');

  function toggle(next: TColumn): void {
    if (column() === next) {
      direction.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      column.set(next);
      direction.set('asc');
    }
  }

  function icon(target: TColumn): string | null {
    if (column() !== target) return null;
    return direction() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  return { column, direction, toggle, icon };
}
