import { TestBed } from '@angular/core/testing';

import { EmptyHintComponent } from './empty-hint.component';

describe('EmptyHintComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({ imports: [EmptyHintComponent] })
      .overrideComponent(EmptyHintComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(EmptyHintComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
