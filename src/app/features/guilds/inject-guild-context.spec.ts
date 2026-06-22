import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { injectGuildContext } from './inject-guild-context';
import { AuthStore } from '../../core/stores/auth.store';
import { DiscordIconType } from '../../shared/models/discord-icon-type.enum';
import { UserGuild } from '../../core/models/user-guild.model';
import { User } from '../../core/models/user.model';

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1', name: 'Epic Guild', iconHash: 'hash1',
  isRegistered: true, isConfigured: true, isAdmin: false,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123', name: 'TestUser', avatarHash: null, guilds,
});

const setup = (
  guildId: string | null,
  user: User | null = null,
  paramMap$: Observable<ParamMap> = of(convertToParamMap(guildId ? { id: guildId } : {})),
) => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          parent: { snapshot: { paramMap: { get: () => guildId } }, paramMap: paramMap$ },
        },
      },
      { provide: AuthStore, useValue: { user: signal(user) } },
    ],
  });
  return TestBed.runInInjectionContext(() => injectGuildContext());
};

describe('injectGuildContext', () => {

  // ── guildId ─────────────────────────────────────────────────────────────────

  it('reads guildId from the parent route snapshot', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  // ── currentGuildId ────────────────────────────────────────────────────────────

  describe('currentGuildId', () => {
    it('starts at the snapshot value', () => {
      expect(setup('g1').currentGuildId()).toBe('g1');
    });

    it('updates when the parent paramMap emits a different id', () => {
      const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1' }));
      const context = setup('g1', null, paramMap$);

      paramMap$.next(convertToParamMap({ id: 'g2' }));

      expect(context.currentGuildId()).toBe('g2');
    });
  });

  // ── breadcrumbs — guild resolution ──────────────────────────────────────────

  it('uses the guild name and discordIcon when the user has the matching guild', () => {
    const guild = makeGuild({ id: 'g1', name: 'Epic Guild', iconHash: 'hash1' });
    const crumbs = setup('g1', makeUser([guild])).breadcrumbs('sidenav.guild.settings');

    expect(crumbs[0].label).toBe('Epic Guild');
    expect(crumbs[0].discordIcon).toEqual({ id: 'g1', hash: 'hash1', type: DiscordIconType.Guild });
  });

  it('falls back to "…" label and no discordIcon when the user has no matching guild', () => {
    const crumbs = setup('g1').breadcrumbs('sidenav.guild.settings');

    expect(crumbs[0].label).toBe('…');
    expect(crumbs[0].discordIcon).toBeUndefined();
  });

  it('reflects the new guild after the parent paramMap emits a different id', () => {
    const guildA = makeGuild({ id: 'g1', name: 'Guild A' });
    const guildB = makeGuild({ id: 'g2', name: 'Guild B' });
    const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1' }));
    const context = setup('g1', makeUser([guildA, guildB]), paramMap$);

    paramMap$.next(convertToParamMap({ id: 'g2' }));

    expect(context.breadcrumbs('sidenav.guild.settings')[0].label).toBe('Guild B');
  });

  // ── breadcrumbs — structure ──────────────────────────────────────────────────

  it('returns exactly two items', () => {
    expect(setup('g1').breadcrumbs('sidenav.guild.settings').length).toBe(2);
  });

  it('puts the provided i18nKey on the last item', () => {
    const crumbs = setup('g1').breadcrumbs('sidenav.guild.roster');

    expect(crumbs.at(-1)?.i18nKey).toBe('sidenav.guild.roster');
  });

  // ── breadcrumbs — dashboard link ─────────────────────────────────────────────

  it('links the first item to the guild dashboard by default', () => {
    const guild = makeGuild({ id: 'g1' });
    const crumbs = setup('g1', makeUser([guild])).breadcrumbs('sidenav.guild.settings');

    expect(crumbs[0].link).toEqual(['/guilds', 'g1', 'dashboard']);
  });

  it('omits the link on the first item when withDashboardLink is false', () => {
    const guild = makeGuild({ id: 'g1' });
    const crumbs = setup('g1', makeUser([guild])).breadcrumbs('sidenav.guild.dashboard', false);

    expect(crumbs[0].link).toBeUndefined();
  });
});
