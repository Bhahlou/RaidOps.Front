import { TestBed } from '@angular/core/testing';

import { GearPlannerComponent } from './gear-planner.component';

describe('GearPlannerComponent', () => {
  it('creates the component', () => {
    TestBed.configureTestingModule({ imports: [GearPlannerComponent] });
    const fixture = TestBed.createComponent(GearPlannerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
