import { TestBed } from '@angular/core/testing';

import { DiscordBrandIconComponent } from './discord-brand-icon.component';

describe('DiscordBrandIconComponent', () => {
  const setup = (size?: number) => {
    TestBed.configureTestingModule({ imports: [DiscordBrandIconComponent] });
    const fixture = TestBed.createComponent(DiscordBrandIconComponent);
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
