import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DiscordIconComponent } from '../../../../shared/components/discord-icon/discord-icon.component';
import {
  CLASS_COLORS,
  WowClassIconComponent,
} from '../../../../shared/components/wow-class-icon/wow-class-icon.component';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';
import { formatDiscordColor } from '../../../../shared/utils/discord-color.util';
import { injectGuildContext } from '../../inject-guild-context';
import { AuditLogStore } from '../../stores/audit-log.store';
import { AuditLogEntry } from '../../models/audit-log-entry.model';
import { GuildAuditAction } from '../../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../../models/guild-audit-category.enum';
import { RosterMode } from '../../models/roster-mode.enum';

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

@Component({
  selector: 'app-guild-audit-log',
  imports: [
    NgTemplateOutlet,
    MatIcon,
    MatButton,
    MatIconButton,
    MatDatepickerModule,
    MatFormField,
    MatSuffix,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressSpinner,
    TranslocoPipe,
    PageHeaderComponent,
    DiscordIconComponent,
    WowClassIconComponent,
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

  /** Narrows the option list shown in each filter's searchable menu — does not touch the table. */
  readonly categorySearch = signal('');
  readonly actionSearch = signal('');
  readonly actorSearch = signal('');
  readonly changeSearch = signal('');

  readonly #sortColumn = signal<SortColumn | null>(null);
  readonly #sortDirection = signal<SortDirection>('asc');

  readonly categories = Object.values(GuildAuditCategory);

  /** Categories actually present among the loaded entries — keeps the filter menu relevant. */
  readonly availableCategories = computed(() => {
    const present = new Set(this.#store.entries().map((e) => e.category));
    return this.categories.filter((c) => present.has(c));
  });

  readonly filteredCategoryOptions = computed(() => {
    const q = this.categorySearch().toLowerCase();
    return this.availableCategories().filter((c) =>
      this.categoryLabel(c).toLowerCase().includes(q),
    );
  });

  /** Action types actually present among the loaded entries — keeps the filter menu relevant. */
  readonly availableActionTypes = computed(() => {
    const present = new Set(this.#store.entries().map((e) => e.actionType));
    return this.actionTypes.filter((a) => present.has(a));
  });

  readonly filteredActionOptions = computed(() => {
    const q = this.actionSearch().toLowerCase();
    return this.availableActionTypes().filter((a) => this.actionLabel(a).toLowerCase().includes(q));
  });

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

  readonly filteredActorOptions = computed(() => {
    const q = this.actorSearch().toLowerCase();
    return this.availableActors().filter((a) => a.name.toLowerCase().includes(q));
  });

  /** Distinct "before / after" summaries among the loaded entries, for the searchable change filter. */
  readonly availableChanges = computed(() => {
    const values = new Set(this.#store.entries().map((e) => this.changeSummary(e)));
    return [...values].sort((a, b) => a.localeCompare(b));
  });

  readonly filteredChangeOptions = computed(() => {
    const q = this.changeSearch().toLowerCase();
    return this.availableChanges().filter((c) => c.toLowerCase().includes(q));
  });

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
      this.categorySearch.set('');
      this.actionSearch.set('');
      this.actorSearch.set('');
      this.changeSearch.set('');
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
    if (entry.actionType === GuildAuditAction.SettingsUpdated) {
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

  /** Character name/class to render for any entry that names a character, or null otherwise. */
  characterChangeDisplay(entry: AuditLogEntry): CharacterChangeDisplay | null {
    const name = entry.variables?.['characterName'];
    if (!name) return null;

    const classIdRaw = entry.variables?.['characterClassId'];
    const classId = classIdRaw ? Number(classIdRaw) : null;

    return { name, classId, color: classId === null ? null : (CLASS_COLORS[classId] ?? null) };
  }

  /** Trailing text shown after the character name/icon — only MemberRankUpdated needs one. */
  changeSuffix(entry: AuditLogEntry): string | null {
    if (entry.actionType !== GuildAuditAction.MemberRankUpdated) return null;

    const oldRank = entry.variables?.['oldRank'];
    const newRank = entry.variables?.['newRank'];
    if (!oldRank || !newRank) return null;

    return ` : ${oldRank} → ${newRank}`;
  }

  /** Content of the "before / after" column — the one piece of state the action actually changed. */
  changeSummary(entry: AuditLogEntry): string {
    const characterName = entry.variables?.['characterName'];

    switch (entry.actionType) {
      case GuildAuditAction.GuildRegistered:
        return entry.variables?.['guildName'] ?? '—';

      case GuildAuditAction.SettingsUpdated:
      case GuildAuditAction.OfficerThresholdUpdated: {
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

      default:
        return characterName ?? '—';
    }
  }

  /**
   * Breaks a SettingsUpdated entry down into one change per field that actually moved, driven by
   * the back end's `changedFields` list — adding a new settings field server-side needs no change
   * here beyond a new case in `#settingsFieldChange`.
   */
  settingsFieldChanges(entry: AuditLogEntry): SettingsFieldChange[] {
    const v = entry.variables;
    if (!v) return [];

    const fields = v['changedFields']?.split(',') ?? [];
    return fields
      .map((field) => this.#settingsFieldChange(field, v))
      .filter((c): c is SettingsFieldChange => c !== null);
  }

  #settingsFieldChange(field: string, v: Record<string, string>): SettingsFieldChange | null {
    switch (field) {
      case 'timezone':
        return {
          labelKey: 'auditLog.settingsFields.timezone',
          summary: `${v['oldTimezone'] ?? '—'} → ${v['newTimezone']}`,
        };

      case 'rosterMode': {
        const oldLabel = v['oldRosterMode'] ? this.#rosterModeLabel(v['oldRosterMode']) : '—';
        return {
          labelKey: 'auditLog.settingsFields.rosterMode',
          summary: `${oldLabel} → ${this.#rosterModeLabel(v['newRosterMode'])}`,
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
        ? 'guildSettings.rosterMode.discordRoleOnly'
        : 'guildSettings.rosterMode.open',
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
