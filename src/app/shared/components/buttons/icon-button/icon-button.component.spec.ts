import { TestBed } from '@angular/core/testing';

import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  const setup = (extraClass?: string) => {
    TestBed.configureTestingModule({ imports: [IconButtonComponent] })
      .overrideComponent(IconButtonComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(IconButtonComponent);
    fixture.componentRef.setInput('icon', 'close');
    if (extraClass !== undefined) fixture.componentRef.setInput('extraClass', extraClass);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults type to button and extraClass to empty', () => {
    const component = setup();
    expect(component.type()).toBe('button');
    expect(component.extraClass()).toBe('');
  });

  it('classes is icon-btn when extraClass is empty', () => {
    expect(setup().classes()).toBe('icon-btn');
  });

  it('classes appends a non-empty extraClass', () => {
    expect(setup('active').classes()).toBe('icon-btn active');
  });
});
