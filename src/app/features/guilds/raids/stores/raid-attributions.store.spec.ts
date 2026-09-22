import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidEventAttributions } from '../models/raid-event-attributions.model';
import { RaidAttributionsStore } from './raid-attributions.store';

const generalPayload: RaidEventAttributions = { definitions: [], fills: [], seatedCharacters: [] };
const bossPayload: RaidEventAttributions = { definitions: [], fills: [], seatedCharacters: [{ characterId: 1, name: 'Aphrodisia', classId: 9, specId: 265 }] };

describe('RaidAttributionsStore', () => {
  let store: RaidAttributionsStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidAttributionsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RaidAttributionsStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('generalData / bossData', () => {
    it('are both undefined before the event is loaded', () => {
      TestBed.tick();
      expect(store.generalData()).toBeUndefined();
      expect(store.bossData()).toBeUndefined();
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('load', () => {
    it('fetches General only when no boss is selected', async () => {
      store.load('g1', 7, 42, null);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions'));
      expect(req.request.method).toBe('GET');
      req.flush(generalPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.generalData()).toEqual(generalPayload);
      expect(store.bossData()).toBeUndefined();
      controller.expectNone((r) => r.url.includes('bossId'));
    });

    it('fetches both General and the boss scope once a boss is selected', async () => {
      store.load('g1', 7, 42, 14);
      TestBed.tick();

      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions') && !r.params.has('bossId')).flush(generalPayload);
      const bossReq = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions') && r.params.get('bossId') === '14');
      bossReq.flush(bossPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.generalData()).toEqual(generalPayload);
      expect(store.bossData()).toEqual(bossPayload);
    });

    it('re-fetches when the event changes', async () => {
      store.load('g1', 7, 42, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions')).flush(generalPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 7, 43, null);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/43/attributions'));
      req.flush(generalPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.generalData()).toEqual(generalPayload);
    });
  });

  describe('reload', () => {
    it('re-fetches General when no boss is selected', async () => {
      store.load('g1', 7, 42, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions')).flush(generalPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions'));
      req.flush(generalPayload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.generalData()).toEqual(generalPayload);
    });
  });
});
