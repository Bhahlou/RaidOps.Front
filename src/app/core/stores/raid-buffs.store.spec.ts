import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidBuffsStore } from './raid-buffs.store';
import { RaidBuffDefinition } from '../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../shared/models/raid-buff-scope.enum';

const definition = (overrides?: Partial<RaidBuffDefinition>): RaidBuffDefinition => ({
  id: 1,
  expansionId: 12,
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 0,
  sources: [],
  spell: null,
  ...overrides,
});

describe('RaidBuffsStore', () => {
  let store: RaidBuffsStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidBuffsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RaidBuffsStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('definitions / isLoading', () => {
    it('is empty and not loading before any load call', () => {
      TestBed.tick();

      expect(store.definitions()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('load', () => {
    it('fetches the definitions of the given expansion', async () => {
      store.load(12);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/raidbuffs') && r.params.get('expansionId') === '12');
      expect(req.request.method).toBe('GET');
      req.flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()).toEqual([definition()]);
    });

    it('re-fetches when called again for a different expansion', async () => {
      store.load(12);
      TestBed.tick();
      controller.expectOne((r) => r.params.get('expansionId') === '12').flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load(2);
      TestBed.tick();
      const req = controller.expectOne((r) => r.params.get('expansionId') === '2');
      req.flush([definition({ id: 2, expansionId: 2, spellId: 99999 })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()).toEqual([definition({ id: 2, expansionId: 2, spellId: 99999 })]);
    });
  });

  describe('reload', () => {
    it('re-issues the request for the current expansion', async () => {
      store.load(12);
      TestBed.tick();
      controller.expectOne((r) => r.params.get('expansionId') === '12').flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();

      const req = controller.expectOne((r) => r.params.get('expansionId') === '12');
      req.flush([definition({ labelEn: 'updated' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()).toEqual([definition({ labelEn: 'updated' })]);
    });
  });
});
