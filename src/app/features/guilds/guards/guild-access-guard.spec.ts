import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { guildAccessGuard } from './guild-access-guard';

describe('guildAccessGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guildAccessGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
