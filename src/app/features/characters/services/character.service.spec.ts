import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CharacterService, GetCharactersResponse } from './character.service';
import { Character } from '../models/character.model';
import { SyncedCharacter } from '../models/synced-character.model';
import { BnetAccount } from '../models/bnet-account.model';

const makeChar = (id = 1): Character => ({
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
  itemLevel: 620,
  avatarUrl: null,
  guildName: null,
  bnetSpecs: [],
  raidSpecs: [],
  guildMemberships: [],
});

describe('CharacterService', () => {
  let service: CharacterService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CharacterService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getCharacters', () => {
    it('sends GET /characters and returns the bnetAccounts + characters envelope', () => {
      const account: BnetAccount = { bnetId: '1', battleTag: 'Test#0001', region: 'eu', tokenExpiry: '2026-01-01T00:00:00Z' };
      const envelope: GetCharactersResponse = { bnetAccounts: [account], characters: [makeChar(1)] };

      let result: GetCharactersResponse | undefined;
      service.getCharacters().subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters'));
      expect(req.request.method).toBe('GET');
      req.flush(envelope);

      expect(result).toEqual(envelope);
    });
  });

  describe('getCharacter', () => {
    it('sends GET /characters/:branch/:realm/:name and flattens the envelope into a CharacterDetail', () => {
      const char = makeChar(1);

      let result: (Character & { isOwner: boolean; canEditRaidSpecs: boolean }) | undefined;
      service.getCharacter('classic-anniversary', 'kazzak', 'arthas').subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/classic-anniversary/kazzak/arthas'));
      expect(req.request.method).toBe('GET');
      req.flush({ character: char, isOwner: false, canEditRaidSpecs: true });

      expect(result).toEqual({ ...char, isOwner: false, canEditRaidSpecs: true });
    });
  });

  describe('getSyncedCharacters', () => {
    it('sends GET /characters/synced and returns the list', () => {
      const synced: SyncedCharacter[] = [
        {
          id: 1, name: 'Char1', classId: 1, className: 'Warrior', classColor: '#C69B3A',
          raceId: 1, raceName: 'Human', faction: 'ALLIANCE', branchName: 'Retail',
          realmName: 'Silvermoon', level: 80, isActive: true,
        },
      ];

      let result: SyncedCharacter[] | undefined;
      service.getSyncedCharacters().subscribe(c => { result = c; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/synced'));
      expect(req.request.method).toBe('GET');
      req.flush(synced);

      expect(result).toEqual(synced);
    });
  });

  describe('syncCharacters', () => {
    it('sends POST /characters/sync with branchId', () => {
      let result: { message: string } | undefined;
      service.syncCharacters(2).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/sync'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ branchId: 2 });
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('activateCharacters', () => {
    it('sends POST /characters/activate with characterIds', () => {
      let result: { message: string } | undefined;
      service.activateCharacters([1, 2, 3]).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/activate'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ characterIds: [1, 2, 3] });
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('deactivateCharacter', () => {
    it('sends POST /characters/:id/deactivate with empty body', () => {
      let result: { message: string } | undefined;
      service.deactivateCharacter(42).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/42/deactivate'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('resyncCharacter', () => {
    it('sends POST /characters/:id/resync and returns the updated character', () => {
      const updated = makeChar(42);
      let result: Character | undefined;
      service.resyncCharacter(42).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/42/resync'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(updated);

      expect(result).toEqual(updated);
    });
  });

  describe('setRaidSpecs', () => {
    it('sends POST /characters/:id/raid-specs with mainSpecId and viableSpecIds', () => {
      let result: { message: string } | undefined;
      service.setRaidSpecs(42, { mainSpecId: 72, viableSpecIds: [71, 72] }).subscribe(r => { result = r; });

      const req = controller.expectOne(r => r.url.endsWith('/characters/42/raid-specs'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ mainSpecId: 72, viableSpecIds: [71, 72] });
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });
  });
});
