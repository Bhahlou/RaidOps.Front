import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { SignupMode } from '../models/signup-mode.enum';
import { RaidSeriesStore } from './raid-series.store';

const BASE = '/guilds/g1/branches/7/raids';

const series = (overrides?: Partial<RaidSeries>): RaidSeries => ({
  id: 1,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  recurrenceDayOfWeek: 'Tuesday',
  recurrenceStartTimeLocal: '21:00:00',
  recurrenceIntervalWeeks: 1,
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  isActive: true,
  raidZones: [],
  ...overrides,
});

const payload = (overrides?: Partial<RaidSeriesPayload>): RaidSeriesPayload => ({
  name: 'SSC/TK/Gruul',
  recurrenceDayOfWeek: 'Tuesday',
  recurrenceStartTimeLocal: '21:00:00',
  recurrenceIntervalWeeks: 1,
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  raidZoneIds: [10],
  ...overrides,
});

describe('RaidSeriesStore', () => {
  let store: RaidSeriesStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidSeriesStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RaidSeriesStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── series / isLoading ───────────────────────────────────────────────────

  describe('series', () => {
    it('is null before any guild branch is set', () => {
      TestBed.tick();
      expect(store.series()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });
  });

  // ── load ─────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('fetches the series list for the given guild branch', async () => {
      const list = [series()];

      store.load('g1', 7);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      expect(req.request.method).toBe('GET');
      req.flush(list);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.series()).toEqual(list);
    });

    it('re-fetches when called again for the same guild branch', async () => {
      store.load('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/series`)).flush([series()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 7);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      req.flush([series({ name: 'Karazhan' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.series()?.[0].name).toBe('Karazhan');
    });

    it('re-fetches when the guild branch changes', async () => {
      store.load('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/series`)).flush([series()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 9);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/9/raids/series'));
      req.flush([series({ name: 'Karazhan' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.series()?.[0].name).toBe('Karazhan');
    });
  });

  // ── reload ───────────────────────────────────────────────────────────────

  describe('reload', () => {
    it('re-fetches the currently tracked guild branch series', async () => {
      store.load('g1', 7);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/series`)).flush([series()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      req.flush([series({ name: 'Karazhan' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.series()?.[0].name).toBe('Karazhan');
    });
  });

  // ── pass-through API calls ───────────────────────────────────────────────

  describe('createSeries', () => {
    it('sends POST to .../series with the payload', () => {
      const body = payload();
      store.createSeries('g1', 7, body).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  describe('updateSeries', () => {
    it('sends PATCH to .../series/:id with the payload', () => {
      const body = payload();
      store.updateSeries('g1', 7, 4, body).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series/4`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  describe('deactivateSeries', () => {
    it('sends POST to .../series/:id/deactivate with the deleteEmptyOccurrences flag', () => {
      store.deactivateSeries('g1', 7, 4, true).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series/4/deactivate`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ deleteEmptyOccurrences: true });
      req.flush(null);
    });
  });
});
