import { TestBed } from '@angular/core/testing';

import { StepperHeaderComponent, StepItem } from './stepper-header.component';

describe('StepperHeaderComponent', () => {
  const setup = (steps: StepItem[], activeIndex: number) => {
    TestBed.configureTestingModule({ imports: [StepperHeaderComponent] })
      .overrideComponent(StepperHeaderComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(StepperHeaderComponent);
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('activeIndex', activeIndex);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  const steps: StepItem[] = [
    { label: 'One', completed: true },
    { label: 'Two', completed: false },
  ];

  it('should create', () => {
    expect(setup(steps, 1)).toBeTruthy();
  });

  it('exposes the steps input', () => {
    expect(setup(steps, 1).steps()).toEqual(steps);
  });

  it('exposes the activeIndex input', () => {
    expect(setup(steps, 1).activeIndex()).toBe(1);
  });
});
