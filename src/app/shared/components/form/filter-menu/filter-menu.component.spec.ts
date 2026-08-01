import { TestBed } from '@angular/core/testing';

import { FilterMenuComponent, FilterOption } from './filter-menu.component';

describe('FilterMenuComponent', () => {
  const options: FilterOption<string>[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  const setup = (multiple = false) => {
    TestBed.configureTestingModule({ imports: [FilterMenuComponent] })
      .overrideComponent(FilterMenuComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(FilterMenuComponent);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('allLabel', 'All');
    fixture.componentRef.setInput('multiple', multiple);
    fixture.componentRef.setInput('label', 'Class');
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── filteredOptions ──────────────────────────────────────────────────────

  describe('filteredOptions', () => {
    it('returns all options when the query is empty', () => {
      expect(setup().filteredOptions()).toEqual(options);
    });

    it('filters options case-insensitively, trimmed', () => {
      const component = setup();
      component.query.set('  BET  ');

      expect(component.filteredOptions()).toEqual([{ value: 'b', label: 'Beta' }]);
    });
  });

  // ── select ────────────────────────────────────────────────────────────────

  describe('select', () => {
    it('sets the selected model to the given value', () => {
      const component = setup();

      component.select('b');

      expect(component.selected()).toBe('b');
    });

    it('sets the selected model to undefined for the "no filter" option', () => {
      const component = setup();
      component.select('b');

      component.select(undefined);

      expect(component.selected()).toBeUndefined();
    });
  });

  // ── hasSelection ─────────────────────────────────────────────────────────

  describe('hasSelection', () => {
    it('is false with no single selection', () => {
      expect(setup().hasSelection()).toBe(false);
    });

    it('is true once a single value is selected', () => {
      const component = setup();
      component.select('a');
      expect(component.hasSelection()).toBe(true);
    });

    it('is false in multiple mode with no selections', () => {
      expect(setup(true).hasSelection()).toBe(false);
    });

    it('is true in multiple mode once at least one value is toggled on', () => {
      const component = setup(true);
      component.toggle('a');
      expect(component.hasSelection()).toBe(true);
    });
  });

  // ── selectedSummary ──────────────────────────────────────────────────────

  describe('selectedSummary', () => {
    it('is undefined with no single selection', () => {
      expect(setup().selectedSummary()).toBeUndefined();
    });

    it('is the selected option label for a single selection', () => {
      const component = setup();
      component.select('b');
      expect(component.selectedSummary()).toBe('Beta');
    });

    it('is null in multiple mode with no selections', () => {
      expect(setup(true).selectedSummary()).toBeNull();
    });

    it('is the label with a count in multiple mode once values are toggled on', () => {
      const component = setup(true);
      component.toggle('a');
      component.toggle('b');
      expect(component.selectedSummary()).toBe('Class (2)');
    });
  });

  // ── isChecked / toggle / clearMany ───────────────────────────────────────

  describe('isChecked / toggle / clearMany', () => {
    it('is unchecked by default', () => {
      expect(setup(true).isChecked('a')).toBe(false);
    });

    it('toggle adds a value', () => {
      const component = setup(true);
      component.toggle('a');
      expect(component.isChecked('a')).toBe(true);
    });

    it('toggle removes an already-selected value', () => {
      const component = setup(true);
      component.toggle('a');
      component.toggle('a');
      expect(component.isChecked('a')).toBe(false);
    });

    it('clearMany resets every selection', () => {
      const component = setup(true);
      component.toggle('a');
      component.toggle('b');

      component.clearMany();

      expect(component.selectedMany()).toEqual([]);
    });
  });

  // ── onOpened ──────────────────────────────────────────────────────────────

  describe('onOpened', () => {
    it('clears a stale search query', () => {
      const component = setup();
      component.query.set('beta');

      component.onOpened();

      expect(component.query()).toBe('');
    });

    it('does not throw with no search input rendered', () => {
      vi.useFakeTimers();
      const component = setup();

      component.onOpened();
      vi.runAllTimers();

      vi.useRealTimers();
      expect(component.query()).toBe('');
    });

    it('focuses the search input once rendered', () => {
      vi.useFakeTimers();
      const component = setup();
      const focus = vi.fn();
      (component as unknown as { searchInputRef: () => { nativeElement: { focus: () => void } } | undefined }).searchInputRef = () => ({
        nativeElement: { focus },
      });

      component.onOpened();
      vi.runAllTimers();

      expect(focus).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
