import { TestBed } from '@angular/core/testing';

import { DialogStateComponent } from './dialog-state.component';

describe('DialogStateComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [DialogStateComponent] })
      .overrideComponent(DialogStateComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(DialogStateComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults variant to info', () => {
    expect(setup().variant()).toBe('info');
  });

  it('defaults icon to empty', () => {
    expect(setup().icon()).toBe('');
  });

  it('defaults message to empty', () => {
    expect(setup().message()).toBe('');
  });
});
