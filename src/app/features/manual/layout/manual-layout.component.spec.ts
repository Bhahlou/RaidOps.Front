import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { ManualLayoutComponent } from './manual-layout.component';

describe('ManualLayoutComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({
      imports: [ManualLayoutComponent],
    }).overrideComponent(ManualLayoutComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ManualLayoutComponent);
    fixture.detectChanges();

    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('goBack navigates back via Location', () => {
    const component = setup();
    const backSpy = vi.spyOn(TestBed.inject(Location), 'back');

    component.goBack();

    expect(backSpy).toHaveBeenCalled();
  });
});
