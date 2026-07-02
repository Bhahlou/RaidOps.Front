import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OfficerThreshold } from '../models/officer-threshold.model';
import { GuildSettingsService } from '../services/guild-settings.service';
import { OfficerThresholdStore } from './officer-threshold.store';

const officerThreshold = (overrides?: Partial<OfficerThreshold>): OfficerThreshold => ({
  minOfficerRoleId: null,
  ...overrides,
});

describe('OfficerThresholdStore', () => {
  let store: OfficerThresholdStore;
  let service: { getOfficerThreshold: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { getOfficerThreshold: vi.fn().mockReturnValue(of(officerThreshold())) };

    TestBed.configureTestingModule({
      providers: [
        OfficerThresholdStore,
        { provide: GuildSettingsService, useValue: service },
      ],
    });
    store = TestBed.inject(OfficerThresholdStore);
  });

  // ── officerThreshold ──────────────────────────────────────────────────────

  describe('officerThreshold', () => {
    it('is null before any load', () => {
      expect(store.officerThreshold()).toBeNull();
    });
  });

  // ── loadOfficerThreshold ──────────────────────────────────────────────────

  describe('loadOfficerThreshold', () => {
    it('calls the service and updates the officerThreshold signal', () => {
      const t = officerThreshold({ minOfficerRoleId: 'role-1' });
      service.getOfficerThreshold.mockReturnValue(of(t));

      store.loadOfficerThreshold('g1').subscribe();

      expect(service.getOfficerThreshold).toHaveBeenCalledWith('g1');
      expect(store.officerThreshold()).toEqual(t);
    });

    it('returns the cached value without re-fetching for the same guildId', () => {
      store.loadOfficerThreshold('g1').subscribe();
      store.loadOfficerThreshold('g1').subscribe();

      expect(service.getOfficerThreshold).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when the guildId changes', () => {
      store.loadOfficerThreshold('g1').subscribe();
      service.getOfficerThreshold.mockReturnValue(of(officerThreshold({ minOfficerRoleId: 'role-2' })));
      store.loadOfficerThreshold('g2').subscribe();

      expect(service.getOfficerThreshold).toHaveBeenCalledTimes(2);
      expect(store.officerThreshold()?.minOfficerRoleId).toBe('role-2');
    });
  });

  // ── patchOfficerThreshold ─────────────────────────────────────────────────

  describe('patchOfficerThreshold', () => {
    it('updates officerThreshold in place without calling the service', () => {
      const t = officerThreshold({ minOfficerRoleId: 'role-3' });
      store.patchOfficerThreshold('g1', t);

      expect(store.officerThreshold()).toEqual(t);
      expect(service.getOfficerThreshold).not.toHaveBeenCalled();
    });
  });

  // ── invalidate ────────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('clears the cached officerThreshold', () => {
      store.loadOfficerThreshold('g1').subscribe();

      store.invalidate();

      expect(store.officerThreshold()).toBeNull();
    });

    it('forces a re-fetch on next loadOfficerThreshold for the same guildId', () => {
      store.loadOfficerThreshold('g1').subscribe();
      store.invalidate();
      store.loadOfficerThreshold('g1').subscribe();

      expect(service.getOfficerThreshold).toHaveBeenCalledTimes(2);
    });
  });
});
