import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LOCATION } from '../../../../core/tokens/location.token';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { User } from '../../../../core/models/user.model';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';

const makeGuild = (id: string, overrides?: Partial<UserGuild>): UserGuild => ({
  id,
  name: `Guild ${id}`,
  iconHash: null,
  isRegistered: false,
  isConfigured: false,
  isAdmin: true,
  accessLevel: GuildAccessLevel.Officer,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds,
  notifications: [],
});

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;

  const setup = (
    guildId: string | null,
    guilds: UserGuild[] = [],
    loadUserFn?: () => Observable<unknown>,
  ) => {
    navigate = vi.fn().mockResolvedValue(true);
    assign = vi.fn();

    const initialUser = guilds.length ? makeUser(guilds) : null;
    const userSignal = signal<User | null>(initialUser);
    const loadUser = loadUserFn ?? (() => of(initialUser));

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthStore, useValue: { user: userSignal.asReadonly(), loadUser } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => guildId } } } },
        { provide: Router, useValue: { navigate } },
        { provide: LOCATION, useValue: { assign } },
      ],
    })
    .overrideComponent(RegisterComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  // ── guild computed ────────────────────────────────────────────────────────

  describe('guild', () => {
    it('resolves the guild matching the route id', () => {
      const g = makeGuild('abc');
      setup('abc', [g, makeGuild('other')]);

      expect(component.guild()).toEqual(g);
    });

    it('returns null when id does not match any guild', () => {
      setup('unknown', [makeGuild('abc')]);

      expect(component.guild()).toBeNull();
    });

    it('returns null when route has no id', () => {
      setup(null, [makeGuild('abc')]);

      expect(component.guild()).toBeNull();
    });
  });

  // ── breadcrumbs ───────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the user name, a discord icon, and the guild name when both resolve', () => {
      setup('abc', [makeGuild('abc', { name: 'My Guild' })]);

      const [first, , last] = component.breadcrumbs();

      expect(first.label).toBe('TestUser');
      expect(first.discordIcon).toEqual({ id: '123', hash: null, type: component.DiscordIconType.User });
      expect(last).toEqual({ label: 'My Guild' });
    });

    it('falls back to placeholder labels with no icon when there is no user or guild', () => {
      setup('unknown', []);

      const [first, , last] = component.breadcrumbs();

      expect(first.label).toBe('…');
      expect(first.discordIcon).toBeUndefined();
      expect(last).toEqual({ label: '…' });
    });

    it('always includes the guilds list crumb linking back to /guilds', () => {
      setup('abc', [makeGuild('abc')]);

      expect(component.breadcrumbs()[1]).toEqual({ i18nKey: 'sidenav.guilds', link: ['/guilds'] });
    });
  });

  // ── isAlreadyConfigured computed ──────────────────────────────────────────

  describe('isAlreadyConfigured', () => {
    it('is true when the guild is configured', () => {
      setup('abc', [makeGuild('abc', { isConfigured: true })]);

      expect(component.isAlreadyConfigured()).toBe(true);
    });

    it('is false when the guild is not configured', () => {
      setup('abc', [makeGuild('abc', { isConfigured: false })]);

      expect(component.isAlreadyConfigured()).toBe(false);
    });

    it('is false when there is no matching guild', () => {
      setup('unknown', []);

      expect(component.isAlreadyConfigured()).toBe(false);
    });
  });

  // ── stepIndex computed ────────────────────────────────────────────────────

  describe('stepIndex', () => {
    it('is 0 when the guild is not yet registered', () => {
      setup('abc', [makeGuild('abc', { isRegistered: false })]);

      expect(component.stepIndex()).toBe(0);
    });

    it('is 1 when the guild is registered', () => {
      setup('abc', [makeGuild('abc', { isRegistered: true })]);

      expect(component.stepIndex()).toBe(1);
    });
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('redirects to /no-guild when guild is not found', () => {
      setup('unknown', [makeGuild('abc')]);

      expect(navigate).toHaveBeenCalledWith(['/no-guild']);
    });

    it('redirects to dashboard when guild is already configured', () => {
      setup('abc', [makeGuild('abc', { isRegistered: true, isConfigured: true })]);

      expect(navigate).toHaveBeenCalledWith(['/guilds', 'abc', 'dashboard']);
    });

    it('does not redirect when guild is found but not yet configured', () => {
      setup('abc', [makeGuild('abc')]);

      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not redirect when guild was configured but is no longer registered (bot removed)', () => {
      setup('abc', [makeGuild('abc', { isRegistered: false, isConfigured: true })]);

      expect(navigate).not.toHaveBeenCalled();
    });

    it('redirects to /no-guild and clears loading on loadUser error', () => {
      setup('abc', [makeGuild('abc')], () => throwError(() => new Error('auth failed')));

      expect(navigate).toHaveBeenCalledWith(['/no-guild']);
      expect(component.loading()).toBe(false);
    });
  });

  // ── initiateRegistration ──────────────────────────────────────────────────

  describe('initiateRegistration', () => {
    it('navigates to the registration initiate URL for the guild', () => {
      setup('abc', [makeGuild('abc')]);

      component.initiateRegistration();

      expect(assign).toHaveBeenCalledWith(expect.stringContaining('/guilds/register/initiate?guildId=abc'));
    });
  });

  // ── onSettingsSaved ───────────────────────────────────────────────────────

  describe('onSettingsSaved', () => {
    it('navigates to the guild dashboard', () => {
      setup('abc', [makeGuild('abc')]);

      component.onSettingsSaved();

      expect(navigate).toHaveBeenCalledWith(['/guilds', 'abc', 'dashboard']);
    });
  });
});
