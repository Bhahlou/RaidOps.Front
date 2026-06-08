import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

import { SidenavComponent } from './sidenav.component';
import { AuthStore } from '../../../core/stores/auth.store';

describe('SidenavComponent', () => {
  let routerEvents$: Subject<unknown>;
  let mockRouter: { events: ReturnType<typeof routerEvents$.asObservable>; url: string };

  const setup = (url = '/home', authenticated = false) => {
    routerEvents$ = new Subject();
    mockRouter = { events: routerEvents$.asObservable(), url };

    TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: { user: signal(null), isAuthenticated: computed(() => authenticated) },
        },
        { provide: Router, useValue: mockRouter },
      ],
    })
    .overrideComponent(SidenavComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(SidenavComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it('isExpanded starts as false', () => {
    expect(setup().isExpanded()).toBe(false);
  });

  it('isAccountOpen starts as true', () => {
    expect(setup().isAccountOpen()).toBe(true);
  });

  // ── isAuthenticated ───────────────────────────────────────────────────────

  it('isAuthenticated is true when store reports authenticated', () => {
    expect(setup('/home', true).isAuthenticated()).toBe(true);
  });

  it('isAuthenticated is false when store reports not authenticated', () => {
    expect(setup('/home', false).isAuthenticated()).toBe(false);
  });

  // ── toggleAccount ─────────────────────────────────────────────────────────

  it('toggleAccount flips isAccountOpen', () => {
    const component = setup();

    component.toggleAccount();
    expect(component.isAccountOpen()).toBe(false);

    component.toggleAccount();
    expect(component.isAccountOpen()).toBe(true);
  });

  // ── isGuildsActive ────────────────────────────────────────────────────────

  it('is false on initial non-guilds URL', () => {
    expect(setup('/home').isGuildsActive()).toBe(false);
  });

  it('is true on initial /guilds URL', () => {
    expect(setup('/guilds/1/dashboard').isGuildsActive()).toBe(true);
  });

  it('is true on initial /no-guild URL', () => {
    expect(setup('/no-guild').isGuildsActive()).toBe(true);
  });

  it('updates to true when navigating to a guilds route', () => {
    const component = setup('/home');

    mockRouter.url = '/guilds/1/dashboard';
    routerEvents$.next(new NavigationEnd(1, '/guilds/1/dashboard', '/guilds/1/dashboard'));

    expect(component.isGuildsActive()).toBe(true);
  });

  it('updates to false when navigating away from guilds', () => {
    const component = setup('/guilds/1');

    mockRouter.url = '/home';
    routerEvents$.next(new NavigationEnd(1, '/home', '/home'));

    expect(component.isGuildsActive()).toBe(false);
  });
});
