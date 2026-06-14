import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CharacterDetailComponent } from './character-detail.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { CharacterStore } from '../../stores/character.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { Character } from '../../models/character.model';
import { User } from '../../../../core/models/user.model';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: 1, name: 'Bhahlounette', classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, specs: [],
  ...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  discordId: '123', name: 'TestUser', avatarHash: 'avatar123', guilds: [],
  ...overrides,
});

const BRANCH = 'classic-anniversary';
const REALM  = 'thunderstrike';
const NAME   = 'bhahlounette';

type Params = { branch?: string | null; realm?: string | null; name?: string | null };

const setup = (chars: Character[] = [], user: User | null = null, params: Params = {}) => {
  const navigate = vi.fn();
  const { branch = BRANCH, realm = REALM, name = NAME } = params;

  TestBed.configureTestingModule({
    imports: [CharacterDetailComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: (key: string) =>
                ({ branch, realm, name } as Record<string, string | null>)[key] ?? null,
            },
          },
        },
      },
      { provide: Router, useValue: { navigate } },
      { provide: AuthStore, useValue: { user: signal(user) } },
      { provide: CharacterStore, useValue: { characterList: signal(chars) } },
    ],
  }).overrideComponent(CharacterDetailComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(CharacterDetailComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, navigate };
};

describe('CharacterDetailComponent', () => {
  it('should create', () => {
    expect(setup([makeChar()]).component).toBeTruthy();
  });

  // ── character() ───────────────────────────────────────────────────────────

  describe('character()', () => {
    it('finds the character matching branch, realm and name', () => {
      const char = makeChar();
      const { component } = setup([char]);

      expect(component.character()).toEqual(char);
    });

    it('returns undefined when no character matches', () => {
      const { component } = setup([makeChar({ realmSlug: 'other-realm' })]);

      expect(component.character()).toBeUndefined();
    });

    it('matches branchName case-insensitively with spaces converted to dashes', () => {
      const char = makeChar({ branchName: 'Classic_Anniversary' });
      const { component } = setup([char]);

      expect(component.character()).toEqual(char);
    });
  });

  // ── route param null fallbacks ────────────────────────────────────────────

  describe('route param null fallbacks', () => {
    it('defaults branch to "" and matches a character with empty branchName', () => {
      const char = makeChar({ branchName: '', realmSlug: REALM, name: NAME });
      const { component } = setup([char], null, { branch: null });
      expect(component.character()).toEqual(char);
    });

    it('defaults realm to "" and matches a character with empty realmSlug', () => {
      const char = makeChar({ branchName: 'Classic Anniversary', realmSlug: '', name: NAME });
      const { component } = setup([char], null, { realm: null });
      expect(component.character()).toEqual(char);
    });

    it('defaults name to "" and matches a character with empty name', () => {
      const char = makeChar({ branchName: 'Classic Anniversary', realmSlug: REALM, name: '' });
      const { component } = setup([char], null, { name: null });
      expect(component.character()).toEqual(char);
    });
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('navigates to /characters when no matching character is found', () => {
      const { navigate } = setup([]);

      expect(navigate).toHaveBeenCalledWith(['/characters']);
    });

    it('does not navigate when the character is found', () => {
      const { navigate } = setup([makeChar()]);

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  // ── breadcrumbs() ─────────────────────────────────────────────────────────

  describe('breadcrumbs()', () => {
    it('has three items: user → characters link → character name', () => {
      const { component } = setup([makeChar()], makeUser());

      expect(component.breadcrumbs().length).toBe(3);
    });

    it('first item uses the user name as label with a discord avatar', () => {
      const user = makeUser({ name: 'Bhahlou', discordId: '999', avatarHash: 'avt' });
      const { component } = setup([makeChar()], user);
      const first = component.breadcrumbs()[0];

      expect(first.label).toBe('Bhahlou');
      expect(first.discordIcon).toEqual({ id: '999', hash: 'avt', type: DiscordIconType.User });
    });

    it('first item shows "…" and no icon when user is null', () => {
      const { component } = setup([makeChar()], null);
      const first = component.breadcrumbs()[0];

      expect(first.label).toBe('…');
      expect(first.discordIcon).toBeUndefined();
    });

    it('second item has i18nKey for the characters list and links to /characters', () => {
      const { component } = setup([makeChar()], makeUser());
      const second = component.breadcrumbs()[1];

      expect(second.i18nKey).toBe('sidenav.account.characters');
      expect(second.link).toEqual(['/characters']);
    });

    it('last item uses the character name', () => {
      const char = makeChar({ name: 'Bhahlounette' });
      const { component } = setup([char], makeUser());

      expect(component.breadcrumbs()[2].label).toBe('Bhahlounette');
    });

    it('last item shows "…" when character is not found', () => {
      const { component } = setup([], makeUser());

      expect(component.breadcrumbs()[2].label).toBe('…');
    });
  });
});
