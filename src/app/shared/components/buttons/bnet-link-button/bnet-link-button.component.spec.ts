import { TestBed } from '@angular/core/testing';

import { BnetLinkButtonComponent } from './bnet-link-button.component';
import { REGIONS, REGION_FLAGS } from '../../../constants/bnet-regions';

describe('BnetLinkButtonComponent', () => {
  const setup = (menuAlign?: 'start' | 'end') => {
    TestBed.configureTestingModule({ imports: [BnetLinkButtonComponent] })
      .overrideComponent(BnetLinkButtonComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(BnetLinkButtonComponent);
    if (menuAlign) fixture.componentRef.setInput('menuAlign', menuAlign);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults variant to default', () => {
    expect(setup().variant()).toBe('default');
  });

  it('exposes all regions', () => {
    expect(setup().regions).toEqual(REGIONS);
  });

  it('exposes region flags', () => {
    expect(setup().regionFlags).toEqual(REGION_FLAGS);
  });

  it('emits the selected region via regionSelected', () => {
    const component = setup();
    let emitted: string | undefined;
    component.regionSelected.subscribe((r: string) => { emitted = r; });

    component.regionSelected.emit('eu');

    expect(emitted).toBe('eu');
  });

  // ── menuAlign / menuPosition ─────────────────────────────────────────────────

  describe('menuPosition', () => {
    it('defaults menuAlign to start, aligning the menu to the trigger\'s start edge', () => {
      const component = setup();
      expect(component.menuAlign()).toBe('start');
      expect(component.menuPosition()).toEqual([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
      ]);
    });

    it('aligns the menu to the trigger\'s end edge when menuAlign is set to end', () => {
      const component = setup('end');

      expect(component.menuPosition()).toEqual([
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
      ]);
    });
  });
});
