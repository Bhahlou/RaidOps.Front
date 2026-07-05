import { Location } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { ManualStore } from '../../stores/manual.store';
import { DiscordBrandIconComponent } from '../../../../shared/components/discord-brand-icon/discord-brand-icon.component';

@Component({
  selector: 'app-manual-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, TranslocoPipe, DiscordBrandIconComponent],
  templateUrl: './manual-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './manual-sidebar.component.scss',
})
export class ManualSidebarComponent {
  readonly #manualStore = inject(ManualStore);
  readonly #location = inject(Location);

  readonly categories = this.#manualStore.categories;

  /** All categories start expanded — the list is small enough that collapsing adds friction, not clarity. */
  readonly openCategoryIds = signal<Set<string>>(
    new Set(this.categories.map((category) => category.id)),
  );

  goBack(): void {
    this.#location.back();
  }

  toggleCategory(id: string): void {
    this.openCategoryIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
}
