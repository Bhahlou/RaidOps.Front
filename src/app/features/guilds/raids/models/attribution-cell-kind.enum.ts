/**
 * What an `AttributionCell` renders as. Mirrors the back-end enum of the same name — string-valued
 * (not numeric) because the back-end's `JsonStringEnumConverter` always serializes enums as their
 * name in responses, even though it accepts numbers on requests.
 */
export enum AttributionCellKind {
  Icon = 'Icon',
  NameSlot = 'NameSlot',
}
