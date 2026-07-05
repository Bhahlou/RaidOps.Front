import { Location } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangelogStore } from './stores/changelog.store';
import { ChangelogEntry, ChangelogEntryType } from './models/changelog-entry.model';

@Component({
  selector: 'app-changelog',
  imports: [RouterLink, MatIconModule, TranslocoPipe],
  templateUrl: './changelog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './changelog.component.scss',
})
export class ChangelogComponent {
  readonly #changelogStore = inject(ChangelogStore);
  readonly #location = inject(Location);
  readonly #transloco = inject(TranslocoService);

  readonly entries = this.#changelogStore.entries;
  readonly EntryType = ChangelogEntryType;

  constructor() {
    this.#changelogStore.markAllSeen();
  }

  goBack(): void {
    this.#location.back();
  }

  isUnseen(entry: ChangelogEntry): boolean {
    return this.#changelogStore.isUnseen(entry.id);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { dateStyle: 'long' }).format(
      date,
    );
  }
}
