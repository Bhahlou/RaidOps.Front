import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { injectGuildContext, injectGuildBranchContext } from './inject-guild-context';
import { AuthStore } from '../../core/stores/auth.store';
import { DiscordIconType } from '../../shared/models/discord-icon-type.enum';
import { UserGuild } from '../../core/models/user-guild.model';
import { User } from '../../core/models/user.model';
import { GuildAccessLevel } from '../../core/models/guild-access-level.enum';
import { getLastVisitedBranchId } from './utils/last-visited-branch.util';

const makeGuild = (overrides: Partial<UserGuild> = {}): UserGuild => ({
  id: 'g1', name: 'Epic Guild', iconHash: 'hash1',
  isRegistered: true, isConfigured: true, isAdmin: false, branches: [], accessLevel: GuildAccessLevel.Public,
  ...overrides,
});

const makeUser = (guilds: UserGuild[]): User => ({
  discordId: '123', name: 'TestUser', avatarHash: null, guilds, notifications: [],
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

  it('links the first item to the bare guild path by default', () => {
    const guild = makeGuild({ id: 'g1' });
    const crumbs = setup('g1', makeUser([guild])).breadcrumbs('sidenav.guild.settings');

    expect(crumbs[0].link).toEqual(['/guilds', 'g1']);
  });

  it('omits the link on the first item when withDashboardLink is false', () => {
    const guild = makeGuild({ id: 'g1' });
    const crumbs = setup('g1', makeUser([guild])).breadcrumbs('sidenav.guild.dashboard', false);

    expect(crumbs[0].link).toBeUndefined();
  });
});

describe('injectGuildBranchContext', () => {
  afterEach(() => localStorage.clear());

  const setupBranch = (
    guildId: string,
    branchId: number,
    paramMap$: Observable<ParamMap> = of(convertToParamMap({ id: guildId, branchId: String(branchId) })),
  ) => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => (key === 'branchId' ? String(branchId) : guildId) },
            },
            paramMap: paramMap$,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => injectGuildBranchContext());
  };

  it('reads branchId from the route snapshot', () => {
    expect(setupBranch('g1', 7).branchId).toBe(7);
  });

  describe('currentBranchId', () => {
    it('starts at the snapshot value', () => {
      expect(setupBranch('g1', 7).currentBranchId()).toBe(7);
    });

    it('updates when the paramMap emits a different branchId', () => {
      const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1', branchId: '7' }));
      const context = setupBranch('g1', 7, paramMap$);

      paramMap$.next(convertToParamMap({ id: 'g1', branchId: '8' }));

      expect(context.currentBranchId()).toBe(8);
    });
  });

  describe('last-visited bookkeeping', () => {
    it('records the initial branch as last-visited for this guild', () => {
      setupBranch('g1', 7);
      TestBed.tick();

      expect(getLastVisitedBranchId('g1')).toBe(7);
    });

    it('updates the recorded branch when the paramMap emits a different branchId', () => {
      const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1', branchId: '7' }));
      setupBranch('g1', 7, paramMap$);
      TestBed.tick();

      paramMap$.next(convertToParamMap({ id: 'g1', branchId: '8' }));
      TestBed.tick();

      expect(getLastVisitedBranchId('g1')).toBe(8);
    });
  });
});
