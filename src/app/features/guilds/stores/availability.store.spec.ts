import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AvailabilityCalendar } from '../models/availability.model';
import { DayAvailabilityStatus } from '../models/day-availability-status.enum';
import { AvailabilityService } from '../services/availability.service';
import { AvailabilityStore } from './availability.store';

describe('AvailabilityStore', () => {
  describe('loadRange / reload / calendar / isLoading (real HTTP)', () => {
    let store: AvailabilityStore;
    let controller: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [AvailabilityStore, provideHttpClient(), provideHttpClientTesting()],
      });
      store = TestBed.inject(AvailabilityStore);
      controller = TestBed.inject(HttpTestingController);
    });

    afterEach(() => controller.verify());

    it('is null before any range is loaded', () => {
      TestBed.tick();
      expect(store.calendar()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });

    it('fetches the calendar for the given range', async () => {
      store.loadRange('g1', '2026-07-01', '2026-07-31');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.includes('/guilds/g1/availability'));
      expect(req.request.method).toBe('GET');
      req.flush({ days: [], exceptions: [], patterns: [] });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.calendar()).toEqual({ days: [], exceptions: [], patterns: [] });
    });

    it('re-fetches (reload) when called again with the same range, firing exactly one extra request', async () => {
      store.loadRange('g1', '2026-07-01', '2026-07-31');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.includes('/guilds/g1/availability'))
        .flush({ days: [], exceptions: [], patterns: [] } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRange('g1', '2026-07-01', '2026-07-31');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.includes('/guilds/g1/availability'));
      req.flush({
        days: [{ date: '2026-07-05', status: DayAvailabilityStatus.Absent, reason: null, availableFrom: null, availableUntil: null, isException: true }],
        exceptions: [],
        patterns: [],
      } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.calendar()?.days).toHaveLength(1);
      controller.verify();
    });

    it('re-fetches when the range changes', async () => {
      store.loadRange('g1', '2026-07-01', '2026-07-31');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.includes('/guilds/g1/availability'))
        .flush({ days: [], exceptions: [], patterns: [] } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRange('g1', '2026-08-01', '2026-08-31');
      TestBed.tick();

      const req = controller.expectOne(
        (r) => r.url.includes('/guilds/g1/availability') && r.url.includes('rangeStart=2026-08-01'),
      );
      req.flush({ days: [], exceptions: [], patterns: [] } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.calendar()).toEqual({ days: [], exceptions: [], patterns: [] });
    });

    it('reload() re-fetches the currently tracked range', async () => {
      store.loadRange('g1', '2026-07-01', '2026-07-31');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.includes('/guilds/g1/availability'))
        .flush({ days: [], exceptions: [], patterns: [] } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.includes('/guilds/g1/availability'));
      req.flush({
        days: [],
        exceptions: [{ id: 1, startDate: '2026-07-10', endDate: '2026-07-10', status: DayAvailabilityStatus.Absent, reason: null, availableFrom: null, availableUntil: null }],
        patterns: [],
      } as AvailabilityCalendar);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.calendar()?.exceptions).toHaveLength(1);
    });
  });

  describe('command passthroughs (mocked AvailabilityService)', () => {
    let store: AvailabilityStore;
    let service: {
      createException: ReturnType<typeof vi.fn>;
      deleteException: ReturnType<typeof vi.fn>;
      createPattern: ReturnType<typeof vi.fn>;
      updatePattern: ReturnType<typeof vi.fn>;
      deletePattern: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      service = {
        createException: vi.fn().mockReturnValue(of(undefined)),
        deleteException: vi.fn().mockReturnValue(of(undefined)),
        createPattern: vi.fn().mockReturnValue(of(undefined)),
        updatePattern: vi.fn().mockReturnValue(of(undefined)),
        deletePattern: vi.fn().mockReturnValue(of(undefined)),
      };

      TestBed.configureTestingModule({
        providers: [AvailabilityStore, { provide: AvailabilityService, useValue: service }],
      });
      store = TestBed.inject(AvailabilityStore);
    });

    it('createException delegates to AvailabilityService.createException', () => {
      const payload = {
        startDate: '2026-07-10',
        endDate: '2026-07-10',
        status: DayAvailabilityStatus.Absent,
        reason: null,
        availableFrom: null,
        availableUntil: null,
      };

      store.createException('g1', payload).subscribe();

      expect(service.createException).toHaveBeenCalledWith('g1', payload);
    });

    it('deleteException delegates to AvailabilityService.deleteException', () => {
      store.deleteException('g1', 42).subscribe();

      expect(service.deleteException).toHaveBeenCalledWith('g1', 42);
    });

    it('createPattern delegates to AvailabilityService.createPattern', () => {
      const payload = { label: null, cycleLengthDays: 7, anchorDate: '2026-01-05', days: [] };

      store.createPattern('g1', payload).subscribe();

      expect(service.createPattern).toHaveBeenCalledWith('g1', payload);
    });

    it('updatePattern delegates to AvailabilityService.updatePattern', () => {
      const payload = { label: null, cycleLengthDays: 7, anchorDate: '2026-01-05', days: [] };

      store.updatePattern('g1', 7, payload).subscribe();

      expect(service.updatePattern).toHaveBeenCalledWith('g1', 7, payload);
    });

    it('deletePattern delegates to AvailabilityService.deletePattern', () => {
      store.deletePattern('g1', 7).subscribe();

      expect(service.deletePattern).toHaveBeenCalledWith('g1', 7);
    });
  });
});
