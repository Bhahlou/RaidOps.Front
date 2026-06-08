import { TestBed } from '@angular/core/testing';

import { IconCardComponent } from './icon-card.component';

describe('IconCardComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [IconCardComponent] })
      .overrideComponent(IconCardComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(IconCardComponent);
    fixture.componentRef.setInput('icon', 'star');
    fixture.componentRef.setInput('title', 'Test title');
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults appearance to outlined', () => {
    expect(setup().appearance()).toBe('outlined');
  });
});
