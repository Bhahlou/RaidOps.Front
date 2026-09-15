/**
 * What an icon-kind `AttributionCell` is sourced from. Mirrors the back-end enum of the same name
 * — string-valued (not numeric) because the back-end's `JsonStringEnumConverter` always serializes
 * enums as their name in responses, even though it accepts numbers on requests.
 */
export enum AttributionIconSource {
  None = 'None',
  Spell = 'Spell',
  RaidMarker = 'RaidMarker',
  StaticRole = 'StaticRole',
}
