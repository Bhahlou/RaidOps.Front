import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RaidBoard, RaidEvent, RaidEventPayload } from '../models/raid-event.model';
import { RaidEventStatus } from '../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../models/raid-publication-status.enum';
import { SignupMode } from '../models/signup-mode.enum';
import { SignupStatus } from '../models/signup-status.enum';
import { RaidSignupHubService } from '../services/raid-signup-hub.service';
import { RaidBoardStore } from './raid-board.store';

const BASE = '/guilds/g1/branches/7/raids';

const raidEvent = (overrides?: Partial<RaidEvent>): RaidEvent => ({
  id: 1,
  raidSeriesId: null,
  name: 'SSC/TK/Gruul',
  branchId: 3,
  branchName: 'Classic Anniversary',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  status: RaidEventStatus.Scheduled,
  publicationStatus: RaidPublicationStatus.Draft,
  raidZones: [],
  assignments: [],
  ineligiblePlayerDiscordIds: [],
  mySignupStatus: null,
  dedicatedAnnouncementChannelId: null,
  dedicatedAnnouncementChannelIsBotOwned: false,
  ...overrides,
});

const eventPayload = (overrides?: Partial<RaidEventPayload>): RaidEventPayload => ({
  name: 'SSC/TK/Gruul',
  startsAtUtc: '2026-08-05T19:00:00Z',
  groupCount: 5,
  slotsPerGroup: 5,
  signupMode: SignupMode.DefaultPresent,
  raidZoneIds: [10],
  ...overrides,
});

describe('RaidBoardStore', () => {
  let store: RaidBoardStore;
  let controller: HttpTestingController;
  let signupHub: { joinEvent: ReturnType<typeof vi.fn>; leaveEvent: ReturnType<typeof vi.fn>; onRaidSignupChanged: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    signupHub = { joinEvent: vi.fn().mockResolvedValue(undefined), leaveEvent: vi.fn(), onRaidSignupChanged: vi.fn().mockReturnValue(() => {}) };

    TestBed.configureTestingModule({
      providers: [
        RaidBoardStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RaidSignupHubService, useValue: signupHub },
      ],
    });
    store = TestBed.inject(RaidBoardStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── events / isLoading ───────────────────────────────────────────────────

  describe('events', () => {
    it('is empty and not loading before any range is set', () => {
      TestBed.tick();
      expect(store.events()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });
  });

  // ── loadRange ────────────────────────────────────────────────────────────

  describe('loadRange', () => {
    it('materializes then loads the board for the range', async () => {
      const board: RaidBoard = { events: [raidEvent()] };

      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      expect(store.isLoading()).toBe(true);

      const materializeReq = controller.expectOne(
        (r) => r.url.endsWith(`${BASE}/materialize`) && r.params.get('rangeStart') === '2026-08-05' && r.params.get('rangeEnd') === '2026-08-11',
      );
      expect(materializeReq.request.method).toBe('POST');
      materializeReq.flush(null);
      await Promise.resolve();
      TestBed.tick();

      const boardReq = controller.expectOne((r) => r.url.includes(`${BASE}/board?`) && r.url.includes('rangeStart=2026-08-05') && r.url.includes('rangeEnd=2026-08-11'));
      expect(boardReq.request.method).toBe('GET');
      boardReq.flush(board);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()).toEqual(board.events);
      expect(store.isLoading()).toBe(false);
    });

    it('still loads the board when materialization fails', async () => {
      const board: RaidBoard = { events: [raidEvent()] };

      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush('boom', { status: 500, statusText: 'Server Error' });
      await Promise.resolve();
      TestBed.tick();

      controller.expectOne((r) => r.url.includes(`${BASE}/board?`)).flush(board);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()).toEqual(board.events);
    });

    it('re-fetches the board when called again for the same range', async () => {
      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush(null);
      await Promise.resolve();
      TestBed.tick();
      controller.expectOne((r) => r.url.includes(`${BASE}/board?`)).flush({ events: [raidEvent()] });
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush(null);
      await Promise.resolve();
      TestBed.tick();
      const boardReq = controller.expectOne((r) => r.url.includes(`${BASE}/board?`));
      boardReq.flush({ events: [raidEvent({ name: 'Kara' })] });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });

    it('sets a new key and refetches when the range changes', async () => {
      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush(null);
      await Promise.resolve();
      TestBed.tick();
      controller.expectOne((r) => r.url.includes(`${BASE}/board?`)).flush({ events: [raidEvent()] });
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRange('g1', 7, '2026-08-12', '2026-08-18');
      controller
        .expectOne((r) => r.url.endsWith(`${BASE}/materialize`) && r.params.get('rangeStart') === '2026-08-12')
        .flush(null);
      await Promise.resolve();
      TestBed.tick();
      controller
        .expectOne((r) => r.url.includes(`${BASE}/board?`) && r.url.includes('rangeStart=2026-08-12'))
        .flush({ events: [raidEvent({ name: 'Kara' })] });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });
  });

  // ── reload ───────────────────────────────────────────────────────────────

  describe('reload', () => {
    it('re-fetches the currently tracked range without re-materializing', async () => {
      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush(null);
      await Promise.resolve();
      TestBed.tick();
      controller.expectOne((r) => r.url.includes(`${BASE}/board?`)).flush({ events: [raidEvent()] });
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      await Promise.resolve();
      TestBed.tick();
      controller.expectNone((r) => r.url.endsWith(`${BASE}/materialize`));
      const boardReq = controller.expectOne((r) => r.url.includes(`${BASE}/board?`));
      boardReq.flush({ events: [raidEvent({ name: 'Kara' })] });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });

    it('re-fetches the currently tracked single event when in event mode', async () => {
      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`)).flush(raidEvent({ id: 11 }));
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      req.flush(raidEvent({ id: 11, name: 'Kara' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });
  });

  // ── loadEvent ────────────────────────────────────────────────────────────

  describe('loadEvent', () => {
    it('points events() at the single fetched event and clears the range key', async () => {
      store.loadRange('g1', 7, '2026-08-05', '2026-08-11');
      controller.expectOne((r) => r.url.endsWith(`${BASE}/materialize`)).flush(null);
      await Promise.resolve();
      TestBed.tick();
      controller.expectOne((r) => r.url.includes(`${BASE}/board?`)).flush({ events: [raidEvent()] });
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      controller.expectNone((r) => r.url.endsWith(`${BASE}/materialize`));
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('GET');
      req.flush(raidEvent({ id: 11, name: 'Split 1' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()).toEqual([raidEvent({ id: 11, name: 'Split 1' })]);
    });

    it('is empty before the event has loaded', () => {
      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      expect(store.events()).toEqual([]);
      controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`)).flush(raidEvent({ id: 11 }));
    });

    it('re-fetches instead of setting a new key when called again for the same event', async () => {
      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`)).flush(raidEvent({ id: 11 }));
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      req.flush(raidEvent({ id: 11, name: 'Kara' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });

    it('sets a new key and re-fetches when the event changes', async () => {
      store.loadEvent('g1', 7, 11);
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`)).flush(raidEvent({ id: 11 }));
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadEvent('g1', 7, 12);
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/12`));
      req.flush(raidEvent({ id: 12, name: 'Kara' }));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.events()[0].name).toBe('Kara');
    });
  });

  // ── lastViewedRangeStart / rememberRangeStart ───────────────────────────

  describe('lastViewedRangeStart / rememberRangeStart', () => {
    it('is null until a range start is remembered', () => {
      expect(store.lastViewedRangeStart()).toBeNull();
    });

    it('remembers the given date', () => {
      const date = new Date(2026, 7, 5);
      store.rememberRangeStart(date);
      expect(store.lastViewedRangeStart()).toBe(date);
    });
  });

  // ── dragging state ───────────────────────────────────────────────────────

  describe('startDrag / endDrag', () => {
    it('defaults draggingFromSlot to null for a roster-pool drag', () => {
      store.startDrag('player-1', 42);

      expect(store.draggingPlayerDiscordId()).toBe('player-1');
      expect(store.draggingCharacterId()).toBe(42);
      expect(store.draggingFromSlot()).toBeNull();
    });

    it('carries the origin slot for a drag starting on an occupied slot', () => {
      store.startDrag('player-1', 42, { eventId: 1, groupNumber: 2, slotNumber: 3 });

      expect(store.draggingFromSlot()).toEqual({ eventId: 1, groupNumber: 2, slotNumber: 3 });
    });

    it('clears every dragging signal on endDrag', () => {
      store.startDrag('player-1', 42, { eventId: 1, groupNumber: 2, slotNumber: 3 });

      store.endDrag();

      expect(store.draggingPlayerDiscordId()).toBeNull();
      expect(store.draggingCharacterId()).toBeNull();
      expect(store.draggingFromSlot()).toBeNull();
    });
  });

  // ── pass-through API calls ───────────────────────────────────────────────

  describe('getLockoutWeek', () => {
    it('sends GET to .../lockout-week', () => {
      store.getLockoutWeek('g1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/lockout-week`));
      expect(req.request.method).toBe('GET');
      req.flush({ weekStartLocal: null, weekEndLocal: null });
    });
  });

  describe('createEvent', () => {
    it('sends POST to .../events with the payload', () => {
      const payload = eventPayload();
      store.createEvent('g1', 7, payload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('updateEvent', () => {
    it('sends PATCH to .../events/:id with the payload', () => {
      const payload = eventPayload();
      store.updateEvent('g1', 7, 11, payload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('deleteEvent', () => {
    it('sends DELETE to .../events/:id', () => {
      store.deleteEvent('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('publishEvent', () => {
    it('sends POST to .../events/:id/publish', () => {
      store.publishEvent('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/publish`));
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });
  });

  describe('assignSlot', () => {
    it('sends POST to .../events/:id/slots/assign with the slot coordinates and character id', () => {
      store.assignSlot('g1', 7, 11, 1, 2, 42).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/assign`));
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2, characterId: 42 });
      req.flush(null);
    });
  });

  describe('unassignSlot', () => {
    it('sends POST to .../events/:id/slots/unassign with the slot coordinates', () => {
      store.unassignSlot('g1', 7, 11, 1, 2).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/unassign`));
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2 });
      req.flush(null);
    });
  });

  describe('swapSlotAssignments', () => {
    it('sends POST to .../events/:id/slots/swap with both slot coordinates', () => {
      store.swapSlotAssignments('g1', 7, 11, 1, 2, 3, 4).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/swap`));
      expect(req.request.body).toEqual({ groupNumberA: 1, slotNumberA: 2, groupNumberB: 3, slotNumberB: 4 });
      req.flush(null);
    });
  });

  describe('setMySignup', () => {
    it('sends POST to .../events/:id/signup with the status, character and spec', () => {
      store.setMySignup('g1', 7, 11, SignupStatus.Accepted, 42, 71).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/signup`));
      expect(req.request.body).toEqual({ status: SignupStatus.Accepted, characterId: 42, specId: 71 });
      req.flush(null);
    });
  });

  describe('getSignups', () => {
    it('sends GET to .../events/:id/signups', () => {
      store.getSignups('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/signups`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('joinRaidSignupUpdates / leaveRaidSignupUpdates / onRaidSignupChanged', () => {
    it('delegates joinRaidSignupUpdates to RaidSignupHubService.joinEvent', () => {
      store.joinRaidSignupUpdates('g1', 7, 11);
      expect(signupHub.joinEvent).toHaveBeenCalledWith('g1', 7, 11);
    });

    it('delegates leaveRaidSignupUpdates to RaidSignupHubService.leaveEvent', () => {
      store.leaveRaidSignupUpdates(7, 11);
      expect(signupHub.leaveEvent).toHaveBeenCalledWith(7, 11);
    });

    it('delegates onRaidSignupChanged to RaidSignupHubService.onRaidSignupChanged and returns its unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      signupHub.onRaidSignupChanged.mockReturnValue(unsubscribe);

      const result = store.onRaidSignupChanged(callback);

      expect(signupHub.onRaidSignupChanged).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('updateSlotSpec', () => {
    it('sends PATCH to .../events/:id/slots/spec with the slot coordinates and spec id', () => {
      store.updateSlotSpec('g1', 7, 11, 1, 2, 65).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/events/11/slots/spec`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ groupNumber: 1, slotNumber: 2, specId: 65 });
      req.flush(null);
    });
  });
});
