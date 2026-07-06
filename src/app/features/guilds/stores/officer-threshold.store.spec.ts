import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { OfficerThreshold } from '../models/officer-threshold.model';
import { OfficerThresholdStore } from './officer-threshold.store';

const officerThreshold = (overrides?: Partial<OfficerThreshold>): OfficerThreshold => ({
  minOfficerRoleId: null,
  ...overrides,
});

describe('OfficerThresholdStore', () => {
  let store: OfficerThresholdStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OfficerThresholdStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(OfficerThresholdStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── officerThreshold ──────────────────────────────────────────────────────

  describe('officerThreshold', () => {
    it('is null before any load', () => {
      TestBed.tick();
      expect(store.officerThreshold()).toBeNull();
    });
  });

  // ── loadOfficerThreshold ──────────────────────────────────────────────────

  describe('loadOfficerThreshold', () => {
    it('fetches the officer threshold for the given guild', async () => {
      const t = officerThreshold({ minOfficerRoleId: 'role-1' });

      store.loadOfficerThreshold('g1');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/officer-threshold'));
      expect(req.request.method).toBe('GET');
      req.flush(t);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.officerThreshold()).toEqual(t);
    });

    it('does not re-fetch for the same guildId', async () => {
      store.loadOfficerThreshold('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/officer-threshold')).flush(officerThreshold());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadOfficerThreshold('g1');
      TestBed.tick();

      controller.expectNone((r) => r.url.endsWith('/guilds/g1/officer-threshold'));
    });

    it('re-fetches when the guildId changes', async () => {
      store.loadOfficerThreshold('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/officer-threshold')).flush(officerThreshold());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadOfficerThreshold('g2');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.endsWith('/guilds/g2/officer-threshold'))
        .flush(officerThreshold({ minOfficerRoleId: 'role-2' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.officerThreshold()?.minOfficerRoleId).toBe('role-2');
    });
  });

  // ── patchOfficerThreshold ─────────────────────────────────────────────────

  describe('patchOfficerThreshold', () => {
    it('updates officerThreshold in place without calling the backend', () => {
      const t = officerThreshold({ minOfficerRoleId: 'role-3' });
      store.patchOfficerThreshold('g1', t);
      TestBed.tick();

      expect(store.officerThreshold()).toEqual(t);
      controller.expectNone((r) => r.url.endsWith('/guilds/g1/officer-threshold'));
    });
  });
});
