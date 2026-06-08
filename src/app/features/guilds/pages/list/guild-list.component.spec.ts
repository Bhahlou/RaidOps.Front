import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { GuildListComponent } from './guild-list.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { User } from '../../../../core/models/user.model';

const guild = (overrides: Partial<UserGuild>): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: false,
  isAdmin: false,
  ...overrides,
});

const user = (guilds: UserGuild[]): User => ({
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds,
});

describe('GuildListComponent', () => {
  let fixture: ComponentFixture<GuildListComponent>;
  let component: GuildListComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let userSignal: ReturnType<typeof signal<User | null>>;

  const setup = (guilds: UserGuild[] | null = []) => {
    navigate = vi.fn().mockResolvedValue(true);
    const initialUser = guilds !== null ? user(guilds) : null;
    userSignal = signal<User | null>(initialUser);

    TestBed.configureTestingModule({
      imports: [GuildListComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: { user: userSignal.asReadonly(), loadUser: () => of(initialUser) },
        },
        { provide: Router, useValue: { navigate } },
      ],
    })
    .overrideComponent(GuildListComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildListComponent);
    component = fixture.componentInstance;
  };

  // ── computed signals ──────────────────────────────────────────────────────

  describe('registeredGuilds', () => {
    it('returns only registered guilds', () => {
      setup([
        guild({ id: 'g1', isRegistered: true }),
        guild({ id: 'g2', isRegistered: false }),
      ]);
      fixture.detectChanges();

      expect(component.registeredGuilds().map(g => g.id)).toEqual(['g1']);
    });

    it('returns empty array when user has no registered guilds', () => {
      setup([guild({ isRegistered: false })]);
      fixture.detectChanges();

      expect(component.registeredGuilds()).toEqual([]);
    });

    it('returns empty array when user is null', () => {
      setup(null);
      fixture.detectChanges();

      expect(component.registeredGuilds()).toEqual([]);
    });
  });

  describe('adminGuilds', () => {
    it('returns guilds where user is admin and guild is not registered', () => {
      setup([
        guild({ id: 'g1', isAdmin: true, isRegistered: false }),
        guild({ id: 'g2', isAdmin: true, isRegistered: true }),
        guild({ id: 'g3', isAdmin: false, isRegistered: false }),
      ]);
      fixture.detectChanges();

      expect(component.adminGuilds().map(g => g.id)).toEqual(['g1']);
    });

    it('returns empty array when user is null', () => {
      setup(null);
      fixture.detectChanges();

      expect(component.adminGuilds()).toEqual([]);
    });
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('starts with loading=true, then sets it to false after loadUser emits', () => {
      setup([]);

      expect(component.loading()).toBe(true);
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('auto-navigates to dashboard when exactly one registered guild and no admin guilds', () => {
      setup([guild({ id: 'g1', isRegistered: true })]);
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledWith(['/guilds', 'g1', 'dashboard']);
    });

    it('does not auto-navigate when there are multiple registered guilds', () => {
      setup([
        guild({ id: 'g1', isRegistered: true }),
        guild({ id: 'g2', isRegistered: true }),
      ]);
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not auto-navigate when there is one registered guild but also admin guilds', () => {
      setup([
        guild({ id: 'g1', isRegistered: true }),
        guild({ id: 'g2', isAdmin: true, isRegistered: false }),
      ]);
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not auto-navigate when there are no registered guilds', () => {
      setup([]);
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
