import { TestBed } from '@angular/core/testing';

import { BnetLinkButtonComponent } from './bnet-link-button.component';
import { REGIONS, REGION_FLAGS } from '../../../constants/bnet-regions';

describe('BnetLinkButtonComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [BnetLinkButtonComponent] })
      .overrideComponent(BnetLinkButtonComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(BnetLinkButtonComponent);
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
});
