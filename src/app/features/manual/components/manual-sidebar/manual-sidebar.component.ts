import { Location } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ManualStore } from '../../stores/manual.store';
import { DiscordBrandIconComponent } from '../../../../shared/components/icons/discord-brand-icon/discord-brand-icon.component';

@Component({
  selector: 'app-manual-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, DiscordBrandIconComponent],
  templateUrl: './manual-sidebar.component.html',
  styleUrl: './manual-sidebar.component.scss',
})
export class ManualSidebarComponent {
  readonly #manualStore = inject(ManualStore);
  readonly #location = inject(Location);

  /** Mobile drawer open state — irrelevant on desktop, where the sidebar is always visible. */
  readonly isOpen = input(false);
  readonly closeRequested = output<void>();

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

  /** Following a link closes the mobile drawer — desktop ignores the emit (isOpen stays false). */
  onArticleClick(): void {
    this.closeRequested.emit();
  }
}
