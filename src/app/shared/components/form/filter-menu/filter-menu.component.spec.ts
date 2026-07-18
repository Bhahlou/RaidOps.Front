import { TestBed } from '@angular/core/testing';

import { FilterMenuComponent, FilterOption } from './filter-menu.component';

describe('FilterMenuComponent', () => {
  const options: FilterOption<string>[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  const setup = () => {
    TestBed.configureTestingModule({ imports: [FilterMenuComponent] })
      .overrideComponent(FilterMenuComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(FilterMenuComponent);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('allLabel', 'All');
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

  // ── onOpened ──────────────────────────────────────────────────────────────

  describe('onOpened', () => {
    it('clears a stale search query', () => {
      const component = setup();
      component.query.set('beta');

      component.onOpened();

      expect(component.query()).toBe('');
    });
  });
});
