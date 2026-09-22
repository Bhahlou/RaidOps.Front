import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { RaidPlansStore } from '../../stores/raid-plans.store';
import { RaidPlanPage } from '../../models/raid-plan-page.model';
import { RaidPlanCanvasComponent } from '../raid-plan-canvas/raid-plan-canvas.component';

/**
 * Read-only view of a boss's strategy board, embedded in the Assignments page (replacing the
 * phase-3 placeholder reserved there). Authoring (adding pages, picking backgrounds, and later
 * editing the canvas itself) happens in Guild Settings' raid-assignments section via
 * `RaidPlanSettingsComponent` — this component never mutates anything, just switches between
 * already-saved pages.
 */
@Component({
  selector: 'app-raid-plan-viewer',
  imports: [TranslocoPipe, EmptyHintComponent, RaidPlanCanvasComponent],
  templateUrl: './raid-plan-viewer.component.html',
  styleUrl: './raid-plan-viewer.component.scss',
})
export class RaidPlanViewerComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly bossId = input.required<number>();

  readonly #store = inject(RaidPlansStore);

  readonly isLoading = computed(() => this.#store.isLoadingPlans() || this.#store.isLoadingPages());
  readonly currentPlan = computed(() => this.#store.plans()[0] ?? null);
  readonly pages = this.#store.pages;

  readonly #selectedPageId = signal<number | null>(null);
  readonly selectedPage = computed(() => this.pages().find((p) => p.id === this.#selectedPageId()) ?? this.pages()[0] ?? null);

  constructor() {
    effect(() => {
      const plan = this.currentPlan();
      this.#store.loadPages(plan?.id ?? null);
    });
  }

  ngOnInit(): void {
    this.#store.loadPlans(this.guildId(), this.bossId());
  }

  selectPage(page: RaidPlanPage): void {
    this.#selectedPageId.set(page.id);
  }
}
