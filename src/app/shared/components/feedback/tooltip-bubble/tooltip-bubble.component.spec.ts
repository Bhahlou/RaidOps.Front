import { TestBed } from '@angular/core/testing';

import { TooltipBubbleComponent } from './tooltip-bubble.component';

describe('TooltipBubbleComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [TooltipBubbleComponent] })
      .overrideComponent(TooltipBubbleComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(TooltipBubbleComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('defaults text to empty', () => {
    expect(setup().text()).toBe('');
  });
});
