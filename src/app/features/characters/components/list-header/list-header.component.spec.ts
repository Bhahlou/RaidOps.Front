import { TestBed } from '@angular/core/testing';

import { ListHeaderComponent } from './list-header.component';

describe('ListHeaderComponent', () => {
  it('creates the component', () => {
    TestBed.configureTestingModule({ imports: [ListHeaderComponent] });
    TestBed.overrideComponent(ListHeaderComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ListHeaderComponent);
    fixture.componentRef.setInput('isBnetLoading', false);
    fixture.componentRef.setInput('isBnetLinked', false);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes REGION_FLAGS for all four regions', () => {
    TestBed.configureTestingModule({ imports: [ListHeaderComponent] });
    TestBed.overrideComponent(ListHeaderComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ListHeaderComponent);
    fixture.componentRef.setInput('isBnetLoading', false);
    fixture.componentRef.setInput('isBnetLinked', false);
    const flags = fixture.componentInstance.regionFlags;
    expect(Object.keys(flags).sort()).toEqual(['eu', 'kr', 'tw', 'us']);
  });
});
