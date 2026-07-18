import { TestBed } from '@angular/core/testing';

import { UnderConstructionComponent } from './under-construction.component';

describe('UnderConstructionComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({ imports: [UnderConstructionComponent] })
      .overrideComponent(UnderConstructionComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(UnderConstructionComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
