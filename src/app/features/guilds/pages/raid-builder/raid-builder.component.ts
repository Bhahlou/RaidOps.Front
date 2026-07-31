import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { UnassignedMembersStore } from '../../stores/unassigned-members.store';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidSeries } from '../../models/raid-series.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { RaidRosterPoolComponent } from '../../components/raid-roster-pool/raid-roster-pool.component';
import { RaidEventTabsComponent } from '../../components/raid-event-tabs/raid-event-tabs.component';
import { RaidEventGridComponent } from '../../components/raid-event-grid/raid-event-grid.component';
import { UnassignedMembersPanelComponent } from '../../components/unassigned-members-panel/unassigned-members-panel.component';
import { CreateRaidSeriesDialogComponent } from '../../components/create-raid-series-dialog/create-raid-series-dialog.component';
import { CreateRaidEventDialogComponent } from '../../components/create-raid-event-dialog/create-raid-event-dialog.component';
import { EditRaidEventDialogComponent } from '../../components/edit-raid-event-dialog/edit-raid-event-dialog.component';

const RANGE_DAYS = 14;

/**
 * Raid builder page host — tabbed layout (one tab per raid event in the visible date range, see
 * the layout decision in the feature plan): roster pool pinned left (shared across tabs),
 * collapsible unassigned-members drawer on the right, and only the active event's group/slot
 * grid mounted at a time so `CdkDropList`s stay few and simple to wire (a single
 * `cdkDropListGroup` connects the pool and every slot of the active grid).
 */
@Component({
  selector: 'app-raid-builder',
  standalone: true,
  imports: [
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyHintComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkDropListGroup,
    RaidRosterPoolComponent,
    RaidEventTabsComponent,
    RaidEventGridComponent,
    UnassignedMembersPanelComponent,
    TranslocoPipe,
  ],
  templateUrl: './raid-builder.component.html',
  styleUrl: './raid-builder.component.scss',
})
export class RaidBuilderComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #authStore = inject(AuthStore);
  readonly #dialog = inject(Dialog);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly boardStore = inject(RaidBoardStore);
  readonly unassignedStore = inject(UnassignedMembersStore);
  readonly seriesStore = inject(RaidSeriesStore);

  // currentGuildId (not the static guildId snapshot) — this leaf route component is reused
  // (not recreated) when only the parent's :id param changes, e.g. switching guilds.
  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.raidBuilder'));

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  readonly rangeStart = signal(startOfWeek(new Date()));
  readonly rangeEnd = computed(() => addDays(this.rangeStart(), RANGE_DAYS - 1));

  readonly rangeLabel = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    const formatter = new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { day: 'numeric', month: 'short' });
    return `${formatter.format(this.rangeStart())} – ${formatter.format(this.rangeEnd())}`;
  });

  readonly events = this.boardStore.events;
  readonly isLoading = this.boardStore.isLoading;
  readonly unassignedMembers = this.unassignedStore.members;
  readonly unassignedLoading = this.unassignedStore.isLoading;
  readonly activeSeries = computed(() => (this.seriesStore.series() ?? []).filter((s) => s.isActive));

  readonly panelCollapsed = signal(false);
  readonly activeEventId = signal<number | null>(null);
  readonly activeEvent = computed(() => this.events().find((e) => e.id === this.activeEventId()) ?? null);

  constructor() {
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      const rangeStart = toIsoDate(this.rangeStart());
      const rangeEnd = toIsoDate(this.rangeEnd());
      this.boardStore.loadRange(guildId, guildBranchId, rangeStart, rangeEnd);
      this.unassignedStore.loadRange(guildId, guildBranchId, rangeStart, rangeEnd);
      this.seriesStore.load(guildId, guildBranchId);
    });

    // Keeps the active tab valid — defaults to the earliest scheduled event whenever the
    // currently selected one disappears (range navigated away, event cancelled/deleted, first load...).
    effect(() => {
      const events = this.events();
      const currentId = untracked(() => this.activeEventId());
      if (events.some((e) => e.id === currentId)) return;

      const next = pickDefaultEvent(events);
      untracked(() => this.activeEventId.set(next));
    });
  }

  prevRange(): void {
    this.rangeStart.update((d) => addDays(d, -RANGE_DAYS));
  }

  nextRange(): void {
    this.rangeStart.update((d) => addDays(d, RANGE_DAYS));
  }

  goToday(): void {
    this.rangeStart.set(startOfWeek(new Date()));
  }

  selectEvent(id: number): void {
    this.activeEventId.set(id);
  }

  openCreateSeriesDialog(series: RaidSeries | null): void {
    this.#dialog
      .open<boolean>(CreateRaidSeriesDialogComponent, {
        width: 'min(720px, 95vw)',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), series },
      })
      .closed.subscribe((saved) => {
        if (!saved) return;
        this.seriesStore.reload();
        this.#reloadBoard();
      });
  }

  deactivateSeries(series: RaidSeries): void {
    this.seriesStore.deactivateSeries(this.guildId(), this.guildBranchId(), series.id).subscribe({
      next: () => {
        this.#snackbar.success('raidBuilder.series.deactivateSuccess');
        this.seriesStore.reload();
      },
      error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
    });
  }

  openCreateEventDialog(): void {
    this.#dialog
      .open<boolean>(CreateRaidEventDialogComponent, {
        width: 'min(720px, 95vw)',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId() },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#reloadBoard();
      });
  }

  openEditEventDialog(event: RaidEvent): void {
    this.#dialog
      .open<boolean>(EditRaidEventDialogComponent, {
        width: 'min(720px, 95vw)',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), event },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#reloadBoard();
      });
  }

  #reloadBoard(): void {
    this.boardStore.reload();
    this.unassignedStore.reload();
  }
}

/** Earliest scheduled event, falling back to the earliest event of any status, or `null` if empty. */
function pickDefaultEvent(events: RaidEvent[]): number | null {
  if (events.length === 0) return null;
  const sorted = [...events].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));
  return (sorted.find((e) => e.status === RaidEventStatus.Scheduled) ?? sorted[0]).id;
}

/** Monday of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const dayOfWeek = (date.getDay() + 6) % 7; // 0 = Monday, ..., 6 = Sunday
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - dayOfWeek);
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
