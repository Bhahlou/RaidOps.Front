import { TestBed } from '@angular/core/testing';

import { DateRangeInputComponent } from './date-range-input.component';

describe('DateRangeInputComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [DateRangeInputComponent] })
      .overrideComponent(DateRangeInputComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(DateRangeInputComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── dateInputValue ───────────────────────────────────────────────────────

  describe('dateInputValue', () => {
    it('returns an empty string for null', () => {
      expect(setup().dateInputValue(null)).toBe('');
    });

    it('formats a date as YYYY-MM-DD, zero-padded', () => {
      expect(setup().dateInputValue(new Date(2024, 0, 5))).toBe('2024-01-05');
    });
  });

  // ── onStartInput / onEndInput ────────────────────────────────────────────

  describe('onStartInput', () => {
    it('emits null for an empty value', () => {
      const component = setup();
      let emitted: Date | null | undefined;
      component.startChange.subscribe((v: Date | null) => { emitted = v; });

      component.onStartInput('');

      expect(emitted).toBeNull();
    });

    it('emits the parsed date for a non-empty value', () => {
      const component = setup();
      let emitted: Date | null | undefined;
      component.startChange.subscribe((v: Date | null) => { emitted = v; });

      component.onStartInput('2024-03-15');

      expect(emitted?.getFullYear()).toBe(2024);
      expect(emitted?.getMonth()).toBe(2);
      expect(emitted?.getDate()).toBe(15);
    });
  });

  describe('onEndInput', () => {
    it('emits null for an empty value', () => {
      const component = setup();
      let emitted: Date | null | undefined;
      component.endChange.subscribe((v: Date | null) => { emitted = v; });

      component.onEndInput('');

      expect(emitted).toBeNull();
    });

    it('emits the parsed date for a non-empty value', () => {
      const component = setup();
      let emitted: Date | null | undefined;
      component.endChange.subscribe((v: Date | null) => { emitted = v; });

      component.onEndInput('2024-03-15');

      expect(emitted?.getFullYear()).toBe(2024);
      expect(emitted?.getMonth()).toBe(2);
      expect(emitted?.getDate()).toBe(15);
    });
  });
});
