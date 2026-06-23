import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { GetStartedGuildStepComponent } from './get-started-guild-step.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LOCATION } from '../../../../core/tokens/location.token';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { User } from '../../../../core/models/user.model';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';

const guild = (overrides: Partial<UserGuild>): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: false,
  isConfigured: false,
  isAdmin: false,
  accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

describe('GetStartedGuildStepComponent', () => {
  let fixture: ComponentFixture<GetStartedGuildStepComponent>;
  let component: GetStartedGuildStepComponent;
  let userSignal: ReturnType<typeof signal<User | null>>;
  let assign: ReturnType<typeof vi.fn>;
  let loadUser: ReturnType<typeof vi.fn>;

  const setup = (guilds: UserGuild[]) => {
    userSignal = signal<User | null>({ discordId: '1', name: 'Test', avatarHash: null, guilds });
    assign = vi.fn();
    loadUser = vi.fn().mockReturnValue(of(userSignal()));

    TestBed.configureTestingModule({
      imports: [GetStartedGuildStepComponent],
      providers: [
        { provide: AuthStore, useValue: { user: userSignal.asReadonly(), loadUser } },
        { provide: LOCATION, useValue: { assign } },
      ],
    });
    // Strip template and child imports to avoid resolving TranslocoPipe's TRANSLOCO_CONFIG
    // dependency and IconCardComponent's/GuildSettingsFormComponent's own imports in tests.
    TestBed.overrideComponent(GetStartedGuildStepComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GetStartedGuildStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('registeredGuilds', () => {
    it('returns only registered + configured guilds', () => {
      setup([
        guild({ id: 'g1', isRegistered: true, isConfigured: true }),
        guild({ id: 'g2', isRegistered: true, isConfigured: false }),
        guild({ id: 'g3', isRegistered: false }),
      ]);

      expect(component.registeredGuilds().map(g => g.id)).toEqual(['g1']);
    });
  });

  describe('pendingInviteGuilds', () => {
    it('returns admin guilds where the bot is not yet invited', () => {
      setup([
        guild({ id: 'g1', isAdmin: true, isRegistered: false }),
        guild({ id: 'g2', isAdmin: true, isRegistered: true, isConfigured: false }),
        guild({ id: 'g3', isAdmin: true, isRegistered: true, isConfigured: true }),
        guild({ id: 'g4', isAdmin: false, isRegistered: false }),
      ]);

      expect(component.pendingInviteGuilds().map(g => g.id)).toEqual(['g1']);
    });
  });

  describe('pendingSettingsGuilds', () => {
    it('returns admin guilds where the bot is invited but settings are incomplete', () => {
      setup([
        guild({ id: 'g1', isAdmin: true, isRegistered: false }),
        guild({ id: 'g2', isAdmin: true, isRegistered: true, isConfigured: false }),
        guild({ id: 'g3', isAdmin: true, isRegistered: true, isConfigured: true }),
      ]);

      expect(component.pendingSettingsGuilds().map(g => g.id)).toEqual(['g2']);
    });
  });

  describe('when there is no user yet', () => {
    it('returns empty lists instead of throwing', () => {
      setup([guild({ id: 'g1', isRegistered: true, isConfigured: true })]);
      userSignal.set(null);

      expect(component.registeredGuilds()).toEqual([]);
      expect(component.pendingInviteGuilds()).toEqual([]);
      expect(component.pendingSettingsGuilds()).toEqual([]);
      expect(component.hasNoGuild()).toBe(true);
    });
  });

  describe('hasNoGuild', () => {
    it('is true when there are no registered, pending-invite or pending-settings guilds', () => {
      setup([guild({ id: 'g1', isRegistered: false, isAdmin: false })]);
      expect(component.hasNoGuild()).toBe(true);
    });

    it('is false when there is at least one registered guild', () => {
      setup([guild({ id: 'g1', isRegistered: true, isConfigured: true })]);
      expect(component.hasNoGuild()).toBe(false);
    });

    it('is false when there is at least one pending-invite admin guild', () => {
      setup([guild({ id: 'g1', isAdmin: true, isRegistered: false })]);
      expect(component.hasNoGuild()).toBe(false);
    });

    it('is false when there is at least one pending-settings admin guild', () => {
      setup([guild({ id: 'g1', isAdmin: true, isRegistered: true, isConfigured: false })]);
      expect(component.hasNoGuild()).toBe(false);
    });
  });

  describe('inviteBot', () => {
    it('assigns location straight to the backend initiate endpoint with returnTo=get-started', () => {
      setup([]);

      component.inviteBot('g1');

      expect(assign).toHaveBeenCalledWith(expect.stringContaining('/guilds/register/initiate?guildId=g1&returnTo=get-started'));
    });
  });

  describe('onSettingsSaved', () => {
    it('refreshes the user', () => {
      setup([]);

      component.onSettingsSaved();

      expect(loadUser).toHaveBeenCalled();
    });
  });
});
