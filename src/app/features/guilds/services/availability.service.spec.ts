import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  RecurringAvailabilityPatternPayload,
} from '../models/availability.model';
import { DayAvailabilityStatus } from '../models/day-availability-status.enum';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AvailabilityService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AvailabilityService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── getMyAvailability ─────────────────────────────────────────────────────

  describe('getMyAvailability', () => {
    it('sends GET to /guilds/:id/availability with rangeStart/rangeEnd params', () => {
      const expected: AvailabilityCalendar = { days: [], exceptions: [], patterns: [] };
      let result: AvailabilityCalendar | undefined;

      service.getMyAvailability('guild-1', '2026-07-01', '2026-07-31').subscribe((r) => (result = r));

      const req = controller.expectOne(
        (r) =>
          r.url.endsWith('/guilds/guild-1/availability') &&
          r.params.get('rangeStart') === '2026-07-01' &&
          r.params.get('rangeEnd') === '2026-07-31',
      );
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  // ── createException ──────────────────────────────────────────────────────

  describe('createException', () => {
    it('sends POST to /guilds/:id/availability/exceptions with the payload', () => {
      const payload: CreateAvailabilityExceptionPayload = {
        startDate: '2026-07-10',
        endDate: '2026-07-10',
        status: DayAvailabilityStatus.Absent,
        reason: 'Vacances',
        availableFrom: null,
        availableUntil: null,
      };

      service.createException('guild-1', payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/availability/exceptions'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── deleteException ──────────────────────────────────────────────────────

  describe('deleteException', () => {
    it('sends DELETE to /guilds/:id/availability/exceptions/:exceptionId', () => {
      service.deleteException('guild-1', 42).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/availability/exceptions/42'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── createPattern ─────────────────────────────────────────────────────────

  describe('createPattern', () => {
    it('sends POST to /guilds/:id/availability/patterns with the payload', () => {
      const payload: RecurringAvailabilityPatternPayload = {
        label: 'Raid nights',
        cycleLengthDays: 7,
        anchorDate: '2026-01-05',
        days: [],
      };

      service.createPattern('guild-1', payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/availability/patterns'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── updatePattern ─────────────────────────────────────────────────────────

  describe('updatePattern', () => {
    it('sends PATCH to /guilds/:id/availability/patterns/:patternId with the payload', () => {
      const payload: RecurringAvailabilityPatternPayload = {
        label: 'Raid nights',
        cycleLengthDays: 7,
        anchorDate: '2026-01-05',
        days: [],
      };

      service.updatePattern('guild-1', 7, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/availability/patterns/7'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── deletePattern ─────────────────────────────────────────────────────────

  describe('deletePattern', () => {
    it('sends DELETE to /guilds/:id/availability/patterns/:patternId', () => {
      service.deletePattern('guild-1', 7).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/guild-1/availability/patterns/7'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
