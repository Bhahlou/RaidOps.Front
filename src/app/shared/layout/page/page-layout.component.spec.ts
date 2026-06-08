import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { PageLayoutComponent } from './page-layout.component';
import { AuthStore } from '../../../core/stores/auth.store';

describe('PageLayoutComponent', () => {
  const setup = (authenticated: boolean) => {
    const isAuthenticated = signal(authenticated);

    TestBed.configureTestingModule({
      imports: [PageLayoutComponent],
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: isAuthenticated.asReadonly() } },
      ],
    })
    .overrideComponent(PageLayoutComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(PageLayoutComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup(false)).toBeTruthy();
  });

  it('isAuthenticated is true when store reports authenticated', () => {
    expect(setup(true).isAuthenticated()).toBe(true);
  });

  it('isAuthenticated is false when store reports not authenticated', () => {
    expect(setup(false).isAuthenticated()).toBe(false);
  });
});
