import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { AvailabilityCalendarGridComponent, CalendarGridDay } from './availability-calendar-grid.component';
import { DayAvailabilityStatus } from '../../models/day-availability-status.enum';
import { ResolvedDayAvailability } from '../../models/availability.model';

const resolved = (overrides?: Partial<ResolvedDayAvailability>): ResolvedDayAvailability => ({
  date: '2026-07-20',
  status: DayAvailabilityStatus.Available,
  reason: null,
  availableFrom: null,
  availableUntil: null,
  isException: false,
  ...overrides,
});

const day = (overrides?: Partial<CalendarGridDay>): CalendarGridDay => ({
  date: new Date(2026, 6, 20),
  iso: '2026-07-20',
  inCurrentMonth: true,
  isToday: false,
  resolved: null,
  ...overrides,
});

describe('AvailabilityCalendarGridComponent', () => {
  let transloco: {
    getActiveLang: ReturnType<typeof vi.fn>;
    activeLang: ReturnType<typeof signal>;
    translate: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<AvailabilityCalendarGridComponent>;

  const setup = (days: CalendarGridDay[]) => {
    transloco = {
      getActiveLang: vi.fn(() => 'fr'),
      activeLang: signal('fr'),
      translate: vi.fn((key: string, params?: Record<string, string>) => (params ? `${key}:${JSON.stringify(params)}` : key)),
    };

    TestBed.configureTestingModule({
      imports: [AvailabilityCalendarGridComponent],
      providers: [{ provide: TranslocoService, useValue: transloco }],
    });

    fixture = TestBed.createComponent(AvailabilityCalendarGridComponent);
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup([day()])).toBeTruthy();
  });

  describe('weekdayLabels', () => {
    it('returns 7 Monday-first short weekday labels', () => {
      const component = setup([day()]);

      expect(component.weekdayLabels().length).toBe(7);
    });
  });

  describe('statusClass', () => {
    it('returns status-absent for an Absent day', () => {
      const component = setup([day()]);

      expect(component.statusClass(day({ resolved: resolved({ status: DayAvailabilityStatus.Absent }) }))).toBe('status-absent');
    });

    it('returns status-partial for a Partial day', () => {
      const component = setup([day()]);

      expect(component.statusClass(day({ resolved: resolved({ status: DayAvailabilityStatus.Partial }) }))).toBe('status-partial');
    });

    it('returns status-available for an Available day', () => {
      const component = setup([day()]);

      expect(component.statusClass(day({ resolved: resolved({ status: DayAvailabilityStatus.Available }) }))).toBe('status-available');
    });

    it('returns status-available when resolved is null', () => {
      const component = setup([day()]);

      expect(component.statusClass(day({ resolved: null }))).toBe('status-available');
    });
  });

  describe('dayLabel', () => {
    it('returns the day-of-month number as a string', () => {
      const component = setup([day()]);

      expect(component.dayLabel(day({ date: new Date(2026, 6, 20) }))).toBe('20');
    });
  });

  describe('detailLabel', () => {
    it('returns null when resolved is null', () => {
      const component = setup([day()]);

      expect(component.detailLabel(day({ resolved: null }))).toBeNull();
    });

    it('returns just the reason for a non-Partial day with a reason', () => {
      const component = setup([day()]);

      expect(component.detailLabel(day({ resolved: resolved({ status: DayAvailabilityStatus.Absent, reason: 'Vacances' }) }))).toBe('Vacances');
    });

    it('returns null for a non-Partial day with no reason', () => {
      const component = setup([day()]);

      expect(component.detailLabel(day({ resolved: resolved({ status: DayAvailabilityStatus.Absent, reason: null }) }))).toBeNull();
    });

    it('returns null for a Partial day with no reason and no time bounds set', () => {
      const component = setup([day()]);

      const label = component.detailLabel(day({
        resolved: resolved({ status: DayAvailabilityStatus.Partial, reason: null, availableFrom: null, availableUntil: null }),
      }));

      expect(label).toBeNull();
    });

    it('returns just the time label for a Partial day with only a time bound and no reason', () => {
      const component = setup([day()]);

      const label = component.detailLabel(day({
        resolved: resolved({ status: DayAvailabilityStatus.Partial, reason: null, availableFrom: '21:30:00' }),
      }));

      expect(label).not.toBeNull();
      expect(transloco.translate).toHaveBeenCalledWith('calendar.time.from', { time: '21h30' });
    });

    it('combines reason and time label for a Partial day with both', () => {
      const component = setup([day()]);

      const label = component.detailLabel(day({
        resolved: resolved({ status: DayAvailabilityStatus.Partial, reason: 'Boulot', availableFrom: '21:30:00' }),
      }));

      expect(label).toContain('Boulot (');
      expect(transloco.translate).toHaveBeenCalledWith('calendar.time.from', { time: '21h30' });
    });
  });

  describe('onDayClick', () => {
    it('emits the clicked day via dayClick', () => {
      const component = setup([day()]);
      const emitted: CalendarGridDay[] = [];
      component.dayClick.subscribe((d) => emitted.push(d));
      const clicked = day({ iso: '2026-07-25' });

      component.onDayClick(clicked);

      expect(emitted).toEqual([clicked]);
    });
  });
});
