import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Overlay } from '@angular/cdk/overlay';

import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<button [appTooltip]="text()">Hi</button>`,
})
class HostComponent {
  readonly text = signal('Hello there');
}

describe('TooltipDirective', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement.query(By.directive(TooltipDirective))
      .injector.get(TooltipDirective);
    return { fixture, host: fixture.componentInstance, directive };
  };

  it('should create', () => {
    expect(setup().directive).toBeTruthy();
  });

  describe('show', () => {
    it('does nothing when the tooltip text is empty', () => {
      const { fixture, host, directive } = setup();
      host.text.set('');
      fixture.detectChanges();
      const createSpy = vi.spyOn(TestBed.inject(Overlay), 'create');

      directive.show();

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('attaches an overlay with the tooltip bubble', () => {
      const { directive } = setup();
      const createSpy = vi.spyOn(TestBed.inject(Overlay), 'create');

      directive.show();

      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('is a no-op while already shown', () => {
      const { directive } = setup();
      const createSpy = vi.spyOn(TestBed.inject(Overlay), 'create');

      directive.show();
      directive.show();

      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('hide', () => {
    it('does nothing when nothing is shown', () => {
      const { directive } = setup();

      expect(() => directive.hide()).not.toThrow();
    });

    it('disposes the overlay and allows show() to create a new one afterward', () => {
      const { directive } = setup();
      const createSpy = vi.spyOn(TestBed.inject(Overlay), 'create');

      directive.show();
      directive.hide();
      directive.show();

      expect(createSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('hides the tooltip', () => {
      const { fixture, directive } = setup();
      directive.show();

      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
