/**
 * Draft/published status of a `RaidEvent`, orthogonal to its `RaidEventStatus` lifecycle. A raid
 * is prepared privately as a draft and only becomes visible to regular roster members once an
 * officer explicitly publishes it.
 */
export enum RaidPublicationStatus {
  /** Being prepared by officers — hidden from non-officer roster members. */
  Draft = 'Draft',
  /** Officially published — visible to every roster member. */
  Published = 'Published',
}
