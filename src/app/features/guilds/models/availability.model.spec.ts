import { DayAvailabilityStatus } from './day-availability-status.enum';
import {
  AvailabilityException,
  DateRange,
  describePartialTime,
  findExceptionForDate,
  formatPartialTimeLabel,
  removeDateFromRange,
} from './availability.model';

const exception = (overrides?: Partial<AvailabilityException>): AvailabilityException => ({
  id: 1,
  startDate: '2026-07-10',
  endDate: '2026-07-12',
  status: DayAvailabilityStatus.Absent,
  reason: null,
  availableFrom: null,
  availableUntil: null,
  ...overrides,
});

describe('findExceptionForDate', () => {
  it.each([
    ['a date strictly inside the range', '2026-07-11'],
    ['the start boundary', '2026-07-10'],
    ['the end boundary', '2026-07-12'],
  ])('returns the exception covering %s (%s)', (_label, date) => {
    const e = exception();
    expect(findExceptionForDate([e], date)).toEqual(e);
  });

  it('returns null when the date is outside every range', () => {
    const e = exception();
    expect(findExceptionForDate([e], '2026-07-13')).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(findExceptionForDate([], '2026-07-11')).toBeNull();
  });

  it('returns the matching exception among several', () => {
    const other = exception({ id: 2, startDate: '2026-08-01', endDate: '2026-08-02' });
    const match = exception({ id: 3, startDate: '2026-07-20', endDate: '2026-07-20' });
    expect(findExceptionForDate([other, match], '2026-07-20')).toEqual(match);
  });
});

describe('describePartialTime', () => {
  it('returns null when neither bound is set', () => {
    expect(describePartialTime(null, null, 'en')).toBeNull();
  });

  it('returns kind "late" when only availableFrom is set', () => {
    const info = describePartialTime('21:30:00', null, 'en');
    expect(info).toEqual({ kind: 'late', from: '21:30', until: null });
  });

  it('returns kind "earlyLeave" when only availableUntil is set', () => {
    const info = describePartialTime(null, '17:00:00', 'en');
    expect(info).toEqual({ kind: 'earlyLeave', from: null, until: '17:00' });
  });

  it('returns kind "window" when both bounds are set', () => {
    const info = describePartialTime('09:00:00', '17:00:00', 'en');
    expect(info).toEqual({ kind: 'window', from: '09:00', until: '17:00' });
  });

  it('formats times as "21h30" for the "fr" locale', () => {
    expect(describePartialTime('21:30:00', null, 'fr')).toEqual({ kind: 'late', from: '21h30', until: null });
  });

  it('formats times as "21h30" for the "fr-FR" locale', () => {
    expect(describePartialTime('21:30:00', null, 'fr-FR')).toEqual({ kind: 'late', from: '21h30', until: null });
  });

  it('keeps "21:30" for the "en" locale', () => {
    expect(describePartialTime('21:30:00', null, 'en')).toEqual({ kind: 'late', from: '21:30', until: null });
  });

  it('keeps "21:30" for the "de" locale', () => {
    expect(describePartialTime('21:30:00', null, 'de')).toEqual({ kind: 'late', from: '21:30', until: null });
  });
});

describe('formatPartialTimeLabel', () => {
  it('joins from/until with an en-dash for "window"', () => {
    const label = formatPartialTimeLabel({ kind: 'window', from: '09:00', until: '17:00' }, () => '');
    expect(label).toBe('09:00 – 17:00');
  });

  it('calls translate with calendar.time.from for "late"', () => {
    const translate = vi.fn(() => 'from-result');
    const label = formatPartialTimeLabel({ kind: 'late', from: '21:30', until: null }, translate);
    expect(translate).toHaveBeenCalledWith('calendar.time.from', { time: '21:30' });
    expect(label).toBe('from-result');
  });

  it('calls translate with calendar.time.until for "earlyLeave"', () => {
    const translate = vi.fn(() => 'until-result');
    const label = formatPartialTimeLabel({ kind: 'earlyLeave', from: null, until: '17:00' }, translate);
    expect(translate).toHaveBeenCalledWith('calendar.time.until', { time: '17:00' });
    expect(label).toBe('until-result');
  });
});

describe('removeDateFromRange', () => {
  it('returns an empty array when the date is the range\'s only day', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-10' };
    expect(removeDateFromRange(range, '2026-07-10')).toEqual([]);
  });

  it('shrinks the range by one day when the date is at the start', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-15' };
    expect(removeDateFromRange(range, '2026-07-10')).toEqual([{ startDate: '2026-07-11', endDate: '2026-07-15' }]);
  });

  it('shrinks the range by one day when the date is at the end', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-15' };
    expect(removeDateFromRange(range, '2026-07-15')).toEqual([{ startDate: '2026-07-10', endDate: '2026-07-14' }]);
  });

  it('splits the range in two when the date is strictly in the middle', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-15' };
    expect(removeDateFromRange(range, '2026-07-12')).toEqual([
      { startDate: '2026-07-10', endDate: '2026-07-11' },
      { startDate: '2026-07-13', endDate: '2026-07-15' },
    ]);
  });

  it('returns the range unchanged when the date is before it', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-15' };
    expect(removeDateFromRange(range, '2026-07-01')).toEqual([range]);
  });

  it('returns the range unchanged when the date is after it', () => {
    const range: DateRange = { startDate: '2026-07-10', endDate: '2026-07-15' };
    expect(removeDateFromRange(range, '2026-08-01')).toEqual([range]);
  });

  it('handles month boundaries correctly when splitting', () => {
    const range: DateRange = { startDate: '2026-06-29', endDate: '2026-07-02' };
    expect(removeDateFromRange(range, '2026-06-30')).toEqual([
      { startDate: '2026-06-29', endDate: '2026-06-29' },
      { startDate: '2026-07-01', endDate: '2026-07-02' },
    ]);
  });
});
