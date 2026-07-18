import { TestBed } from '@angular/core/testing';

import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [CheckboxComponent] })
      .overrideComponent(CheckboxComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(CheckboxComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults checked/indeterminate/disabled to false', () => {
    const component = setup();
    expect(component.checked()).toBe(false);
    expect(component.indeterminate()).toBe(false);
    expect(component.disabled()).toBe(false);
  });

  it('onChange emits the native checkbox checked state', () => {
    const component = setup();
    let emitted: boolean | undefined;
    component.change.subscribe((v: boolean) => { emitted = v; });

    component.onChange({ target: { checked: true } } as unknown as Event);

    expect(emitted).toBe(true);
  });

  // The indeterminate DOM property has no HTML attribute equivalent, so the component pushes it
  // onto the native element imperatively via an effect — only observable through the real DOM.
  it('pushes the indeterminate input onto the native input element', () => {
    TestBed.configureTestingModule({ imports: [CheckboxComponent] });
    const fixture = TestBed.createComponent(CheckboxComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.indeterminate).toBe(false);

    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();

    expect(input.indeterminate).toBe(true);
  });
});
