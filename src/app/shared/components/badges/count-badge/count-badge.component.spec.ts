import { TestBed } from '@angular/core/testing';

import { CountBadgeComponent } from './count-badge.component';

describe('CountBadgeComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [CountBadgeComponent] })
      .overrideComponent(CountBadgeComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(CountBadgeComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults count to 0', () => {
    expect(setup().count()).toBe(0);
  });
});
