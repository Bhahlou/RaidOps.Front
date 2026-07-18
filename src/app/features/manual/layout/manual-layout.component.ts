import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ManualSidebarComponent } from '../components/manual-sidebar/manual-sidebar.component';

@Component({
  selector: 'app-manual-layout',
  imports: [RouterOutlet, TranslocoPipe, ManualSidebarComponent],
  templateUrl: './manual-layout.component.html',
  styleUrl: './manual-layout.component.scss',
})
export class ManualLayoutComponent {
  readonly #location = inject(Location);

  /** Mobile-only drawer state — the sidebar is always visible on desktop. */
  readonly isSidebarOpen = signal(false);

  /** Duplicated from ManualSidebarComponent so mobile users can go back without opening the drawer. */
  goBack(): void {
    this.#location.back();
  }
}
