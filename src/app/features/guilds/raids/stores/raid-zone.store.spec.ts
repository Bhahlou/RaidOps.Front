import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidZone } from '../models/raid-zone.model';
import { RaidZoneStore } from './raid-zone.store';

const zone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 10,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 1,
  ...overrides,
});

describe('RaidZoneStore', () => {
  let store: RaidZoneStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidZoneStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RaidZoneStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── zones / isLoading ────────────────────────────────────────────────────

  describe('zones', () => {
    it('is empty before any guild branch is set', () => {
      TestBed.tick();
      expect(store.zones()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });
  });

  // ── load ─────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('fetches the raid zones for the given guild branch', async () => {
      const zones = [zone()];

      store.load('g1', 7);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/zones'));
      expect(req.request.method).toBe('GET');
      req.flush(zones);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.zones()).toEqual(zones);
    });

    it('does not re-fetch when called again for the same guild branch', async () => {
      store.load('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/zones')).flush([zone()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 7);
      TestBed.tick();

      controller.expectNone((r) => r.url.endsWith('/guilds/g1/branches/7/raids/zones'));
    });

    it('re-fetches when the guild branch changes', async () => {
      store.load('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/7/raids/zones')).flush([zone()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 9);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/9/raids/zones'));
      req.flush([zone({ shortCode: 'Kara' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.zones()[0].shortCode).toBe('Kara');
    });
  });
});
