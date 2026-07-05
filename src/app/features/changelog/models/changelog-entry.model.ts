import { ManualLink } from '../../../shared/components/page-header/page-header.component';

export enum ChangelogEntryType {
  Feature = 'Feature',
  Fix = 'Fix',
}

interface ChangelogEntryBase {
  id: string;
  date: Date;
  titleKey: string;
  descriptionKey: string;
}

/** A shipped feature — must link to the manual article documenting it. */
export interface ChangelogFeatureEntry extends ChangelogEntryBase {
  type: ChangelogEntryType.Feature;
  manualLink: ManualLink;
}

/** A fix or small improvement — a short blurb is enough, no manual link required. */
export interface ChangelogFixEntry extends ChangelogEntryBase {
  type: ChangelogEntryType.Fix;
}

export type ChangelogEntry = ChangelogFeatureEntry | ChangelogFixEntry;
