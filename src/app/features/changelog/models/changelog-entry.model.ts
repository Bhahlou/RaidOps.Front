import { ManualLink } from '../../../shared/components/layout/page-header/page-header.component';

export enum ChangelogEntryType {
  Feature = 'Feature',
  Improvement = 'Improvement',
  Fix = 'Fix',
}

interface ChangelogEntryBase {
  id: string;
  groupId: string;
  date: Date;
  titleKey: string;
  descriptionKey: string;
}

/** Top-level era (e.g. "Foundations") grouping several thematic `ChangelogGroup`s, curated by hand. */
export interface ChangelogEpoch {
  id: string;
  labelKey: string;
}

/** A thematic bundle of changelog entries (e.g. "Raid management"), curated by hand, nested under an epoch. */
export interface ChangelogGroup {
  id: string;
  epochId: string;
  labelKey: string;
}

/** A brand-new shipped feature — must link to the manual article documenting it. */
export interface ChangelogFeatureEntry extends ChangelogEntryBase {
  type: ChangelogEntryType.Feature;
  manualLink: ManualLink;
}

/** An enhancement to an existing feature (not a new one) — also links to the manual article. */
export interface ChangelogImprovementEntry extends ChangelogEntryBase {
  type: ChangelogEntryType.Improvement;
  manualLink: ManualLink;
}

/** A bug fix — a short blurb is enough, no manual link required. */
export interface ChangelogFixEntry extends ChangelogEntryBase {
  type: ChangelogEntryType.Fix;
}

export type ChangelogEntry = ChangelogFeatureEntry | ChangelogImprovementEntry | ChangelogFixEntry;
