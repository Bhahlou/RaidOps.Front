import { TestBed } from '@angular/core/testing';

import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [ToastComponent] })
      .overrideComponent(ToastComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults message to empty', () => {
    expect(setup().message()).toBe('');
  });

  it('defaults variant to info', () => {
    expect(setup().variant()).toBe('info');
  });
});
