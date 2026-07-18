import { TestBed } from '@angular/core/testing';

import { FormFieldCardComponent } from './form-field-card.component';

describe('FormFieldCardComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [FormFieldCardComponent] })
      .overrideComponent(FormFieldCardComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(FormFieldCardComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults label to undefined', () => {
    expect(setup().label()).toBeUndefined();
  });
});
