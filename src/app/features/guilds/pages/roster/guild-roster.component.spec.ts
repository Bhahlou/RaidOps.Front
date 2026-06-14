import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';

import { GuildRosterComponent } from './guild-roster.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { User } from '../../../../core/models/user.model';

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1', name: 'Epic Guild', iconHash: 'hash1',
  isRegistered: true, isConfigured: true, isAdmin: false,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123', name: 'TestUser', avatarHash: null, guilds,
});

type FakeParamMap = { get: (key: string) => string | null };

const setup = (guildId: string | null, user: User | null = null) => {
  const paramMap$ = new Subject<FakeParamMap>();

  TestBed.configureTestingModule({
    imports: [GuildRosterComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          parent: {
            snapshot: { paramMap: { get: () => guildId } },
            paramMap: paramMap$,
          },
        },
      },
      { provide: AuthStore, useValue: { user: signal(user) } },
    ],
  }).overrideComponent(GuildRosterComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(GuildRosterComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, paramMap$ };
};

describe('GuildRosterComponent', () => {
  it('should create', () => {
    expect(setup('g1').component).toBeTruthy();
  });

  // ── guildId ───────────────────────────────────────────────────────────────

  it('initialises guildId from the parent route snapshot', () => {
    expect(setup('guild-42').component.guildId()).toBe('guild-42');
  });

  it('updates guildId reactively when paramMap emits a new value', () => {
    const { component, paramMap$ } = setup('g1');

    paramMap$.next({ get: () => 'g2' });

    expect(component.guildId()).toBe('g2');
  });

  // ── breadcrumbs() ─────────────────────────────────────────────────────────

  describe('breadcrumbs()', () => {
    it('uses guild name and discordIcon when the user has the matching guild', () => {
      const guild = makeGuild({ id: 'g1', name: 'Epic Guild', iconHash: 'hash1' });
      const crumbs = setup('g1', makeUser([guild])).component.breadcrumbs();

      expect(crumbs[0].label).toBe('Epic Guild');
      expect(crumbs[0].discordIcon).toEqual({ id: 'g1', hash: 'hash1', type: DiscordIconType.Guild });
    });

    it('falls back to "…" label and no discordIcon when user has no matching guild', () => {
      const crumbs = setup('g1').component.breadcrumbs();

      expect(crumbs[0].label).toBe('…');
      expect(crumbs[0].discordIcon).toBeUndefined();
    });

    it('sets i18nKey on the last item for the roster label', () => {
      const crumbs = setup('g1').component.breadcrumbs();

      expect(crumbs.at(-1)?.i18nKey).toBe('sidenav.guild.roster');
    });

    it('links the first item to the guild dashboard', () => {
      const guild = makeGuild({ id: 'g1' });
      const crumbs = setup('g1', makeUser([guild])).component.breadcrumbs();

      expect(crumbs[0].link).toEqual(['/guilds', 'g1', 'dashboard']);
    });

    it('returns exactly two breadcrumb items', () => {
      const crumbs = setup('g1').component.breadcrumbs();

      expect(crumbs.length).toBe(2);
    });
  });
});
