import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LOCATION } from '../../../../core/tokens/location.token';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { User } from '../../../../core/models/user.model';

const makeGuild = (id: string, overrides?: Partial<UserGuild>): UserGuild => ({
  id,
  name: `Guild ${id}`,
  iconHash: null,
  isRegistered: false,
  isConfigured: false,
  isAdmin: true,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds,
});

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;

  const setup = (guildId: string | null, guilds: UserGuild[] = []) => {
    navigate = vi.fn().mockResolvedValue(true);
    assign = vi.fn();

    const initialUser = guilds.length ? makeUser(guilds) : null;
    const userSignal = signal<User | null>(initialUser);

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthStore, useValue: { user: userSignal.asReadonly(), loadUser: () => of(initialUser) } },
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

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('redirects to /no-guild when guild is not found', () => {
      setup('unknown', [makeGuild('abc')]);

      expect(navigate).toHaveBeenCalledWith(['/no-guild']);
    });

    it('does not redirect when guild is found', () => {
      setup('abc', [makeGuild('abc')]);

      expect(navigate).not.toHaveBeenCalled();
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
});
