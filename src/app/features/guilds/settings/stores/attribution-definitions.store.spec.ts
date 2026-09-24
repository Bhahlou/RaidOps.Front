import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GuildAttributionDefinition } from '../../raids/models/guild-attribution-definition.model';
import { AttributionIconSource } from '../../raids/models/attribution-icon-source.enum';
import { AttributionDefinitionsStore } from './attribution-definitions.store';

const definition = (overrides?: Partial<GuildAttributionDefinition>): GuildAttributionDefinition => ({
  id: 1,
  label: 'Innervate',
  section: 'Personals',
  isRepeatable: true,
  raidBossId: null,
  sectionIconSource: AttributionIconSource.None,
  sectionSpellId: null,
  sectionSpellIconUrl: null,
  sectionRaidMarker: null,
  sectionStaticRole: null,
  cells: [],
  sortOrder: 0,
  ...overrides,
});

describe('AttributionDefinitionsStore', () => {
  let store: AttributionDefinitionsStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttributionDefinitionsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AttributionDefinitionsStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('definitions', () => {
    it('is empty before any guild is set', () => {
      TestBed.tick();
      expect(store.definitions()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('load', () => {
    it('fetches the attribution definitions for the given guild', async () => {
      const definitions = [definition()];

      store.load('g1', 5, null);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions'));
      expect(req.request.method).toBe('GET');
      req.flush(definitions);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()).toEqual(definitions);
    });

    it('sends raidBossId as a query param when scoped to a boss', async () => {
      store.load('g1', 5, 14);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions') && r.params.get('raidBossId') === '14');
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('does not re-fetch when called again for the same guild', async () => {
      store.load('g1', 5, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions')).flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 5, null);
      TestBed.tick();

      controller.expectNone((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions'));
    });

    it('re-fetches from the new branch endpoint when only the branch changes', async () => {
      store.load('g1', 5, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions')).flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1', 6, null);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/6/attribution-definitions'));
      req.flush([definition({ label: 'Other branch' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions().map((d) => d.label)).toEqual(['Other branch']);
    });

    it('re-fetches when the guild changes', async () => {
      store.load('g1', 5, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions')).flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g2', 5, null);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g2/branches/5/attribution-definitions'));
      req.flush([definition({ label: 'PI' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()[0].label).toBe('PI');
    });
  });

  describe('reload', () => {
    it('re-fetches the same guild', async () => {
      store.load('g1', 5, null);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions')).flush([definition()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches/5/attribution-definitions'));
      req.flush([definition({ label: 'Updated' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.definitions()[0].label).toBe('Updated');
    });
  });
});
