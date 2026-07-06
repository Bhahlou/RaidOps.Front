import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GuildSettings } from '../models/guild-settings.model';
import { RosterMode } from '../models/roster-mode.enum';
import { GuildStore } from './guild.store';

const settings = (overrides?: Partial<GuildSettings>): GuildSettings => ({
  timezone: 'Europe/Paris',
  rosterMode: RosterMode.Open,
  minRosterRoleId: null,
  ...overrides,
});

describe('GuildStore', () => {
  let store: GuildStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GuildStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── settings ──────────────────────────────────────────────────────────────

  describe('settings', () => {
    it('is null before any load', () => {
      TestBed.tick();
      expect(store.settings()).toBeNull();
    });
  });

  // ── loadSettings ──────────────────────────────────────────────────────────

  describe('loadSettings', () => {
    it('fetches the settings for the given guild', async () => {
      const s = settings({ timezone: 'UTC' });

      store.loadSettings('g1');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/settings'));
      expect(req.request.method).toBe('GET');
      req.flush(s);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.settings()).toEqual(s);
    });

    it('does not re-fetch for the same guildId', async () => {
      store.loadSettings('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/settings')).flush(settings());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadSettings('g1');
      TestBed.tick();

      controller.expectNone((r) => r.url.endsWith('/guilds/g1/settings'));
    });

    it('re-fetches when the guildId changes', async () => {
      store.loadSettings('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/settings')).flush(settings());
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadSettings('g2');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.endsWith('/guilds/g2/settings'))
        .flush(settings({ timezone: 'UTC' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.settings()?.timezone).toBe('UTC');
    });
  });

  // ── patchSettings ─────────────────────────────────────────────────────────

  describe('patchSettings', () => {
    it('updates settings in place without calling the backend', () => {
      const s = settings({ timezone: 'America/New_York' });
      store.patchSettings('g1', s);
      TestBed.tick();

      expect(store.settings()).toEqual(s);
      controller.expectNone((r) => r.url.endsWith('/guilds/g1/settings'));
    });
  });
});
