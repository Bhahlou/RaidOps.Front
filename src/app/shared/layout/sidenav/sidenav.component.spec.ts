import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

import { SidenavComponent } from './sidenav.component';
import { SidenavService } from '../../../core/services/sidenav.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { User } from '../../../core/models/user.model';
import { UserGuild } from '../../../core/models/user-guild.model';
import { GuildAccessLevel } from '../../../core/models/guild-access-level.enum';

const makeGuild = (overrides: Partial<UserGuild>): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: false,
  isConfigured: false,
  isAdmin: false,
  accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds,
  notifications: [],
});

describe('SidenavComponent', () => {
  let routerEvents$: Subject<unknown>;
  let mockRouter: { events: ReturnType<typeof routerEvents$.asObservable>; url: string };

  const setup = (url = '/home', authenticated = false, user: User | null = null) => {
    routerEvents$ = new Subject();
    mockRouter = { events: routerEvents$.asObservable(), url };

    TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: { user: signal(user), isAuthenticated: computed(() => authenticated) },
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

  // ── registeredGuilds ──────────────────────────────────────────────────────

  describe('registeredGuilds', () => {
    it('returns only guilds that are both registered and configured', () => {
      const user = makeUser([
        makeGuild({ id: 'g1', isRegistered: true,  isConfigured: true  }),
        makeGuild({ id: 'g2', isRegistered: true,  isConfigured: false }),
        makeGuild({ id: 'g3', isRegistered: false, isConfigured: true  }),
        makeGuild({ id: 'g4', isRegistered: false, isConfigured: false }),
      ]);
      const component = setup('/home', false, user);

      expect(component.registeredGuilds().map(g => g.id)).toEqual(['g1']);
    });

    it('returns empty array when user is null', () => {
      expect(setup().registeredGuilds()).toEqual([]);
    });
  });

  // ── toggleAccount ─────────────────────────────────────────────────────────

  it('toggleAccount flips isAccountOpen', () => {
    const component = setup();

    component.toggleAccount();
    expect(component.isAccountOpen()).toBe(false);

    component.toggleAccount();
    expect(component.isAccountOpen()).toBe(true);
  });

  // ── toggleGuild ───────────────────────────────────────────────────────────

  describe('toggleGuild', () => {
    it('adds a guild id when not already open', () => {
      const component = setup();
      component.toggleGuild('g1');

      expect(component.openGuildIds().has('g1')).toBe(true);
    });

    it('removes a guild id when already open (toggle off)', () => {
      const component = setup();
      component.toggleGuild('g1');
      component.toggleGuild('g1');

      expect(component.openGuildIds().has('g1')).toBe(false);
    });

    it('manages multiple guild ids independently', () => {
      const component = setup();
      component.toggleGuild('g1');
      component.toggleGuild('g2');
      component.toggleGuild('g1');

      expect(component.openGuildIds().has('g1')).toBe(false);
      expect(component.openGuildIds().has('g2')).toBe(true);
    });
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

  // ── hasRosterAccess ───────────────────────────────────────────────────────

  describe('hasRosterAccess', () => {
    it('is false for a Public-tier guild (e.g. no mapped Discord role)', () => {
      const component = setup();
      expect(component.hasRosterAccess(makeGuild({ accessLevel: GuildAccessLevel.Public }))).toBe(false);
    });

    it('is true for a Roster-tier guild', () => {
      const component = setup();
      expect(component.hasRosterAccess(makeGuild({ accessLevel: GuildAccessLevel.Roster }))).toBe(true);
    });

    it('is true for an Officer-tier guild', () => {
      const component = setup();
      expect(component.hasRosterAccess(makeGuild({ accessLevel: GuildAccessLevel.Officer }))).toBe(true);
    });
  });

  // ── mouse hover ───────────────────────────────────────────────────────────

  describe('onMouseEnter / onMouseLeave', () => {
    it('onMouseEnter expands the sidenav', () => {
      const component = setup();

      component.onMouseEnter();

      expect(component.isExpanded()).toBe(true);
    });

    it('onMouseLeave collapses the sidenav again', () => {
      const component = setup();
      component.onMouseEnter();

      component.onMouseLeave();

      expect(component.isExpanded()).toBe(false);
    });
  });

  // ── onNavClick ────────────────────────────────────────────────────────────

  describe('onNavClick', () => {
    it('closes the mobile drawer when a nav link was clicked', () => {
      const component = setup();
      const closeSpy = vi.spyOn(TestBed.inject(SidenavService), 'close');
      const link = document.createElement('a');
      link.className = 'sidenav-item';
      const child = document.createElement('span');
      link.appendChild(child);

      component.onNavClick({ target: child } as unknown as Event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('does nothing when the click target is outside a nav link', () => {
      const component = setup();
      const closeSpy = vi.spyOn(TestBed.inject(SidenavService), 'close');
      const div = document.createElement('div');

      component.onNavClick({ target: div } as unknown as Event);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  // ── auto-open guild section ───────────────────────────────────────────────

  describe('auto-open effect', () => {
    it('opens the guild section on initial guild route', () => {
      const component = setup('/guilds/g1/dashboard');

      expect(component.openGuildIds().has('g1')).toBe(true);
    });

    it('does not add anything when not on a guild route', () => {
      const component = setup('/home');

      expect(component.openGuildIds().size).toBe(0);
    });

  });
});
