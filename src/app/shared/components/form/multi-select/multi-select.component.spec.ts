import { TestBed } from '@angular/core/testing';
import { ListboxValueChangeEvent } from '@angular/cdk/listbox';

import { MultiSelectComponent, MultiSelectOption } from './multi-select.component';

describe('MultiSelectComponent', () => {
  const options: MultiSelectOption<string>[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ];

  const setup = () => {
    TestBed.configureTestingModule({ imports: [MultiSelectComponent] })
      .overrideComponent(MultiSelectComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(MultiSelectComponent<string>);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  // Renders the real template — needed to exercise the branches that read the trigger button's
  // native element (#triggerButton), which never resolves behind the stripped-template setup.
  const setupWithDom = () => {
    TestBed.configureTestingModule({ imports: [MultiSelectComponent] });

    const fixture = TestBed.createComponent(MultiSelectComponent<string>);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── filteredOptions ──────────────────────────────────────────────────────

  describe('filteredOptions', () => {
    it('returns all options when the filter query is empty', () => {
      expect(setup().filteredOptions()).toEqual(options);
    });

    it('filters options case-insensitively, trimmed', () => {
      const component = setup();
      component.filterQuery.set('  bet  ');

      expect(component.filteredOptions()).toEqual([{ value: 'b', label: 'Beta' }]);
    });
  });

  // ── groupedOptions ───────────────────────────────────────────────────────

  describe('groupedOptions', () => {
    it('folds all options into a single null-group when none carry a group', () => {
      expect(setup().groupedOptions()).toEqual([{ group: null, options }]);
    });

    it('folds consecutive same-group options into one group entry', () => {
      TestBed.configureTestingModule({ imports: [MultiSelectComponent] })
        .overrideComponent(MultiSelectComponent, { set: { template: '', imports: [] } });

      const fixture = TestBed.createComponent(MultiSelectComponent<string>);
      const grouped: MultiSelectOption<string>[] = [
        { value: 'a', label: 'Alpha', group: 'Cat 1' },
        { value: 'b', label: 'Beta', group: 'Cat 1' },
        { value: 'c', label: 'Gamma', group: 'Cat 2' },
      ];
      fixture.componentRef.setInput('options', grouped);
      fixture.detectChanges();

      expect(fixture.componentInstance.groupedOptions()).toEqual([
        { group: 'Cat 1', options: [grouped[0], grouped[1]] },
        { group: 'Cat 2', options: [grouped[2]] },
      ]);
    });

    it('is empty when there are no options', () => {
      TestBed.configureTestingModule({ imports: [MultiSelectComponent] })
        .overrideComponent(MultiSelectComponent, { set: { template: '', imports: [] } });

      const fixture = TestBed.createComponent(MultiSelectComponent<string>);
      fixture.componentRef.setInput('options', []);
      fixture.detectChanges();

      expect(fixture.componentInstance.groupedOptions()).toEqual([]);
    });
  });

  // ── selectedLabel ────────────────────────────────────────────────────────

  describe('selectedLabel', () => {
    it('is empty when nothing is selected', () => {
      expect(setup().selectedLabel()).toBe('');
    });

    it("is the matching option's label for a single selection", () => {
      const component = setup();
      component.value.set(['b']);

      expect(component.selectedLabel()).toBe('Beta');
    });

    it('joins multiple selected labels in options order, not selection order', () => {
      const component = setup();
      component.value.set(['c', 'a']);

      expect(component.selectedLabel()).toBe('Alpha, Gamma');
    });

    it('ignores selected values that no longer match an option', () => {
      const component = setup();
      component.value.set(['a', 'stale-value']);

      expect(component.selectedLabel()).toBe('Alpha');
    });
  });

  // ── isSelected ───────────────────────────────────────────────────────────

  describe('isSelected', () => {
    it('is false when the option is not in value', () => {
      const component = setup();

      expect(component.isSelected(options[0])).toBe(false);
    });

    it('is true when the option is in value', () => {
      const component = setup();
      component.value.set(['a']);

      expect(component.isSelected(options[0])).toBe(true);
    });
  });

  // ── toggle ───────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('does nothing while disabled', () => {
      TestBed.configureTestingModule({ imports: [MultiSelectComponent] })
        .overrideComponent(MultiSelectComponent, { set: { template: '', imports: [] } });

      const fixture = TestBed.createComponent(MultiSelectComponent<string>);
      fixture.componentRef.setInput('options', options);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      fixture.componentInstance.toggle();

      expect(fixture.componentInstance.isOpen()).toBe(false);
    });

    it('opens, resets the filter query, and falls back triggerWidth to 200 with no DOM trigger', () => {
      const component = setup();
      component.filterQuery.set('stale');

      component.toggle();

      expect(component.isOpen()).toBe(true);
      expect(component.filterQuery()).toBe('');
      expect(component.triggerWidth()).toBe(200);
    });

    it('closes without touching the filter query or triggerWidth', () => {
      const component = setup();
      component.toggle(); // open
      component.filterQuery.set('kept');
      component.triggerWidth.set(321);

      component.toggle(); // close

      expect(component.isOpen()).toBe(false);
      expect(component.filterQuery()).toBe('kept');
      expect(component.triggerWidth()).toBe(321);
    });

    it('reads the real trigger button width when opening with the DOM present', () => {
      const component = setupWithDom();

      component.toggle();

      expect(component.isOpen()).toBe(true);
      expect(component.triggerWidth()).toBe(0); // jsdom/happy-dom report 0 layout width
    });
  });

  // ── close ────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('sets isOpen to false', () => {
      const component = setup();
      component.isOpen.set(true);

      component.close();

      expect(component.isOpen()).toBe(false);
    });
  });

  // ── onListboxValueChange ─────────────────────────────────────────────────

  describe('onListboxValueChange', () => {
    it('sets value to the full selection without closing the panel', () => {
      const component = setup();
      component.isOpen.set(true);

      component.onListboxValueChange({ value: ['a', 'b'] } as unknown as ListboxValueChangeEvent<string>);

      expect(component.value()).toEqual(['a', 'b']);
      expect(component.isOpen()).toBe(true);
    });

    it('sets value to an empty array when the event carries no selection', () => {
      const component = setup();
      component.value.set(['a']);

      component.onListboxValueChange({ value: [] } as unknown as ListboxValueChangeEvent<string>);

      expect(component.value()).toEqual([]);
    });
  });

  // ── onPanelKeydown ───────────────────────────────────────────────────────

  describe('onPanelKeydown', () => {
    it('ignores non-Escape keys', () => {
      const component = setup();
      component.isOpen.set(true);

      component.onPanelKeydown({ key: 'Enter' } as KeyboardEvent);

      expect(component.isOpen()).toBe(true);
    });

    it('closes on Escape with no DOM trigger to refocus', () => {
      const component = setup();
      component.isOpen.set(true);

      component.onPanelKeydown({ key: 'Escape' } as KeyboardEvent);

      expect(component.isOpen()).toBe(false);
    });

    it('closes and refocuses the real trigger button on Escape', () => {
      const component = setupWithDom();
      component.isOpen.set(true);

      component.onPanelKeydown({ key: 'Escape' } as KeyboardEvent);

      expect(component.isOpen()).toBe(false);
    });
  });
});
