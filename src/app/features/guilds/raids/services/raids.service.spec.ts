import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RaidEventPayload } from '../models/raid-event.model';
import { RaidSeriesPayload } from '../models/raid-series.model';
import { SignupMode } from '../models/signup-mode.enum';
import { SignupStatus } from '../models/signup-status.enum';
import { RaidsService } from './raids.service';

const BASE = '/guilds/guild-1/branches/7/raids';

describe('RaidsService', () => {
  let service: RaidsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RaidsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getZones', () => {
    it('sends GET to .../zones', () => {
      service.getZones('guild-1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/zones`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getLockoutWeek', () => {
    it('sends GET to .../lockout-week', () => {
      service.getLockoutWeek('guild-1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/lockout-week`));
      expect(req.request.method).toBe('GET');
      req.flush({ weekStartLocal: null, weekEndLocal: null });
    });
  });

  describe('getSeriesList', () => {
    it('sends GET to .../series', () => {
      service.getSeriesList('guild-1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('createSeries', () => {
    it('sends POST to .../series with the payload', () => {
      const payload: RaidSeriesPayload = {
        name: 'SSC/TK/Gruul',
        recurrenceDayOfWeek: 'Tuesday',
        recurrenceStartTimeLocal: '21:00:00',
        recurrenceIntervalWeeks: 1,
        groupCount: 5,
        slotsPerGroup: 5,
        signupMode: SignupMode.DefaultPresent,
        raidZoneIds: [10],
      };

      service.createSeries('guild-1', 7, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('updateSeries', () => {
    it('sends PATCH to .../series/:id with the payload', () => {
      const payload: RaidSeriesPayload = {
        name: 'SSC/TK/Gruul',
        recurrenceDayOfWeek: 'Tuesday',
        recurrenceStartTimeLocal: '21:00:00',
        recurrenceIntervalWeeks: 1,
        groupCount: 5,
        slotsPerGroup: 5,
        signupMode: SignupMode.DefaultPresent,
        raidZoneIds: [10],
      };

      service.updateSeries('guild-1', 7, 4, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series/4`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('deactivateSeries', () => {
    it('sends POST to .../series/:id/deactivate with the deleteEmptyOccurrences flag', () => {
      service.deactivateSeries('guild-1', 7, 4, true).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/series/4/deactivate`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ deleteEmptyOccurrences: true });
      req.flush(null);
    });
  });

  describe('materializeOccurrences', () => {
    it('sends POST to .../materialize with the range as query params', () => {
      service.materializeOccurrences('guild-1', 7, '2026-08-05', '2026-08-11').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`) && r.params.get('rangeStart') === '2026-08-05' && r.params.get('rangeEnd') === '2026-08-11');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(null);
    });
  });

  describe('getBoard', () => {
    it('sends GET to .../board with the range as query params', () => {
      service.getBoard('guild-1', 7, '2026-08-05', '2026-08-11').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/board`) && r.params.get('rangeStart') === '2026-08-05' && r.params.get('rangeEnd') === '2026-08-11');
      expect(req.request.method).toBe('GET');
      req.flush({ events: [] });
    });
  });

  describe('getEvent', () => {
    it('sends GET to .../events/:id', () => {
      service.getEvent('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('GET');
      req.flush({ id: 11, name: 'Split 1' });
    });
  });

  describe('createEvent', () => {
    it('sends POST to .../events with the payload', () => {
      const payload: RaidEventPayload = { name: 'SSC/TK/Gruul', startsAtUtc: '2026-08-05T19:00:00Z', groupCount: 5, slotsPerGroup: 5, signupMode: SignupMode.DefaultPresent, raidZoneIds: [10] };

      service.createEvent('guild-1', 7, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('updateEvent', () => {
    it('sends PATCH to .../events/:id with the payload', () => {
      const payload: RaidEventPayload = { name: 'SSC/TK/Gruul', startsAtUtc: '2026-08-05T19:00:00Z', groupCount: 5, slotsPerGroup: 5, signupMode: SignupMode.DefaultPresent, raidZoneIds: [10] };

      service.updateEvent('guild-1', 7, 11, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('deleteEvent', () => {
    it('sends DELETE to .../events/:id', () => {
      service.deleteEvent('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('createAnnouncementChannel', () => {
    it('sends POST to .../announcement-channel with the name and category id', () => {
      service.createAnnouncementChannel('guild-1', 7, 'kara-tue-18-aug', 'cat-1').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/announcement-channel`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'kara-tue-18-aug', categoryId: 'cat-1' });
      req.flush({ body: { id: '555', name: 'kara-tue-18-aug', missingPermissions: [], categoryName: 'Raids' } });
    });

    it('defaults categoryId to null when omitted', () => {
      service.createAnnouncementChannel('guild-1', 7, 'kara-tue-18-aug').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/announcement-channel`));
      expect(req.request.body).toEqual({ name: 'kara-tue-18-aug', categoryId: null });
      req.flush({ body: { id: '555', name: 'kara-tue-18-aug', missingPermissions: [], categoryName: null } });
    });
  });

  describe('publish', () => {
    it('sends POST to .../events/:id/publish with an empty body', () => {
      service.publish('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/publish`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });
  });

  describe('getAssignedCharacters', () => {
    it('sends GET to .../events/:id/assigned-characters', () => {
      service.getAssignedCharacters('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/assigned-characters`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('announceGrouping', () => {
    it('sends POST to .../events/:id/announce-grouping with the given character name', () => {
      service.announceGrouping('guild-1', 7, 11, 'Arthas').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/announce-grouping`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ characterName: 'Arthas' });
      req.flush(null);
    });

    it('sends null characterName when omitted, letting the backend resolve the requester\'s own', () => {
      service.announceGrouping('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/announce-grouping`));
      expect(req.request.body).toEqual({ characterName: null });
      req.flush(null);
    });
  });

  describe('setMySignup', () => {
    it('sends POST to .../events/:id/signup with the status, character and spec', () => {
      service.setMySignup('guild-1', 7, 11, SignupStatus.Accepted, 42, 71).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/signup`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ status: SignupStatus.Accepted, characterId: 42, specId: 71 });
      req.flush(null);
    });

    it('defaults characterId/specId to null when omitted (Declined response)', () => {
      service.setMySignup('guild-1', 7, 11, SignupStatus.Declined).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/signup`));
      expect(req.request.body).toEqual({ status: SignupStatus.Declined, characterId: null, specId: null });
      req.flush(null);
    });
  });

  describe('getSignups', () => {
    it('sends GET to .../events/:id/signups', () => {
      service.getSignups('guild-1', 7, 11).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/signups`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('assignSlot', () => {
    it('sends POST to .../events/:id/slots/assign with the slot coordinates and character id', () => {
      service.assignSlot('guild-1', 7, 11, 1, 2, 42).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/assign`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2, characterId: 42 });
      req.flush(null);
    });
  });

  describe('swapSlotAssignments', () => {
    it('sends POST to .../events/:id/slots/swap with both slot coordinates', () => {
      service.swapSlotAssignments('guild-1', 7, 11, 1, 2, 3, 4).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/swap`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ groupNumberA: 1, slotNumberA: 2, groupNumberB: 3, slotNumberB: 4 });
      req.flush(null);
    });
  });

  describe('unassignSlot', () => {
    it('sends POST to .../events/:id/slots/unassign with the slot coordinates', () => {
      service.unassignSlot('guild-1', 7, 11, 1, 2).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/unassign`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2 });
      req.flush(null);
    });
  });

  describe('updateSlotSpec', () => {
    it('sends PATCH to .../events/:id/slots/spec with the slot coordinates and spec id', () => {
      service.updateSlotSpec('guild-1', 7, 11, 1, 2, 65).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/spec`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2, specId: 65 });
      req.flush(null);
    });
  });
});
