import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { CharacterDetailComponent } from './character-detail.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { CharacterStore } from '../../stores/character.store';
import { CharacterService } from '../../services/character.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { Character } from '../../models/character.model';
import { CharacterDetail } from '../../models/character-detail.model';
import { User } from '../../../../core/models/user.model';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: 1, name: 'Bhahlounette', classId: 1, className: 'Druid', classColor: '#FF7C0A',
  raceId: 1, raceName: 'Night Elf', faction: 'ALLIANCE',
  branchName: 'Classic Anniversary', realmName: 'Thunderstrike', realmSlug: 'thunderstrike',
  level: 60, itemLevel: null, avatarUrl: null, guildName: null, bnetSpecs: [], raidSpecs: [], guildMemberships: [],
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

const setup = (
  chars: Character[] = [],
  user: User | null = null,
  params: Params = {},
  fetchedCharacter: CharacterDetail | 'error' = 'error',
) => {
  const navigate = vi.fn();
  const { branch = BRANCH, realm = REALM, name = NAME } = params;

  const storeMock = {
    characterList: signal(chars),
    resyncCharacter: vi.fn().mockReturnValue(of(makeChar())),
    deactivateCharacter: vi.fn().mockReturnValue(of({ message: 'ok' })),
    loadCharacters: vi.fn().mockReturnValue(of(chars)),
  };
  const characterServiceMock = {
    getCharacter: vi.fn().mockReturnValue(
      fetchedCharacter === 'error' ? throwError(() => new Error('not found')) : of(fetchedCharacter),
    ),
  };
  const snackbarMock = { success: vi.fn(), error: vi.fn() };
  const dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(undefined)) }) };

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
      { provide: CharacterStore, useValue: storeMock },
      { provide: CharacterService, useValue: characterServiceMock },
      { provide: SnackbarService, useValue: snackbarMock },
      { provide: MatDialog, useValue: dialogMock },
    ],
  }).overrideComponent(CharacterDetailComponent, { set: { template: '', imports: [] } });

  const fixture = TestBed.createComponent(CharacterDetailComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, navigate, storeMock, characterServiceMock, snackbarMock, dialogMock };
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

      expect(component.character()).toEqual({ ...char, isOwner: true, canEditRaidSpecs: true });
    });

    it('returns undefined when no character matches', () => {
      const { component } = setup([makeChar({ realmSlug: 'other-realm' })]);

      expect(component.character()).toBeUndefined();
    });

    it('matches branchName case-insensitively with spaces converted to dashes', () => {
      const char = makeChar({ branchName: 'Classic_Anniversary' });
      const { component } = setup([char]);

      expect(component.character()).toEqual({ ...char, isOwner: true, canEditRaidSpecs: true });
    });
  });

  // ── route param null fallbacks ────────────────────────────────────────────

  describe('route param null fallbacks', () => {
    it('defaults branch to "" and matches a character with empty branchName', () => {
      const char = makeChar({ branchName: '', realmSlug: REALM, name: NAME });
      const { component } = setup([char], null, { branch: null });
      expect(component.character()).toEqual({ ...char, isOwner: true, canEditRaidSpecs: true });
    });

    it('defaults realm to "" and matches a character with empty realmSlug', () => {
      const char = makeChar({ branchName: 'Classic Anniversary', realmSlug: '', name: NAME });
      const { component } = setup([char], null, { realm: null });
      expect(component.character()).toEqual({ ...char, isOwner: true, canEditRaidSpecs: true });
    });

    it('defaults name to "" and matches a character with empty name', () => {
      const char = makeChar({ branchName: 'Classic Anniversary', realmSlug: REALM, name: '' });
      const { component } = setup([char], null, { name: null });
      expect(component.character()).toEqual({ ...char, isOwner: true, canEditRaidSpecs: true });
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

    it('does not call the character service when the character is one of the viewer\'s own', () => {
      const { characterServiceMock } = setup([makeChar()]);

      expect(characterServiceMock.getCharacter).not.toHaveBeenCalled();
    });
  });

  // ── viewing a non-owned character ────────────────────────────────────────

  describe('viewing a non-owned character', () => {
    it('fetches via CharacterService using the route branch/realm/name when not found in own store', () => {
      const { characterServiceMock } = setup([]);

      expect(characterServiceMock.getCharacter).toHaveBeenCalledWith(BRANCH, REALM, NAME);
    });

    it('exposes the fetched character with its own isOwner/canEditRaidSpecs flags', () => {
      const fetched: CharacterDetail = { ...makeChar({ name: 'Teammate' }), isOwner: false, canEditRaidSpecs: true };
      const { component } = setup([], null, {}, fetched);

      expect(component.character()).toEqual(fetched);
      expect(component.isOwner()).toBe(false);
      expect(component.canEditRaidSpecs()).toBe(true);
    });

    it('navigates to /characters when the fetch fails (not found or forbidden)', () => {
      const { navigate } = setup([], null, {}, 'error');

      expect(navigate).toHaveBeenCalledWith(['/characters']);
    });
  });

  // ── isOwner() / canEditRaidSpecs() ───────────────────────────────────────

  describe('isOwner() / canEditRaidSpecs()', () => {
    it('are both true for one of the viewer\'s own characters', () => {
      const { component } = setup([makeChar()]);

      expect(component.isOwner()).toBe(true);
      expect(component.canEditRaidSpecs()).toBe(true);
    });

    it('are both false when no character is loaded yet', () => {
      const { component } = setup([], null, {}, 'error');

      expect(component.isOwner()).toBe(false);
      expect(component.canEditRaidSpecs()).toBe(false);
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

  // ── resyncCharacter() ─────────────────────────────────────────────────────

  describe('resyncCharacter()', () => {
    it('does nothing when there is no character', () => {
      const { component, storeMock } = setup([]);
      component.resyncCharacter();
      expect(storeMock.resyncCharacter).not.toHaveBeenCalled();
    });

    it('calls store.resyncCharacter and shows success snackbar', () => {
      const char = makeChar();
      const { component, storeMock, snackbarMock } = setup([char]);

      component.resyncCharacter();

      expect(storeMock.resyncCharacter).toHaveBeenCalledWith(char.id);
      expect(snackbarMock.success).toHaveBeenCalledWith('characters.card.resyncSuccess');
    });

    it('shows error snackbar when the store call fails', () => {
      const char = makeChar();
      const { component, storeMock, snackbarMock } = setup([char]);
      storeMock.resyncCharacter.mockReturnValue(throwError(() => new Error('fail')));

      component.resyncCharacter();

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.card.resyncError');
    });
  });

  // ── deactivateCharacter() ─────────────────────────────────────────────────

  describe('deactivateCharacter()', () => {
    it('does nothing when there is no character', () => {
      const { component, dialogMock } = setup([]);
      component.deactivateCharacter();
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens the confirmation dialog', () => {
      const { component, dialogMock } = setup([makeChar()]);
      component.deactivateCharacter();
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('does not deactivate when the user cancels', () => {
      const { component, storeMock, dialogMock } = setup([makeChar()]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });

      component.deactivateCharacter();

      expect(storeMock.deactivateCharacter).not.toHaveBeenCalled();
    });

    it('deactivates and navigates to /characters when confirmed', () => {
      const char = makeChar();
      const { component, storeMock, navigate, dialogMock } = setup([char]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) });

      component.deactivateCharacter();

      expect(storeMock.deactivateCharacter).toHaveBeenCalledWith(char.id);
      expect(navigate).toHaveBeenCalledWith(['/characters']);
    });

    it('shows error snackbar when the store call fails after confirmation', () => {
      const { component, storeMock, snackbarMock, dialogMock } = setup([makeChar()]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(true)) });
      storeMock.deactivateCharacter.mockReturnValue(throwError(() => new Error('fail')));

      component.deactivateCharacter();

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.card.deactivateError');
    });
  });

  // ── editRaidSpecs() ───────────────────────────────────────────────────────

  describe('editRaidSpecs()', () => {
    it('does nothing when there is no character', () => {
      const { component, dialogMock } = setup([]);
      component.editRaidSpecs();
      expect(dialogMock.open).not.toHaveBeenCalled();
    });

    it('opens the raid-specs dialog in edit mode for the current character', () => {
      const char = makeChar();
      const { component, dialogMock } = setup([char]);

      component.editRaidSpecs();

      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { characters: [{ ...char, isOwner: true, canEditRaidSpecs: true }], mode: 'edit' } }),
      );
    });

    it('shows success when the dialog closes with success, without reloading (the store already patched locally)', () => {
      const { component, storeMock, snackbarMock, dialogMock } = setup([makeChar()]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of({ success: true })) });

      component.editRaidSpecs();

      expect(snackbarMock.success).toHaveBeenCalledWith('characters.raidSpecs.submitSuccess');
      expect(storeMock.loadCharacters).not.toHaveBeenCalled();
    });

    it('shows error snackbar when the dialog closes with error', () => {
      const { component, snackbarMock, dialogMock } = setup([makeChar()]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of({ error: true })) });

      component.editRaidSpecs();

      expect(snackbarMock.error).toHaveBeenCalledWith('characters.raidSpecs.submitError');
    });

    it('does nothing extra when the dialog is cancelled', () => {
      const { component, snackbarMock, dialogMock } = setup([makeChar()]);
      dialogMock.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(undefined)) });

      component.editRaidSpecs();

      expect(snackbarMock.success).not.toHaveBeenCalled();
      expect(snackbarMock.error).not.toHaveBeenCalled();
    });
  });
});
