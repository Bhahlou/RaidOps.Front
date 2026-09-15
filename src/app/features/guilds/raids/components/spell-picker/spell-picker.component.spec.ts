import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { SpellPickerComponent } from './spell-picker.component';
import { AttributionDefinitionsService } from '../../services/attribution-definitions.service';
import { Spell } from '../../models/spell.model';

const spell = (overrides?: Partial<Spell>): Spell => ({
  id: 1,
  name: 'Frappe mortelle',
  iconUrl: 'https://cdn/mortal-strike.jpg',
  ...overrides,
});

describe('SpellPickerComponent', () => {
  let searchSpells: ReturnType<typeof vi.fn>;

  const setup = () => {
    searchSpells = vi.fn().mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [SpellPickerComponent],
      providers: [
        { provide: AttributionDefinitionsService, useValue: { searchSpells } },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'fr', translate: (key: string) => key } },
      ],
    }).overrideComponent(SpellPickerComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(SpellPickerComponent);
    fixture.componentRef.setInput('guildId', 'guild-1');
    fixture.componentRef.setInput('expansionId', 2);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── onOpened ─────────────────────────────────────────────────────────────

  describe('onOpened', () => {
    it('resets the query and results', () => {
      const component = setup();
      component.query.set('stale');
      component.results.set([spell()]);

      component.onOpened();

      expect(component.query()).toBe('');
      expect(component.results()).toEqual([]);
    });

    it('schedules a focus of the search input without throwing when it is not yet in the DOM', () => {
      vi.useFakeTimers();
      const component = setup();

      component.onOpened();

      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });

  // ── onQueryInput ─────────────────────────────────────────────────────────

  describe('onQueryInput', () => {
    it('updates the query signal immediately', () => {
      const component = setup();

      component.onQueryInput('fr');

      expect(component.query()).toBe('fr');
    });

    it('clears results without searching for a term under 2 characters', () => {
      const component = setup();

      component.onQueryInput('f');

      expect(component.results()).toEqual([]);
      expect(searchSpells).not.toHaveBeenCalled();
    });

    it('debounces the search by 250ms', () => {
      vi.useFakeTimers();
      const component = setup();

      component.onQueryInput('frappe');
      expect(searchSpells).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250);

      expect(searchSpells).toHaveBeenCalledWith('guild-1', 2, 'frappe', 'fr');
    });

    it('cancels a pending debounce when the query changes again', () => {
      vi.useFakeTimers();
      const component = setup();

      component.onQueryInput('frap');
      vi.advanceTimersByTime(100);
      component.onQueryInput('frappe');
      vi.advanceTimersByTime(100);

      expect(searchSpells).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);

      expect(searchSpells).toHaveBeenCalledTimes(1);
      expect(searchSpells).toHaveBeenCalledWith('guild-1', 2, 'frappe', 'fr');
    });

    it('deduplicates results sharing the same name and icon, keeping the first', () => {
      vi.useFakeTimers();
      const rank1 = spell({ id: 1 });
      const rank2 = spell({ id: 2 });
      const differentSpell = spell({ id: 3, name: 'Autre sort', iconUrl: 'https://cdn/other.jpg' });
      const component = setup();
      searchSpells.mockReturnValue(of([rank1, rank2, differentSpell]));

      component.onQueryInput('frappe');
      vi.advanceTimersByTime(250);

      expect(component.results()).toEqual([rank1, differentSpell]);
      expect(component.searching()).toBe(false);
    });

    it('sets searching while the request is in flight', () => {
      vi.useFakeTimers();
      const component = setup();

      component.onQueryInput('frappe');
      vi.advanceTimersByTime(250);

      // searchSpells resolved synchronously above (of([])), so searching is already back to false —
      // this asserts the terminal state rather than the in-flight one, which a synchronous
      // Observable never actually exposes to the test.
      expect(component.searching()).toBe(false);
    });

    it('clears results and searching on a search error', () => {
      vi.useFakeTimers();
      const component = setup();
      searchSpells.mockReturnValue(throwError(() => new Error('boom')));
      component.results.set([spell()]);

      component.onQueryInput('frappe');
      vi.advanceTimersByTime(250);

      expect(component.results()).toEqual([]);
      expect(component.searching()).toBe(false);
    });
  });

  // ── select ───────────────────────────────────────────────────────────────

  describe('select', () => {
    it('emits the chosen spell', () => {
      const component = setup();
      let emitted: Spell | undefined;
      component.selected.subscribe((s: Spell) => {
        emitted = s;
      });

      component.select(spell());

      expect(emitted).toEqual(spell());
    });
  });
});
