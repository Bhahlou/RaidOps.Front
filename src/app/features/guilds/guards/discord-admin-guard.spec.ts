import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { discordAdminGuard } from './discord-admin-guard';

describe('discordAdminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => discordAdminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
