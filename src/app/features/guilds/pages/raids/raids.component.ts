import { Component, computed, effect, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';
import { BranchTabsComponent } from '../../components/branch-tabs/branch-tabs.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { RaidSeries } from '../../models/raid-series.model';
import { countRaidRoles, RAID_ROLE_ICON, RAID_ROLE_ORDER, RaidRole } from '../../utils/raid-role.util';
import { raidZoneIconUrl } from '../../utils/raid-zone-icon.util';
import { RaidRosterPoolComponent } from '../../components/raid-roster-pool/raid-roster-pool.component';
import { RaidEventGridComponent } from '../../components/raid-event-grid/raid-event-grid.component';
import { CreateRaidSeriesDialogComponent } from '../../components/create-raid-series-dialog/create-raid-series-dialog.component';
import { DeactivateRaidSeriesDialogComponent } from '../../components/deactivate-raid-series-dialog/deactivate-raid-series-dialog.component';
import { CreateRaidEventDialogComponent } from '../../components/create-raid-event-dialog/create-raid-event-dialog.component';
import { EditRaidEventDialogComponent } from '../../components/edit-raid-event-dialog/edit-raid-event-dialog.component';
import { parseIsoDate } from '../../../calendar/utils/iso-date.util';

// One page = one weekly lockout window (region reset to region reset) — see rangeStart's default below.
const RANGE_DAYS = 7;
// Side-by-side raid panels are readable up to about this many at once — beyond that the grids get too cramped.
const MAX_VISIBLE_EVENTS = 4;

/**
 * Raids page host — shared by roster members (read-only) and officers (drag & drop composition),
 * gated per-action via `isOfficer()` rather than a separate route. Up to `MAX_VISIBLE_EVENTS`
 * events (earliest first) render stacked one under the other as full group/slot grids, each panel
 * carrying its own date/zones/status — no manual picking, matching how a split raid night reads
 * better with every group visible at once than tabbed one at a time. The roster pool is a single
 * shared drag source across every visible grid (`cdkDropListGroup` connects them all). Below the
 * narrow container tier (see raids.component.scss), every panel still renders (drag/drop keeps
 * working identically) but only `activeEventId()`'s panel is shown, with a pill switcher to jump
 * between events — one raid at a time reads far better than a long vertical scroll on a phone.
 */
@Component({
  selector: 'app-raids',
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
    RaidEventGridComponent,
    BranchTabsComponent,
    TranslocoPipe,
  ],
  templateUrl: './raids.component.html',
  styleUrl: './raids.component.scss',
})
export class RaidsComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #authStore = inject(AuthStore);
  readonly #dialog = inject(Dialog);
  readonly #transloco = inject(TranslocoService);

  readonly boardStore = inject(RaidBoardStore);
  readonly seriesStore = inject(RaidSeriesStore);
  readonly #rosterStore = inject(GuildRosterStore);

  // currentGuildId (not the static guildId snapshot) — this leaf route component is reused
  // (not recreated) when only the parent's :id param changes, e.g. switching guilds.
  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.raidBuilder'));

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  /** Highlights the viewer's own characters (yellow outline) wherever a character chip is rendered. */
  readonly currentUserDiscordId = computed(() => this.#authStore.user()?.discordId ?? null);

  readonly PublicationStatus = RaidPublicationStatus;
  readonly roleOrder = RAID_ROLE_ORDER;
  readonly roleIcon = RAID_ROLE_ICON;

  readonly rangeStart = signal(startOfWeek(new Date()));
  readonly rangeEnd = computed(() => addDays(this.rangeStart(), RANGE_DAYS - 1));

  readonly rangeLabel = computed(() => {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    const formatter = new Intl.DateTimeFormat(this.#transloco.getActiveLang(), { day: 'numeric', month: 'short' });
    return `${formatter.format(this.rangeStart())} – ${formatter.format(this.rangeEnd())}`;
  });

  readonly events = this.boardStore.events;
  readonly isLoading = this.boardStore.isLoading;
  readonly activeSeries = computed(() => (this.seriesStore.series() ?? []).filter((s) => s.isActive));
  readonly rosterMembers = computed(() => this.#rosterStore.members() ?? []);

  /** Up to MAX_VISIBLE_EVENTS events (earliest first). */
  readonly visibleEvents = computed(() =>
    [...this.events()].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc)).slice(0, MAX_VISIBLE_EVENTS),
  );

  /**
   * Which panel shows alone in the narrow (single-panel) container tier — irrelevant above that
   * width, where every visible event stacks. Tracked by event id (not index) so it survives a
   * board reload untouched as long as the same event is still in range; falls back to the
   * earliest visible event once the stored id no longer matches anything (range change, or the
   * event itself got deleted), rather than leaving every panel hidden.
   */
  readonly #activeEventId = signal<number | null>(null);
  readonly activeEventId = computed(() => {
    const events = this.visibleEvents();
    const stored = this.#activeEventId();
    return events.some((e) => e.id === stored) ? stored : (events[0]?.id ?? null);
  });

  constructor() {
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      const rangeStart = toIsoDate(this.rangeStart());
      const rangeEnd = toIsoDate(this.rangeEnd());
      this.boardStore.loadRange(guildId, guildBranchId, rangeStart, rangeEnd);
      this.seriesStore.load(guildId, guildBranchId);
      this.#rosterStore.loadRoster(guildId, guildBranchId);
    });

    // Defaults the view to the branch's current weekly lockout window (region reset to region
    // reset) instead of an arbitrary Monday-based week. Falls back to the initial Monday default
    // when the branch has no region configured yet (weekStartLocal comes back null).
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      this.boardStore.getLockoutWeek(guildId, guildBranchId).subscribe((week) => {
        if (week.weekStartLocal) this.rangeStart.set(parseIsoDate(week.weekStartLocal));
      });
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

  openCreateSeriesDialog(series: RaidSeries | null): void {
    this.#dialog
      .open<boolean>(CreateRaidSeriesDialogComponent, {
        width: 'min(720px, 95vw)',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), series },
      })
      .closed.subscribe((saved) => {
        if (!saved) return;
        this.seriesStore.reload();
        // A series creates no RaidEvent rows by itself — occurrences only appear once
        // materialized. `#reloadBoard` alone (a plain re-fetch) would keep showing the same
        // empty range, so re-run `loadRange` for the currently viewed week to materialize the
        // new series' occurrence(s) in it before reloading.
        this.boardStore.loadRange(this.guildId(), this.guildBranchId(), toIsoDate(this.rangeStart()), toIsoDate(this.rangeEnd()));
      });
  }

  openDeactivateSeriesDialog(series: RaidSeries): void {
    this.#dialog
      .open<boolean>(DeactivateRaidSeriesDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), series },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.seriesStore.reload();
        this.#reloadBoard();
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
  }

  eventLabel(event: RaidEvent): string {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    const lang = this.#transloco.getActiveLang();
    const date = new Date(event.startsAtUtc);
    const dayFormatter = new Intl.DateTimeFormat(lang, { weekday: 'short', day: '2-digit', month: '2-digit' });
    const timeFormatter = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
    return `${dayFormatter.format(date)} ${timeFormatter.format(date)}`;
  }

  zoneIcon(shortCode: string): string | null {
    return raidZoneIconUrl(shortCode);
  }

  roleCounts(event: RaidEvent): Record<RaidRole, number> {
    return countRaidRoles(event.assignments);
  }

  selectEvent(eventId: number): void {
    this.#activeEventId.set(eventId);
  }

  isActiveEvent(eventId: number): boolean {
    return eventId === this.activeEventId();
  }
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
