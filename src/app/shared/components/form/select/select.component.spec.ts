import { TestBed } from '@angular/core/testing';
import { ListboxValueChangeEvent } from '@angular/cdk/listbox';

import { SelectComponent, SelectOption } from './select.component';

describe('SelectComponent', () => {
  const options: SelectOption<string>[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  const setup = () => {
    TestBed.configureTestingModule({ imports: [SelectComponent] })
      .overrideComponent(SelectComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(SelectComponent<string>);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  // Renders the real template — needed to exercise the branches that read the trigger button's
  // native element (#triggerButton), which never resolves behind the stripped-template setup.
  const setupWithDom = () => {
    TestBed.configureTestingModule({ imports: [SelectComponent] });

    const fixture = TestBed.createComponent(SelectComponent<string>);
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

  // ── selectedLabel ────────────────────────────────────────────────────────

  describe('selectedLabel', () => {
    it('is empty when no option matches the current value', () => {
      expect(setup().selectedLabel()).toBe('');
    });

    it("is the matching option's label", () => {
      const component = setup();
      component.value.set('b');

      expect(component.selectedLabel()).toBe('Beta');
    });
  });

  // ── listboxValue ─────────────────────────────────────────────────────────

  describe('listboxValue', () => {
    it('is an empty array when value is null', () => {
      expect(setup().listboxValue()).toEqual([]);
    });

    it('wraps a non-null value in a single-element array', () => {
      const component = setup();
      component.value.set('a');

      expect(component.listboxValue()).toEqual(['a']);
    });
  });

  // ── toggle ───────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('does nothing while disabled', () => {
      TestBed.configureTestingModule({ imports: [SelectComponent] })
        .overrideComponent(SelectComponent, { set: { template: '', imports: [] } });

      const fixture = TestBed.createComponent(SelectComponent<string>);
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
    it('sets value to the selected item and closes', () => {
      const component = setup();
      component.isOpen.set(true);

      component.onListboxValueChange({ value: ['b'] } as unknown as ListboxValueChangeEvent<string>);

      expect(component.value()).toBe('b');
      expect(component.isOpen()).toBe(false);
    });

    it('sets value to null when the event carries no selection', () => {
      const component = setup();

      component.onListboxValueChange({ value: [] } as unknown as ListboxValueChangeEvent<string>);

      expect(component.value()).toBeNull();
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
