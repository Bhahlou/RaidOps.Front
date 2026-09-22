import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidPlansStore } from '../../../raids/stores/raid-plans.store';
import { RaidPlansService } from '../../../raids/services/raid-plans.service';
import { RaidPlanPage } from '../../../raids/models/raid-plan-page.model';
import { RaidPlanCanvasComponent } from '../../../raids/components/raid-plan-canvas/raid-plan-canvas.component';
import { RaidPlanPageDialogComponent, RaidPlanPageDialogData } from '../raid-plan-page-dialog/raid-plan-page-dialog.component';
import {
  RaidPlanBackgroundPickerDialogComponent,
  RaidPlanBackgroundPickerDialogData,
} from '../raid-plan-background-picker-dialog/raid-plan-background-picker-dialog.component';

/**
 * The authoring side of a boss's strategy board — page tabs (add/rename/delete), background
 * picker, and the canvas itself — reached from Guild Settings' raid-assignments picker, next to
 * the attribution-template editor. The read-only counterpart shown to everyone on the
 * Assignments page is `RaidPlanViewerComponent`. V1 only ever surfaces a single board per boss,
 * auto-created on the officer's first click; the `RaidPlan` entity itself already supports
 * several per boss for a later UI to expose.
 */
@Component({
  selector: 'app-raid-plan-settings',
  imports: [TranslocoPipe, ButtonComponent, IconButtonComponent, EmptyHintComponent, RaidPlanCanvasComponent],
  templateUrl: './raid-plan-settings.component.html',
  styleUrl: './raid-plan-settings.component.scss',
})
export class RaidPlanSettingsComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly bossId = input.required<number>();
  readonly raidZoneShortCode = input.required<string>();

  readonly #store = inject(RaidPlansStore);
  readonly #plansService = inject(RaidPlansService);
  readonly #dialog = inject(Dialog);
  readonly #snackbar = inject(SnackbarService);

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

  createBoard(): void {
    this.#plansService.createPlan(this.guildId(), this.bossId(), 'Default').subscribe({
      next: () => this.#store.reloadPlans(),
      error: () => this.#snackbar.error('errors.server'),
    });
  }

  selectPage(page: RaidPlanPage): void {
    this.#selectedPageId.set(page.id);
  }

  openCreatePageDialog(): void {
    this.#openPageDialog(null);
  }

  openRenamePageDialog(page: RaidPlanPage): void {
    this.#openPageDialog(page);
  }

  #openPageDialog(page: RaidPlanPage | null): void {
    const plan = this.currentPlan();
    if (!plan) return;

    this.#dialog
      .open<boolean>(RaidPlanPageDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { guildId: this.guildId(), raidPlanId: plan.id, page } satisfies RaidPlanPageDialogData,
      })
      .closed.subscribe((saved) => {
        if (saved) this.#store.reloadPages();
      });
  }

  deletePage(page: RaidPlanPage): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.raidPlan.deleteConfirmTitle',
          message: 'raidBuilder.raidPlan.deleteConfirmMessage',
          messageParams: { name: page.name },
        },
      })
      .closed.subscribe((confirmed) => {
        const plan = this.currentPlan();
        if (!confirmed || !plan) return;

        this.#plansService.deletePage(this.guildId(), plan.id, page.id).subscribe({
          next: () => {
            if (this.#selectedPageId() === page.id) this.#selectedPageId.set(null);
            this.#store.reloadPages();
          },
          error: () => this.#snackbar.error('errors.server'),
        });
      });
  }

  openBackgroundPicker(): void {
    const plan = this.currentPlan();
    const page = this.selectedPage();
    if (!plan || !page) return;

    this.#dialog
      .open<string | null | undefined>(RaidPlanBackgroundPickerDialogComponent, {
        width: 'min(640px, 96vw)',
        data: { zoneShortCode: this.raidZoneShortCode() } satisfies RaidPlanBackgroundPickerDialogData,
      })
      .closed.subscribe((key) => {
        if (key === undefined) return;

        this.#plansService.setPageBackground(this.guildId(), plan.id, page.id, key).subscribe({
          next: () => this.#store.reloadPages(),
          error: (err: HttpErrorResponse) => this.#snackbar.error(err.error?.error ? `raidBuilder.raidPlan.errors.${err.error.error}` : 'errors.server'),
        });
      });
  }
}
