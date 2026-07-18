import { TestBed } from '@angular/core/testing';

import { SidenavService } from './sidenav.service';

describe('SidenavService', () => {
  const setup = () => TestBed.inject(SidenavService);

  it('starts closed', () => {
    expect(setup().isMobileOpen()).toBe(false);
  });

  it('toggle flips the open state', () => {
    const service = setup();

    service.toggle();
    expect(service.isMobileOpen()).toBe(true);

    service.toggle();
    expect(service.isMobileOpen()).toBe(false);
  });

  it('close sets the state to false regardless of current state', () => {
    const service = setup();
    service.toggle();

    service.close();

    expect(service.isMobileOpen()).toBe(false);
  });
});
