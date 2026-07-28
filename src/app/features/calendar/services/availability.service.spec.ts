import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  AvailabilityCalendar,
  CreateAvailabilityExceptionPayload,
  CreateRecurringAvailabilityPatternPayload,
  UpdateAvailabilityExceptionPayload,
  UpdateRecurringAvailabilityPatternPayload,
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
    it('sends GET to /me/availability with rangeStart/rangeEnd params', () => {
      const expected: AvailabilityCalendar = { days: [], exceptions: [], patterns: [] };
      let result: AvailabilityCalendar | undefined;

      service.getMyAvailability('2026-07-01', '2026-07-31').subscribe((r) => (result = r));

      const req = controller.expectOne(
        (r) =>
          r.url.endsWith('/me/availability') &&
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
    it('sends POST to /me/availability/exceptions with the payload', () => {
      const payload: CreateAvailabilityExceptionPayload = {
        guildId: null,
        guildBranchId: null,
        startDate: '2026-07-10',
        endDate: '2026-07-10',
        status: DayAvailabilityStatus.Absent,
        reason: 'Vacances',
        availableFrom: null,
        availableUntil: null,
      };

      service.createException(payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/exceptions'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── updateException ──────────────────────────────────────────────────────

  describe('updateException', () => {
    it('sends PATCH to /me/availability/exceptions/:exceptionId with the payload', () => {
      const payload: UpdateAvailabilityExceptionPayload = {
        startDate: '2026-07-10',
        endDate: '2026-07-12',
        status: DayAvailabilityStatus.Absent,
        reason: 'Vacances',
        availableFrom: null,
        availableUntil: null,
      };

      service.updateException(42, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/exceptions/42'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── removeExceptionDay ───────────────────────────────────────────────────

  describe('removeExceptionDay', () => {
    it('sends POST to /me/availability/exceptions/:exceptionId/remove-day with the date', () => {
      service.removeExceptionDay(42, '2026-07-11').subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/exceptions/42/remove-day'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ date: '2026-07-11' });
      req.flush(null);
    });
  });

  // ── deleteException ──────────────────────────────────────────────────────

  describe('deleteException', () => {
    it('sends DELETE to /me/availability/exceptions/:exceptionId', () => {
      service.deleteException(42).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/exceptions/42'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── createPattern ─────────────────────────────────────────────────────────

  describe('createPattern', () => {
    it('sends POST to /me/availability/patterns with the payload', () => {
      const payload: CreateRecurringAvailabilityPatternPayload = {
        guildId: null,
        guildBranchId: null,
        label: 'Raid nights',
        cycleLengthDays: 7,
        anchorDate: '2026-01-05',
        days: [],
      };

      service.createPattern(payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/patterns'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── updatePattern ─────────────────────────────────────────────────────────

  describe('updatePattern', () => {
    it('sends PATCH to /me/availability/patterns/:patternId with the payload', () => {
      const payload: UpdateRecurringAvailabilityPatternPayload = {
        label: 'Raid nights',
        cycleLengthDays: 7,
        anchorDate: '2026-01-05',
        days: [],
      };

      service.updatePattern(7, payload).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/patterns/7'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  // ── deletePattern ─────────────────────────────────────────────────────────

  describe('deletePattern', () => {
    it('sends DELETE to /me/availability/patterns/:patternId', () => {
      service.deletePattern(7).subscribe();

      const req = controller.expectOne((r) => r.url.endsWith('/me/availability/patterns/7'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
