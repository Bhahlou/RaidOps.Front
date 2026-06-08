import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GuildSettings } from '../models/guild-settings.model';
import { RosterMode } from '../models/roster-mode.enum';
import { GuildSettingsService } from '../services/guild-settings.service';
import { GuildStore } from './guild.store';

const settings = (overrides?: Partial<GuildSettings>): GuildSettings => ({
  timezone: 'Europe/Paris',
  rosterMode: RosterMode.Open,
  minRosterRoleId: null,
  ...overrides,
});

describe('GuildStore', () => {
  let store: GuildStore;
  let service: { getSettings: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { getSettings: vi.fn().mockReturnValue(of(settings())) };

    TestBed.configureTestingModule({
      providers: [
        GuildStore,
        { provide: GuildSettingsService, useValue: service },
      ],
    });
    store = TestBed.inject(GuildStore);
  });

  // ── settings ──────────────────────────────────────────────────────────────

  describe('settings', () => {
    it('is null before any load', () => {
      expect(store.settings()).toBeNull();
    });
  });

  // ── loadSettings ──────────────────────────────────────────────────────────

  describe('loadSettings', () => {
    it('calls the service and updates the settings signal', () => {
      const s = settings({ timezone: 'UTC' });
      service.getSettings.mockReturnValue(of(s));

      store.loadSettings('g1').subscribe();

      expect(service.getSettings).toHaveBeenCalledWith('g1');
      expect(store.settings()).toEqual(s);
    });

    it('returns the cached value without re-fetching for the same guildId', () => {
      store.loadSettings('g1').subscribe();
      store.loadSettings('g1').subscribe();

      expect(service.getSettings).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when the guildId changes', () => {
      store.loadSettings('g1').subscribe();
      service.getSettings.mockReturnValue(of(settings({ timezone: 'UTC' })));
      store.loadSettings('g2').subscribe();

      expect(service.getSettings).toHaveBeenCalledTimes(2);
      expect(store.settings()?.timezone).toBe('UTC');
    });
  });

  // ── patchSettings ─────────────────────────────────────────────────────────

  describe('patchSettings', () => {
    it('updates settings in place without calling the service', () => {
      const s = settings({ timezone: 'America/New_York' });
      store.patchSettings('g1', s);

      expect(store.settings()).toEqual(s);
      expect(service.getSettings).not.toHaveBeenCalled();
    });
  });

  // ── invalidate ────────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('clears the cached settings', () => {
      store.loadSettings('g1').subscribe();

      store.invalidate();

      expect(store.settings()).toBeNull();
    });

    it('forces a re-fetch on next loadSettings for the same guildId', () => {
      store.loadSettings('g1').subscribe();
      store.invalidate();
      store.loadSettings('g1').subscribe();

      expect(service.getSettings).toHaveBeenCalledTimes(2);
    });
  });
});
