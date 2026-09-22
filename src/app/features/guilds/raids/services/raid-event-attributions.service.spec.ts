import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RaidEventAttributionsService } from './raid-event-attributions.service';

const BASE = '/guilds/guild-1/branches/7/raids/events/42/attributions';

describe('RaidEventAttributionsService', () => {
  let service: RaidEventAttributionsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidEventAttributionsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RaidEventAttributionsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getAttributions', () => {
    it('sends GET to the event attributions endpoint with no bossId param when null', () => {
      service.getAttributions('guild-1', 7, 42, null).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(BASE) && !r.params.has('bossId'));
      expect(req.request.method).toBe('GET');
      req.flush({ definitions: [], fills: [], seatedCharacters: [] });
    });

    it('sends the bossId as a query param when given', () => {
      service.getAttributions('guild-1', 7, 42, 14).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(BASE) && r.params.get('bossId') === '14');
      expect(req.request.method).toBe('GET');
      req.flush({ definitions: [], fills: [], seatedCharacters: [] });
    });
  });

  describe('getBossesForEvent', () => {
    it('sends GET to .../bosses', () => {
      service.getBossesForEvent('guild-1', 7, 42).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/branches/7/raids/events/42/bosses'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('setAttribution', () => {
    it('sends POST to .../set with the fill payload', () => {
      service.setAttribution('guild-1', 7, 42, null, 5, 12, 1, 99).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/set`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ bossId: null, definitionId: 5, cellId: 12, instanceIndex: 1, characterId: 99 });
      req.flush(null);
    });
  });

  describe('clearAttribution', () => {
    it('sends POST to .../clear with the slot identifiers', () => {
      service.clearAttribution('guild-1', 7, 42, null, 5, 12, 1).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/clear`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ bossId: null, definitionId: 5, cellId: 12, instanceIndex: 1 });
      req.flush(null);
    });
  });
});
