import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangelogStore } from './stores/changelog.store';
import { ChangelogEntry, ChangelogEntryType } from './models/changelog-entry.model';

const TYPE_LABEL_KEYS: Record<ChangelogEntryType, string> = {
  [ChangelogEntryType.Feature]: 'changelog.type.feature',
  [ChangelogEntryType.Improvement]: 'changelog.type.improvement',
  [ChangelogEntryType.Fix]: 'changelog.type.fix',
};

@Component({
  selector: 'app-changelog',
  imports: [RouterLink, CdkAccordion, CdkAccordionItem, TranslocoPipe],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.scss',
})
export class ChangelogComponent {
  readonly #changelogStore = inject(ChangelogStore);
  readonly #location = inject(Location);
  readonly #transloco = inject(TranslocoService);

  readonly groupedEntries = this.#changelogStore.groupedEntries;
  readonly EntryType = ChangelogEntryType;

  // CDK's `[expanded]` input fires `(opened)`/`(closed)` even on its *first* render (whenever the
  // bound value differs from the item's internal default of `false`), so a group/epoch that
  // starts expanded-by-default (unseen) emits `opened` once immediately. These maps record the
  // *actual current* expanded state explicitly (set from that same event), rather than toggling
  // blindly, so that initial emission just confirms the default instead of flipping it.
  readonly #epochExpanded = signal<ReadonlyMap<string, boolean>>(new Map());
  readonly #groupExpanded = signal<ReadonlyMap<string, boolean>>(new Map());

  goBack(): void {
    this.#location.back();
  }

  isUnseen(entry: ChangelogEntry): boolean {
    return this.#changelogStore.isUnseen(entry.id);
  }

  typeLabelKey(entry: ChangelogEntry): string {
    return TYPE_LABEL_KEYS[entry.type];
  }

  isEpochExpanded(epochId: string): boolean {
    return this.#epochExpanded().get(epochId) ?? this.#changelogStore.isEpochUnseen(epochId);
  }

  setEpochExpanded(epochId: string, expanded: boolean): void {
    this.#epochExpanded.set(new Map(this.#epochExpanded()).set(epochId, expanded));
  }

  isGroupExpanded(groupId: string): boolean {
    return this.#groupExpanded().get(groupId) ?? this.#changelogStore.isGroupUnseen(groupId);
  }

  setGroupExpanded(groupId: string, expanded: boolean): void {
    this.#groupExpanded.set(new Map(this.#groupExpanded()).set(groupId, expanded));
    if (expanded) this.#changelogStore.markGroupSeen(groupId);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { dateStyle: 'long' }).format(
      date,
    );
  }
}
