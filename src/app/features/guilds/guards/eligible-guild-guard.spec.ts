import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { eligibleGuildGuard } from './eligible-guild-guard';

describe('eligibleGuildGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => eligibleGuildGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
