import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidEventAttributions } from '../models/raid-event-attributions.model';
import { RaidAttributionsStore } from './raid-attributions.store';

const payload: RaidEventAttributions = { definitions: [], fills: [], seatedCharacters: [] };

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

  describe('data', () => {
    it('is undefined before the event is loaded', () => {
      TestBed.tick();
      expect(store.data()).toBeUndefined();
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('load', () => {
    it('fetches the event attributions once guild/branch/event are all set', async () => {
      store.load('g1', 7, 42);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions'));
      expect(req.request.method).toBe('GET');
      req.flush(payload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.data()).toEqual(payload);
    });

    it('re-fetches when the event changes', async () => {
      store.load('g1', 7, 42);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions')).flush(payload);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 7, 43);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/43/attributions'));
      req.flush(payload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.data()).toEqual(payload);
    });
  });

  describe('reload', () => {
    it('re-fetches the same event', async () => {
      store.load('g1', 7, 42);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions')).flush(payload);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/events/42/attributions'));
      req.flush(payload);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.data()).toEqual(payload);
    });
  });
});
