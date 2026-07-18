import { TestBed } from '@angular/core/testing';
import { computed } from '@angular/core';

import { LoadingBarComponent } from './loading-bar.component';
import { LoadingStore } from '../../../../core/stores/loading.store';

describe('LoadingBarComponent', () => {
  const setup = (isLoading: boolean) => {
    TestBed.configureTestingModule({
      imports: [LoadingBarComponent],
      providers: [
        { provide: LoadingStore, useValue: { isLoading: computed(() => isLoading) } },
      ],
    })
    .overrideComponent(LoadingBarComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(LoadingBarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup(false)).toBeTruthy();
  });

  it('isLoading is true when store reports loading', () => {
    expect(setup(true).isLoading()).toBe(true);
  });

  it('isLoading is false when store reports not loading', () => {
    expect(setup(false).isLoading()).toBe(false);
  });
});
