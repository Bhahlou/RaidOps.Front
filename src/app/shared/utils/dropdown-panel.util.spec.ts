import { ElementRef } from '@angular/core';
import { createDropdownPanel } from './dropdown-panel.util';

const elementRef = <T extends HTMLElement>(el: Partial<T>): ElementRef<T> => ({ nativeElement: el as T });

describe('createDropdownPanel', () => {
  // ── toggle ───────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('does nothing while disabled', () => {
      const panel = createDropdownPanel(
        () => true,
        () => undefined,
      );

      panel.toggle();

      expect(panel.isOpen()).toBe(false);
    });

    it('opens the panel, resetting the filter query and reading the trigger width', () => {
      const trigger = elementRef<HTMLButtonElement>({ offsetWidth: 240 } as HTMLButtonElement);
      const panel = createDropdownPanel(
        () => false,
        () => trigger,
      );
      panel.filterQuery.set('stale');

      panel.toggle();

      expect(panel.isOpen()).toBe(true);
      expect(panel.filterQuery()).toBe('');
      expect(panel.triggerWidth()).toBe(240);
    });

    it('falls back to a 200px trigger width when the trigger is not yet rendered', () => {
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );

      panel.toggle();

      expect(panel.triggerWidth()).toBe(200);
    });

    it('closes on a second toggle', () => {
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );
      panel.toggle();

      panel.toggle();

      expect(panel.isOpen()).toBe(false);
    });

    it('does not schedule a filter-input focus when no filter input getter is supplied', () => {
      vi.useFakeTimers();
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );

      expect(() => {
        panel.toggle();
        vi.runAllTimers();
      }).not.toThrow();

      vi.useRealTimers();
    });

    it('focuses the filter input on open when a filter input getter is supplied', () => {
      vi.useFakeTimers();
      const focus = vi.fn();
      const filterInput = elementRef<HTMLInputElement>({ focus } as unknown as HTMLInputElement);
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
        () => filterInput,
      );

      panel.toggle();
      vi.runAllTimers();

      expect(focus).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('does not throw when the filter input getter resolves to undefined at focus time', () => {
      vi.useFakeTimers();
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
        () => undefined,
      );

      expect(() => {
        panel.toggle();
        vi.runAllTimers();
      }).not.toThrow();

      vi.useRealTimers();
    });
  });

  // ── close ────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('closes an open panel', () => {
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );
      panel.toggle();

      panel.close();

      expect(panel.isOpen()).toBe(false);
    });
  });

  // ── onPanelKeydown ───────────────────────────────────────────────────────

  describe('onPanelKeydown', () => {
    it('closes the panel and refocuses the trigger on Escape', () => {
      const focus = vi.fn();
      const trigger = elementRef<HTMLButtonElement>({ offsetWidth: 200, focus } as unknown as HTMLButtonElement);
      const panel = createDropdownPanel(
        () => false,
        () => trigger,
      );
      panel.toggle();

      panel.onPanelKeydown({ key: 'Escape' } as KeyboardEvent);

      expect(panel.isOpen()).toBe(false);
      expect(focus).toHaveBeenCalled();
    });

    it('does not throw when the trigger is not rendered on Escape', () => {
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );
      panel.toggle();

      expect(() => panel.onPanelKeydown({ key: 'Escape' } as KeyboardEvent)).not.toThrow();
    });

    it('ignores any other key', () => {
      const panel = createDropdownPanel(
        () => false,
        () => undefined,
      );
      panel.toggle();

      panel.onPanelKeydown({ key: 'Enter' } as KeyboardEvent);

      expect(panel.isOpen()).toBe(true);
    });
  });
});
