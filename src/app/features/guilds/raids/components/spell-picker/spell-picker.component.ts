import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SpellIconComponent } from '../../../../../shared/components/icons/spell-icon/spell-icon.component';
import { AttributionDefinitionsService } from '../../services/attribution-definitions.service';
import { Spell } from '../../models/spell.model';

/**
 * Search-as-you-type spell picker — debounced server-side search against the seeded spell
 * reference table (there is no bounded client-side list to filter, unlike `app-filter-menu`).
 * Emits the chosen spell; the caller decides what to do with it (pre-fill a label, store the ID).
 */
@Component({
  selector: 'app-spell-picker',
  imports: [CdkMenu, CdkMenuTrigger, SpellIconComponent, TranslocoPipe],
  templateUrl: './spell-picker.component.html',
  styleUrl: './spell-picker.component.scss',
})
export class SpellPickerComponent {
  readonly guildId = input.required<string>();
  readonly expansionId = input.required<number>();
  readonly selected = output<Spell>();

  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly #attributionDefinitionsService = inject(AttributionDefinitionsService);
  readonly #transloco = inject(TranslocoService);

  readonly query = signal('');
  readonly results = signal<Spell[]>([]);
  readonly searching = signal(false);

  #debounceHandle: ReturnType<typeof setTimeout> | undefined;

  onOpened(): void {
    this.query.set('');
    this.results.set([]);
    setTimeout(() => this.searchInputRef()?.nativeElement.focus());
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    clearTimeout(this.#debounceHandle);

    const term = value.trim();
    if (term.length < 2) {
      this.results.set([]);
      return;
    }

    this.#debounceHandle = setTimeout(() => this.#search(term), 250);
  }

  select(spell: Spell): void {
    this.selected.emit(spell);
  }

  #search(term: string): void {
    this.searching.set(true);
    this.#attributionDefinitionsService.searchSpells(this.guildId(), this.expansionId(), term, this.#transloco.getActiveLang()).subscribe({
      next: (spells) => {
        this.results.set(dedupeByNameAndIcon(spells));
        this.searching.set(false);
      },
      error: () => {
        this.results.set([]);
        this.searching.set(false);
      },
    });
  }
}

// The seeded spell table carries every rank plus mob/NPC variants of the same spell, which all
// share the same name and icon — this picker only cares about picking an icon, not a specific
// rank, so collapsing those duplicates down to one entry each makes the results list readable.
function dedupeByNameAndIcon(spells: Spell[]): Spell[] {
  const seen = new Set<string>();
  const deduped: Spell[] = [];
  for (const spell of spells) {
    const key = `${spell.name}|${spell.iconUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(spell);
  }
  return deduped;
}
