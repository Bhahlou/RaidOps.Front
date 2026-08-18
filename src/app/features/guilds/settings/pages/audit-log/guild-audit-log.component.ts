import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../../shared/components/layout/page-header/page-header.component';
import { DiscordIconComponent } from '../../../../../shared/components/icons/discord-icon/discord-icon.component';
import { DateRangeInputComponent } from '../../../../../shared/components/form/date-range-input/date-range-input.component';
import {
  FilterMenuComponent,
  FilterOption,
} from '../../../../../shared/components/form/filter-menu/filter-menu.component';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import {
  CLASS_COLORS,
  WowClassIconComponent,
} from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { DiscordIconType } from '../../../../../shared/models/discord-icon-type.enum';
import { formatDiscordColor } from '../../../../../shared/utils/discord-color.util';
import { injectGuildContext } from '../../../inject-guild-context';
import { AuditLogStore } from '../../stores/audit-log.store';
import { AuditLogEntry } from '../../models/audit-log-entry.model';
import { GuildAuditAction } from '../../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../../models/guild-audit-category.enum';
import { RosterMode } from '../../../models/roster-mode.enum';
import { SignupMode } from '../../../raids/models/signup-mode.enum';
import { DayAvailabilityStatus } from '../../../../calendar/models/day-availability-status.enum';
import { describePartialTime, formatPartialTimeLabel } from '../../../../calendar/models/availability.model';

type SortColumn = 'actor' | 'category' | 'action' | 'change' | 'time';
type SortDirection = 'asc' | 'desc';

interface ActorOption {
  id: string;
  name: string;
}

interface SettingsFieldChange {
  labelKey: string;
  summary: string;
  roleChange?: { old: RoleDisplay | null; new: RoleDisplay | null };
}

/** One day of a recurring pattern's cycle, as JSON-encoded into a RecurringAvailabilityPattern* audit entry's `days` variable. */
interface AuditPatternDay {
  offsetInCycle: number;
  status: string;
  availableFrom: string | null;
  availableUntil: string | null;
}

interface RoleDisplay {
  name: string;
  color: string | null;
  iconUrl: string | null;
}

interface GuildRegisteredDisplay {
  name: string;
  iconHash: string | null;
}

interface CharacterChangeDisplay {
  name: string;
  classId: number | null;
  color: string | null;
}

/** Both sides of a `SlotsSwapped` entry, each colored by class like `CharacterChangeDisplay`. */
interface SlotsSwappedDisplay {
  a: CharacterChangeDisplay;
  b: CharacterChangeDisplay;
  suffix: string;
}

@Component({
  selector: 'app-guild-audit-log',
  imports: [
    NgOptimizedImage,
    NgTemplateOutlet,
    TranslocoPipe,
    FilterMenuComponent,
    PageHeaderComponent,
    DiscordIconComponent,
    DateRangeInputComponent,
    WowClassIconComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  templateUrl: './guild-audit-log.component.html',
  styleUrl: './guild-audit-log.component.scss',
})
export class GuildAuditLogComponent {
  readonly #guildContext = injectGuildContext();
  readonly #store = inject(AuditLogStore);
  readonly #transloco = inject(TranslocoService);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.auditLog'));

  readonly DiscordIconType = DiscordIconType;
  readonly actionTypes = Object.values(GuildAuditAction);

  readonly hasMore = this.#store.hasMore;
  readonly loading = this.#store.loading;
  readonly loadingMore = this.#store.loadingMore;

  /** Whether the store has any entries loaded at all — distinct from the current filters matching none. */
  readonly hasEntries = computed(() => this.#store.entries().length > 0);

  readonly selectedFilter = signal<GuildAuditAction | undefined>(undefined);
  readonly selectedCategory = signal<GuildAuditCategory | undefined>(undefined);
  readonly selectedActorId = signal<string | undefined>(undefined);
  readonly selectedChange = signal<string | undefined>(undefined);

  readonly dateRangeStart = signal<Date | null>(null);
  readonly dateRangeEnd = signal<Date | null>(null);

  readonly #sortColumn = signal<SortColumn | null>(null);
  readonly #sortDirection = signal<SortDirection>('asc');

  readonly categories = Object.values(GuildAuditCategory);

  /** Categories actually present among the loaded entries — keeps the filter menu relevant. */
  readonly availableCategories = computed(() => {
    const present = new Set(this.#store.entries().map((e) => e.category));
    return this.categories.filter((c) => present.has(c));
  });

  readonly categoryFilterOptions = computed<FilterOption<GuildAuditCategory>[]>(() =>
    this.availableCategories().map((c) => ({ value: c, label: this.categoryLabel(c) })),
  );

  /** Action types actually present among the loaded entries — keeps the filter menu relevant. */
  readonly availableActionTypes = computed(() => {
    const present = new Set(this.#store.entries().map((e) => e.actionType));
    return this.actionTypes.filter((a) => present.has(a));
  });

  readonly actionFilterOptions = computed<FilterOption<GuildAuditAction>[]>(() =>
    this.availableActionTypes().map((a) => ({ value: a, label: this.actionLabel(a) })),
  );

  /** Distinct actors among the loaded entries, for the searchable actor filter. */
  readonly availableActors = computed(() => {
    const byId = new Map<string, ActorOption>();
    for (const e of this.#store.entries()) {
      if (!byId.has(e.actorDiscordId)) {
        byId.set(e.actorDiscordId, {
          id: e.actorDiscordId,
          name: e.actorUsername ?? e.actorDiscordId,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly actorFilterOptions = computed<FilterOption<string>[]>(() =>
    this.availableActors().map((a) => ({ value: a.id, label: a.name })),
  );

  /** Distinct "before / after" summaries among the loaded entries, for the searchable change filter. */
  readonly availableChanges = computed(() => {
    const values = new Set(this.#store.entries().map((e) => this.changeSummary(e)));
    return [...values].sort((a, b) => a.localeCompare(b));
  });

  readonly changeFilterOptions = computed<FilterOption<string>[]>(() =>
    this.availableChanges().map((c) => ({ value: c, label: c })),
  );

  /**
   * Loaded entries, filtered then sorted. `action` and `category` are filtered server-side (see
   * `onFilterChange`/`selectCategoryFilter`); actor/change/date have no API filter support, so
   * they're scoped client-side to whatever is currently loaded — "load more" first if the value
   * you're looking for isn't an option yet.
   */
  readonly sortedEntries = computed(() => {
    const actorId = this.selectedActorId();
    const change = this.selectedChange();
    const start = this.dateRangeStart();
    const end = this.dateRangeEnd();
    let list = this.#store.entries();

    if (actorId) {
      list = list.filter((e) => e.actorDiscordId === actorId);
    }
    if (change) {
      list = list.filter((e) => this.changeSummary(e) === change);
    }
    if (start) {
      const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      list = list.filter((e) => new Date(e.occurredAt) >= from);
    }
    if (end) {
      const to = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
      list = list.filter((e) => new Date(e.occurredAt) <= to);
    }

    const column = this.#sortColumn();
    if (!column) return list;

    const dir = this.#sortDirection() === 'asc' ? 1 : -1;
    return [...list].sort(
      (a, b) => dir * this.#sortValue(a, column).localeCompare(this.#sortValue(b, column)),
    );
  });

  constructor() {
    // Reloads on first render and whenever the guild switches — the leaf route component
    // is reused (not recreated) when only the parent's :id param changes.
    effect(() => {
      const id = this.guildId();
      this.selectedFilter.set(undefined);
      this.selectedCategory.set(undefined);
      this.selectedActorId.set(undefined);
      this.selectedChange.set(undefined);
      this.dateRangeStart.set(null);
      this.dateRangeEnd.set(null);
      this.#store.load(id).subscribe();
    });
  }

  /** Action and Category are alternative server-side filters — picking one clears the other. */
  onFilterChange(actionType: GuildAuditAction | undefined): void {
    this.selectedFilter.set(actionType);
    this.selectedCategory.set(undefined);
    this.#store.load(this.guildId(), actionType).subscribe();
  }

  selectCategoryFilter(category: GuildAuditCategory | undefined): void {
    this.selectedCategory.set(category);
    this.selectedFilter.set(undefined);
    this.#store.load(this.guildId(), undefined, category).subscribe();
  }

  selectActorFilter(actorId: string | undefined): void {
    this.selectedActorId.set(actorId);
  }

  selectChangeFilter(change: string | undefined): void {
    this.selectedChange.set(change);
  }

  setDateRangeStart(date: Date | null): void {
    this.dateRangeStart.set(date);
  }

  setDateRangeEnd(date: Date | null): void {
    this.dateRangeEnd.set(date);
  }

  clearDateRange(): void {
    this.dateRangeStart.set(null);
    this.dateRangeEnd.set(null);
  }

  loadMore(): void {
    this.#store.loadMore()?.subscribe();
  }

  toggleSort(column: SortColumn): void {
    if (this.#sortColumn() === column) {
      this.#sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.#sortColumn.set(column);
      this.#sortDirection.set('asc');
    }
  }

  sortIcon(column: SortColumn): string | null {
    if (this.#sortColumn() !== column) return null;
    return this.#sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /** Formats a timestamp using the app's current language, not a hardcoded locale. */
  formatDate(occurredAt: string): string {
    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(occurredAt));
  }

  categoryLabel(category: GuildAuditCategory): string {
    return this.#transloco.translate(`auditLog.categories.${category}`);
  }

  /** Generic action label — used in the filter menu, independent of any one entry's details. */
  actionLabel(actionType: GuildAuditAction): string {
    return this.#transloco.translate(`auditLog.actionLabels.${actionType}`);
  }

  /**
   * Action label shown in the table row. For a SettingsUpdated entry where exactly one field
   * changed, this is the specific field's name (e.g. "Accès au roster") rather than the generic
   * "Paramètres modifiés" — the Category column already says "Paramètres", so this stays precise
   * without repeating it.
   */
  tableActionLabel(entry: AuditLogEntry): string {
    if (
      entry.actionType === GuildAuditAction.SettingsUpdated ||
      entry.actionType === GuildAuditAction.NotificationSettingsUpdated
    ) {
      const changes = this.settingsFieldChanges(entry);
      if (changes.length === 1) return this.#transloco.translate(changes[0].labelKey);
    }
    return this.actionLabel(entry.actionType);
  }

  #sortValue(entry: AuditLogEntry, column: SortColumn): string {
    switch (column) {
      case 'actor':
        return entry.actorUsername ?? entry.actorDiscordId;
      case 'category':
        return this.categoryLabel(entry.category);
      case 'action':
        return this.tableActionLabel(entry);
      case 'change':
        return this.changeSummary(entry);
      case 'time':
        return entry.occurredAt;
    }
  }

  /** Guild name/icon to render for a GuildRegistered entry, or null when not applicable. */
  guildRegisteredDisplay(entry: AuditLogEntry): GuildRegisteredDisplay | null {
    if (entry.actionType !== GuildAuditAction.GuildRegistered) return null;

    const name = entry.variables?.['guildName'];
    if (!name) return null;

    return { name, iconHash: entry.variables?.['guildIconHash'] ?? null };
  }

  /**
   * Every single-character action that carries `characterName` (+ optionally `characterClassId`)
   * and should render as a class-colored icon + name, with any extra detail (rank change, raid/
   * date/slot, spec change) appended by `changeSuffix()` rather than baked into the name text.
   * `SlotsSwapped` is excluded — two characters need `slotsSwappedDisplay()` instead.
   */
  private static readonly CharacterChangeActionTypes: ReadonlySet<GuildAuditAction> = new Set([
    GuildAuditAction.MemberJoined,
    GuildAuditAction.MemberLeft,
    GuildAuditAction.MemberExcluded,
    GuildAuditAction.MemberRankUpdated,
    GuildAuditAction.SlotAssigned,
    GuildAuditAction.SlotUnassigned,
    GuildAuditAction.SlotAssignmentSpecChanged,
  ]);

  /** Character name/class to render for any entry that names a character, or null otherwise. */
  characterChangeDisplay(entry: AuditLogEntry): CharacterChangeDisplay | null {
    if (!GuildAuditLogComponent.CharacterChangeActionTypes.has(entry.actionType)) return null;

    const name = entry.variables?.['characterName'];
    if (!name) return null;

    return this.#characterDisplay(name, entry.variables?.['characterClassId']);
  }

  /**
   * Both swapped characters (class-colored, each with its own (group-slot) coordinate folded into
   * the name) + the same event/date suffix the single-character rows use.
   */
  slotsSwappedDisplay(entry: AuditLogEntry): SlotsSwappedDisplay | null {
    if (entry.actionType !== GuildAuditAction.SlotsSwapped) return null;

    const nameA = entry.variables?.['characterAName'];
    const nameB = entry.variables?.['characterBName'];
    if (!nameA || !nameB) return null;

    const groupNumberA = entry.variables?.['groupNumberA'];
    const slotNumberA = entry.variables?.['slotNumberA'];
    const groupNumberB = entry.variables?.['groupNumberB'];
    const slotNumberB = entry.variables?.['slotNumberB'];
    const labelA = groupNumberA && slotNumberA ? `${nameA} (${groupNumberA}-${slotNumberA})` : nameA;
    const labelB = groupNumberB && slotNumberB ? `${nameB} (${groupNumberB}-${slotNumberB})` : nameB;

    return {
      a: this.#characterDisplay(labelA, entry.variables?.['characterAClassId']),
      b: this.#characterDisplay(labelB, entry.variables?.['characterBClassId']),
      suffix: this.#eventContextSuffix(entry),
    };
  }

  #characterDisplay(name: string, classIdRaw: string | undefined): CharacterChangeDisplay {
    const classId = classIdRaw ? Number(classIdRaw) : null;
    return { name, classId, color: classId === null ? null : (CLASS_COLORS[classId] ?? null) };
  }

  /** Trailing text shown after the character name/icon in `characterChangeDisplay()` rows. */
  changeSuffix(entry: AuditLogEntry): string | null {
    switch (entry.actionType) {
      case GuildAuditAction.MemberRankUpdated: {
        const oldRank = entry.variables?.['oldRank'];
        const newRank = entry.variables?.['newRank'];
        return oldRank && newRank ? ` : ${oldRank} → ${newRank}` : null;
      }

      case GuildAuditAction.SlotAssigned:
      case GuildAuditAction.SlotUnassigned: {
        const groupNumber = entry.variables?.['groupNumber'];
        const slotNumber = entry.variables?.['slotNumber'];
        const coord = groupNumber && slotNumber ? ` (${groupNumber}-${slotNumber})` : '';
        return coord + this.#eventContextSuffix(entry);
      }

      case GuildAuditAction.SlotAssignmentSpecChanged: {
        const oldSpecName = entry.variables?.['oldSpecName'];
        const newSpecName = entry.variables?.['newSpecName'];
        const spec = oldSpecName && newSpecName ? ` : ${oldSpecName} → ${newSpecName}` : '';
        return spec + this.#eventContextSuffix(entry);
      }

      default:
        return null;
    }
  }

  /** Content of the "before / after" column — the one piece of state the action actually changed. */
  changeSummary(entry: AuditLogEntry): string {
    const characterName = entry.variables?.['characterName'];

    switch (entry.actionType) {
      case GuildAuditAction.GuildRegistered:
        return entry.variables?.['guildName'] ?? '—';

      case GuildAuditAction.SettingsUpdated:
      case GuildAuditAction.OfficerThresholdUpdated:
      case GuildAuditAction.NotificationSettingsUpdated:
      case GuildAuditAction.NotificationSettingsReset: {
        const changes = this.settingsFieldChanges(entry);
        if (changes.length === 0) return '—';
        if (changes.length === 1) return changes[0].summary;
        return changes
          .map((c) => `${this.#transloco.translate(c.labelKey)}: ${c.summary}`)
          .join(' · ');
      }

      case GuildAuditAction.MemberRankUpdated: {
        const oldRank = entry.variables?.['oldRank'];
        const newRank = entry.variables?.['newRank'];
        if (!characterName || !oldRank || !newRank) return characterName ?? '—';
        return `${characterName} : ${oldRank} → ${newRank}`;
      }

      case GuildAuditAction.AvailabilityExceptionDeclared:
      case GuildAuditAction.AvailabilityExceptionDeleted:
        return this.#exceptionSummary(entry);

      case GuildAuditAction.RecurringAvailabilityPatternCreated:
      case GuildAuditAction.RecurringAvailabilityPatternUpdated:
      case GuildAuditAction.RecurringAvailabilityPatternStopped:
        return this.#patternSummary(entry);

      case GuildAuditAction.BranchActivated:
      case GuildAuditAction.BranchDeactivated:
      case GuildAuditAction.BranchRosterSettingsUpdated:
      case GuildAuditAction.BranchRegionUpdated:
      case GuildAuditAction.BranchSignupModeUpdated:
        return entry.variables?.['branchName'] ?? '—';

      case GuildAuditAction.RaidSeriesCreated:
      case GuildAuditAction.RaidSeriesUpdated:
      case GuildAuditAction.RaidSeriesDeactivated:
        return entry.variables?.['eventName'] ?? '—';

      case GuildAuditAction.RaidEventCreated:
      case GuildAuditAction.RaidEventDeleted:
      case GuildAuditAction.RaidEventPublished:
        return this.#raidEventSummary(entry);

      case GuildAuditAction.RaidEventUpdated:
        return this.#raidEventUpdateSummary(entry);

      case GuildAuditAction.SlotAssigned:
      case GuildAuditAction.SlotUnassigned:
        return this.#slotChangeSummary(entry, characterName);

      case GuildAuditAction.SlotAssignmentSpecChanged:
        return this.#slotSpecChangeSummary(entry, characterName);

      case GuildAuditAction.SlotsSwapped:
        return this.#slotsSwappedSummary(entry);

      default:
        return characterName ?? '—';
    }
  }

  /** e.g. "Split 1 — 05/08/2026 20:00 · Serpentshrine Cavern, Tempest Keep" for a create/delete/publish entry. Time is the guild's configured local time, not UTC. */
  #raidEventSummary(entry: AuditLogEntry): string {
    const eventName = entry.variables?.['eventName'];
    if (!eventName) return '—';

    const parts = [eventName];
    const startsAtLocal = entry.variables?.['startsAtLocal'];
    if (startsAtLocal) parts.push(this.#formatGuildLocalDateTime(startsAtLocal));
    const raidZoneNames = entry.variables?.['raidZoneNames'];
    if (raidZoneNames) parts.push(raidZoneNames);

    return parts.length > 1 ? `${parts[0]} — ${parts.slice(1).join(' · ')}` : parts[0];
  }

  /**
   * e.g. "Split 1 — date : 05/08/2026 20:00 → 05/08/2026 21:00 · raids : SSC → SSC, TK" — only
   * the fields that actually moved are shown, so an update that only touched the grid size (no
   * date/zone change) still reads as just the event name instead of a no-op-looking diff. Times are
   * the guild's configured local time, not UTC.
   */
  #raidEventUpdateSummary(entry: AuditLogEntry): string {
    const eventName = entry.variables?.['eventName'];
    if (!eventName) return '—';

    const changes: string[] = [];

    const oldStartsAtLocal = entry.variables?.['oldStartsAtLocal'];
    const newStartsAtLocal = entry.variables?.['newStartsAtLocal'];
    if (oldStartsAtLocal && newStartsAtLocal && oldStartsAtLocal !== newStartsAtLocal) {
      const oldLabel = this.#formatGuildLocalDateTime(oldStartsAtLocal);
      const newLabel = this.#formatGuildLocalDateTime(newStartsAtLocal);
      changes.push(`${this.#transloco.translate('auditLog.raidEventFields.date')} : ${oldLabel} → ${newLabel}`);
    }

    const oldRaidZoneNames = entry.variables?.['oldRaidZoneNames'];
    const newRaidZoneNames = entry.variables?.['newRaidZoneNames'];
    if (oldRaidZoneNames && newRaidZoneNames && oldRaidZoneNames !== newRaidZoneNames) {
      changes.push(`${this.#transloco.translate('auditLog.raidEventFields.raids')} : ${oldRaidZoneNames} → ${newRaidZoneNames}`);
    }

    return changes.length > 0 ? `${eventName} — ${changes.join(' · ')}` : eventName;
  }

  /**
   * Formats a backend "yyyy-MM-dd HH:mm" guild-local wall-clock string (from `startsAtLocal` et al.)
   * using the viewer's active UI language, e.g. "05/08/2026 20:00" (fr) vs "8/5/2026, 8:00 PM" (en).
   * Parses the components manually and formats with `timeZone: 'UTC'` rather than doing
   * `new Date(raw)` — that string carries no timezone info, so letting the browser interpret it in
   * its own local zone would silently shift the hour for any viewer not in the guild's timezone.
   */
  #formatGuildLocalDateTime(raw: string): string {
    const [datePart, timePart] = raw.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = (timePart ?? '00:00').split(':').map(Number);
    const asUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));

    return new Intl.DateTimeFormat(this.#transloco.getActiveLang(), {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(asUtc);
  }

  /** e.g. "Arthas (2-3) — Split 1 · 05/08/2026 20:00" for a character added/removed entry. */
  #slotChangeSummary(entry: AuditLogEntry, characterName: string | undefined): string {
    if (!characterName) return '—';

    const groupNumber = entry.variables?.['groupNumber'];
    const slotNumber = entry.variables?.['slotNumber'];
    const who = groupNumber && slotNumber ? `${characterName} (${groupNumber}-${slotNumber})` : characterName;

    return this.#appendEventContext(who, entry);
  }

  /** e.g. "Arthas : Frost → Unholy — Split 1 · 05/08/2026 20:00" for a spec-change entry. */
  #slotSpecChangeSummary(entry: AuditLogEntry, characterName: string | undefined): string {
    if (!characterName) return '—';

    const oldSpecName = entry.variables?.['oldSpecName'];
    const newSpecName = entry.variables?.['newSpecName'];
    const who = oldSpecName && newSpecName ? `${characterName} : ${oldSpecName} → ${newSpecName}` : characterName;

    return this.#appendEventContext(who, entry);
  }

  /** e.g. "Arthas (2-3) ↔ Jaina (1-1) — Split 1 · 05/08/2026 20:00" for a swap entry. */
  #slotsSwappedSummary(entry: AuditLogEntry): string {
    const characterAName = entry.variables?.['characterAName'];
    const characterBName = entry.variables?.['characterBName'];
    if (!characterAName || !characterBName) return '—';

    const groupNumberA = entry.variables?.['groupNumberA'];
    const slotNumberA = entry.variables?.['slotNumberA'];
    const groupNumberB = entry.variables?.['groupNumberB'];
    const slotNumberB = entry.variables?.['slotNumberB'];
    const labelA = groupNumberA && slotNumberA ? `${characterAName} (${groupNumberA}-${slotNumberA})` : characterAName;
    const labelB = groupNumberB && slotNumberB ? `${characterBName} (${groupNumberB}-${slotNumberB})` : characterBName;

    return this.#appendEventContext(`${labelA} ↔ ${labelB}`, entry);
  }

  /** Appends " — {eventName} · {date}" to a summary when both are present on the entry. */
  #appendEventContext(summary: string, entry: AuditLogEntry): string {
    const suffix = this.#eventContextSuffix(entry);
    return suffix ? `${summary}${suffix}` : summary;
  }

  /** " — {eventName} · {date}" (or " — {eventName}" without a date), or '' when there's no event name. */
  #eventContextSuffix(entry: AuditLogEntry): string {
    const eventName = entry.variables?.['eventName'];
    if (!eventName) return '';

    const startsAtLocal = entry.variables?.['startsAtLocal'];
    const context = startsAtLocal ? `${eventName} · ${this.#formatGuildLocalDateTime(startsAtLocal)}` : eventName;
    return ` — ${context}`;
  }

  /**
   * e.g. "23 juil. : Absent" or "23 juil. – 24 juil. : dès 21h30" for an availability exception
   * entry — a bare "Partiel" says nothing useful on its own, so a Partial entry is broken down into
   * the same late-arrival/early-leave/bounded-window wording the calendar page itself uses.
   */
  #exceptionSummary(entry: AuditLogEntry): string {
    const startDate = entry.variables?.['startDate'];
    const endDate = entry.variables?.['endDate'];
    const status = entry.variables?.['status'];
    if (!startDate || !endDate || !status) return '—';

    const lang = this.#transloco.getActiveLang();
    const formatter = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
    const range =
      startDate === endDate
        ? formatter.format(new Date(startDate))
        : `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;

    const statusLabel = this.#statusLabel(
      status,
      entry.variables?.['availableFrom'] ?? null,
      entry.variables?.['availableUntil'] ?? null,
      lang,
    );

    return `${range} : ${statusLabel}`;
  }

  /** Same late/early-leave/window breakdown as `#exceptionSummary`, factored out so pattern days can reuse it. */
  #statusLabel(status: string, availableFrom: string | null, availableUntil: string | null, lang: string): string {
    if (status === DayAvailabilityStatus.Partial) {
      const info = describePartialTime(availableFrom || null, availableUntil || null, lang);
      if (info) return formatPartialTimeLabel(info, (key, params) => this.#transloco.translate(key, params));
    }

    return this.#transloco.translate(`calendar.status.${status.toLowerCase()}`);
  }

  /**
   * e.g. "Rotation 5x8 — Lun : Absent · Ven : dès 18h00" for a weekly pattern, or
   * "Cycle 5x8 — Jour 1 : Absent · Jour 2 : Absent" for a shift rotation — a bare cycle-length
   * count ("tous les 7 jours") says nothing about which days actually changed, so every day the
   * pattern actually marks (Absent/Partial) is broken out individually. Falls back to the plain
   * cycle-length summary only for entries logged before this day-level detail existed.
   */
  #patternSummary(entry: AuditLogEntry): string {
    const label = entry.variables?.['label'];
    const cycleLengthDays = entry.variables?.['cycleLengthDays'];
    if (!cycleLengthDays) return '—';

    const header = label || this.#transloco.translate('calendar.patternDialog.unnamed');
    const anchorDate = entry.variables?.['anchorDate'];
    const days = this.#parsePatternDays(entry.variables?.['days']);

    if (days.length === 0 || !anchorDate) {
      const cycleSummary = this.#transloco.translate('calendar.patternDialog.cycleSummary', { days: cycleLengthDays });
      return `${header} (${cycleSummary})`;
    }

    const lang = this.#transloco.getActiveLang();
    const isWeekly = Number(cycleLengthDays) === 7;
    const dayEntries = [...days]
      .sort((a, b) => a.offsetInCycle - b.offsetInCycle)
      .map((day) => {
        const dayLabel = isWeekly
          ? this.#weekdayLabel(anchorDate, day.offsetInCycle, lang)
          : this.#transloco.translate('calendar.patternDialog.dayNumber', { n: day.offsetInCycle + 1 });
        return `${dayLabel} : ${this.#statusLabel(day.status, day.availableFrom, day.availableUntil, lang)}`;
      });

    return `${header} — ${dayEntries.join(' · ')}`;
  }

  #parsePatternDays(daysJson: string | undefined): AuditPatternDay[] {
    if (!daysJson) return [];
    try {
      return JSON.parse(daysJson) as AuditPatternDay[];
    } catch {
      return [];
    }
  }

  /** Short weekday name (e.g. "lun.") for `offsetInCycle` days after `anchorDateIso` — only meaningful for a 7-day cycle. */
  #weekdayLabel(anchorDateIso: string, offsetInCycle: number, lang: string): string {
    const [y, m, d] = anchorDateIso.split('-').map(Number);
    const date = new Date(y, m - 1, d + offsetInCycle);
    return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(date);
  }

  /**
   * Breaks a SettingsUpdated entry down into one change per field that actually moved, driven by
   * the back end's `changedFields` list — adding a new settings field server-side needs no change
   * here beyond a new case in `#settingsFieldChange`.
   */
  settingsFieldChanges(entry: AuditLogEntry): SettingsFieldChange[] {
    const v = entry.variables;
    if (!v) return [];

    if (
      entry.actionType === GuildAuditAction.NotificationSettingsUpdated ||
      entry.actionType === GuildAuditAction.NotificationSettingsReset
    ) {
      const events = v['changedEvents']?.split(',') ?? [];
      return events.map((eventType) => this.#notificationEventChange(eventType, v));
    }

    const fields = v['changedFields']?.split(',') ?? [];
    return fields
      .map((field) => this.#settingsFieldChange(field, v))
      .filter((c): c is SettingsFieldChange => c !== null);
  }

  /**
   * Builds one change entry for a notification event type, driven by the back end's
   * `changedEvents` list — `old{EventType}Enabled`/`new{EventType}Enabled` (always present) and
   * `old{EventType}ChannelName`/`new{EventType}ChannelName` (present only while enabled).
   */
  #notificationEventChange(eventType: string, v: Record<string, string>): SettingsFieldChange {
    const oldEnabled = v[`old${eventType}Enabled`] === 'true';
    const newEnabled = v[`new${eventType}Enabled`] === 'true';
    const off = this.#transloco.translate('auditLog.notificationOff');
    const oldLabel = oldEnabled ? (v[`old${eventType}ChannelName`] ?? '—') : off;
    const newLabel = newEnabled ? (v[`new${eventType}ChannelName`] ?? '—') : off;

    return {
      labelKey: `guildSettings.notificationSettings.events.${eventType}`,
      summary: `${oldLabel} → ${newLabel}`,
    };
  }

  #settingsFieldChange(field: string, v: Record<string, string>): SettingsFieldChange | null {
    switch (field) {
      case 'timezone':
        return {
          labelKey: 'auditLog.settingsFields.timezone',
          summary: `${v['oldTimezone'] ?? '—'} → ${v['newTimezone']}`,
        };

      case 'language':
        return {
          labelKey: 'auditLog.settingsFields.language',
          summary: `${v['oldLanguage'] ?? '—'} → ${v['newLanguage']}`,
        };

      case 'rosterMode': {
        const oldLabel = v['oldRosterMode'] ? this.#rosterModeLabel(v['oldRosterMode']) : '—';
        return {
          labelKey: 'auditLog.settingsFields.rosterMode',
          summary: `${oldLabel} → ${this.#rosterModeLabel(v['newRosterMode'])}`,
        };
      }

      case 'signupMode': {
        const oldLabel = v['oldSignupMode'] ? this.#signupModeLabel(v['oldSignupMode']) : '—';
        return {
          labelKey: 'auditLog.settingsFields.signupMode',
          summary: `${oldLabel} → ${this.#signupModeLabel(v['newSignupMode'])}`,
        };
      }

      case 'minRosterRoleId': {
        const oldRole = this.#roleDisplay(v, 'oldMinRosterRole');
        const newRole = this.#roleDisplay(v, 'newMinRosterRole');
        return {
          labelKey: 'auditLog.settingsFields.minRosterRoleId',
          summary: `${oldRole?.name ?? '—'} → ${newRole?.name ?? '—'}`,
          roleChange: { old: oldRole, new: newRole },
        };
      }

      case 'minOfficerRoleId': {
        const oldRole = this.#roleDisplay(v, 'oldMinOfficerRole');
        const newRole = this.#roleDisplay(v, 'newMinOfficerRole');
        return {
          labelKey: 'auditLog.settingsFields.minOfficerRoleId',
          summary: `${oldRole?.name ?? '—'} → ${newRole?.name ?? '—'}`,
          roleChange: { old: oldRole, new: newRole },
        };
      }

      default:
        return null;
    }
  }

  #rosterModeLabel(rosterMode: string): string {
    return this.#transloco.translate(
      rosterMode === RosterMode.DiscordRoleOnly
        ? 'guildSettings.branches.rosterMode.discordRoleOnly'
        : 'guildSettings.branches.rosterMode.open',
    );
  }

  #signupModeLabel(signupMode: string): string {
    return this.#transloco.translate(
      signupMode === SignupMode.Signup
        ? 'guildSettings.branches.signupMode.signup'
        : 'guildSettings.branches.signupMode.defaultPresent',
    );
  }

  /** Reads a `{prefix}Name`/`Color`/`IconUrl` triplet out of the variables dict, or null if unresolved. */
  #roleDisplay(v: Record<string, string>, prefix: string): RoleDisplay | null {
    const name = v[`${prefix}Name`];
    if (!name) return null;

    const colorRaw = v[`${prefix}Color`];
    const color = colorRaw ? formatDiscordColor(Number(colorRaw)) : null;

    return { name, color, iconUrl: v[`${prefix}IconUrl`] ?? null };
  }
}
