/** A member's declared availability for a single calendar day. */
export enum DayAvailabilityStatus {
  /** Explicitly available — only meaningful as a one-off override of a recurring pattern. */
  Available = 'Available',
  /** Not available at all for the day. */
  Absent = 'Absent',
  /** Available for part of the day only, bounded by `availableFrom`/`availableUntil`. */
  Partial = 'Partial',
}
