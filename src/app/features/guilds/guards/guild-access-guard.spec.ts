import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { guildAccessGuard } from './guild-access-guard';

describe('guildAccessGuard', () => {
  const execute = (id: string) => {
    const route = { paramMap: { get: () => id } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guildAccessGuard(route, state));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('allows access', () => {
    expect(execute('any-guild-id')).toBe(true);
  });
});
