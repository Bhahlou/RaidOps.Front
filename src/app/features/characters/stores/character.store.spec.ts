import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CharacterStore } from './character.store';
import { CharacterService } from '../services/character.service';
import { BnetService } from '../../../shared/services/bnet.service';
import { Character } from '../models/character.model';
import { BnetAccount } from '../models/bnet-account.model';

const makeChar = (id: number): Character => ({
  id,
  name: `Char${id}`,
  classId: 1,
  className: 'Warrior',
  classColor: '#C69B3A',
  raceId: 1,
  raceName: 'Human',
  faction: 'ALLIANCE',
  branchName: 'Retail',
  realmName: 'Silvermoon',
  realmSlug: 'silvermoon',
  level: 80,
  itemLevel: null,
  avatarUrl: null,
  guildName: null,
  specs: [],
});

const mockAccount: BnetAccount = {
  bnetId: '123',
  battleTag: 'User#1234',
  region: 'eu',
  tokenExpiry: '2025-12-31T00:00:00Z',
};

describe('CharacterStore', () => {
  let store: CharacterStore;
  let charService: {
    getCharacters: ReturnType<typeof vi.fn>;
    deactivateCharacter: ReturnType<typeof vi.fn>;
    resyncCharacter: ReturnType<typeof vi.fn>;
  };
  let bnetService: { getBnetAccount: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    charService = {
      getCharacters: vi.fn(),
      deactivateCharacter: vi.fn(),
      resyncCharacter: vi.fn(),
    };
    bnetService = { getBnetAccount: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CharacterStore,
        { provide: CharacterService, useValue: charService },
        { provide: BnetService, useValue: bnetService },
      ],
    });

    store = TestBed.inject(CharacterStore);
  });

  describe('initial state', () => {
    it('bnetAccount is undefined before first load', () => {
      expect(store.bnetAccount()).toBeUndefined();
    });

    it('isBnetLoading is true initially', () => {
      expect(store.isBnetLoading()).toBe(true);
    });

    it('isBnetLinked is false initially', () => {
      expect(store.isBnetLinked()).toBe(false);
    });

    it('characters is undefined before first load', () => {
      expect(store.characters()).toBeUndefined();
    });

    it('isCharactersLoading is true initially', () => {
      expect(store.isCharactersLoading()).toBe(true);
    });

    it('characterList defaults to empty array while loading', () => {
      expect(store.characterList()).toEqual([]);
    });
  });

  describe('loadBnetAccount', () => {
    it('sets bnetAccount and clears loading state on success', () => {
      bnetService.getBnetAccount.mockReturnValue(of(mockAccount));
      store.loadBnetAccount().subscribe();

      expect(store.bnetAccount()).toEqual(mockAccount);
      expect(store.isBnetLoading()).toBe(false);
      expect(store.isBnetLinked()).toBe(true);
    });

    it('sets bnetAccount to null when no account is linked', () => {
      bnetService.getBnetAccount.mockReturnValue(of(null));
      store.loadBnetAccount().subscribe();

      expect(store.bnetAccount()).toBeNull();
      expect(store.isBnetLoading()).toBe(false);
      expect(store.isBnetLinked()).toBe(false);
    });
  });

  describe('loadCharacters', () => {
    it('populates the character list and clears loading state', () => {
      const chars = [makeChar(1), makeChar(2)];
      charService.getCharacters.mockReturnValue(of(chars));
      store.loadCharacters().subscribe();

      expect(store.characters()).toEqual(chars);
      expect(store.characterList()).toEqual(chars);
      expect(store.isCharactersLoading()).toBe(false);
    });
  });

  describe('deactivateCharacter', () => {
    it('removes the deactivated character from the local list', () => {
      charService.getCharacters.mockReturnValue(of([makeChar(1), makeChar(2), makeChar(3)]));
      store.loadCharacters().subscribe();

      charService.deactivateCharacter.mockReturnValue(of({ message: 'ok' }));
      store.deactivateCharacter(2).subscribe();

      expect(store.characterList()).toEqual([makeChar(1), makeChar(3)]);
    });
  });

  describe('resyncCharacter', () => {
    it('replaces the resynced character in the local list', () => {
      charService.getCharacters.mockReturnValue(of([makeChar(1), makeChar(2)]));
      store.loadCharacters().subscribe();

      const updated: Character = { ...makeChar(1), name: 'UpdatedName' };
      charService.resyncCharacter.mockReturnValue(of(updated));
      store.resyncCharacter(1).subscribe();

      expect(store.characterList()).toEqual([updated, makeChar(2)]);
    });
  });
});
