import { TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [HomeComponent] })
      .overrideComponent(HomeComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('exposes 6 feature items', () => {
    const component = setup() as unknown as { features: unknown[] };
    expect(component.features.length).toBe(6);
  });
});
