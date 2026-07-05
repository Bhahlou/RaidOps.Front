import { TestBed } from '@angular/core/testing';

import { ManualLayoutComponent } from './manual-layout.component';

describe('ManualLayoutComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      imports: [ManualLayoutComponent],
    }).overrideComponent(ManualLayoutComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ManualLayoutComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
