import { TestBed } from '@angular/core/testing';

import { BnetIconComponent } from './bnet-icon.component';

describe('BnetIconComponent', () => {
  const setup = (size?: number) => {
    TestBed.configureTestingModule({ imports: [BnetIconComponent] });
    const fixture = TestBed.createComponent(BnetIconComponent);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults size to 20', () => {
    expect(setup().size()).toBe(20);
  });

  it('uses the provided size', () => {
    expect(setup(16).size()).toBe(16);
  });
});
