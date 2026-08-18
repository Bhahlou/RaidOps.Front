import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { DiscordChannelPermissionFlag } from '../../../../shared/models/discord-channel.model';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { expansionIconUrl } from '../../../../shared/utils/expansion-icon.util';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildNotificationEventType, GuildNotificationSetting } from '../../models/guild-notification-setting.model';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildNotificationSettingsStore } from '../../stores/guild-notification-settings.store';
import { GuildBranchesStore } from '../../stores/guild-branches.store';

/** `app-select` needs a stable primitive value, so "guild-wide" (`null`) is encoded as this key. */
const GUILD_WIDE_KEY = '__guild_wide__';

interface NotificationFamily {
  id: string;
  labelKey: string;
  hintKey: string;
  eventTypes: GuildNotificationEventType[];
}

/**
 * Event types grouped into one card per "family" (same visual style as the timezone/roster
 * cards in the General tab). Not user-configurable — just declaration order — so a new event
 * type only needs adding to the right family here.
 */
const NOTIFICATION_FAMILIES: NotificationFamily[] = [
  {
    id: 'absences',
    labelKey: 'guildSettings.notificationSettings.families.absences.label',
    hintKey: 'guildSettings.notificationSettings.families.absences.hint',
    eventTypes: [GuildNotificationEventType.AbsenceAdded, GuildNotificationEventType.AbsenceRemoved],
  },
  {
    id: 'raids',
    labelKey: 'guildSettings.notificationSettings.families.raids.label',
    hintKey: 'guildSettings.notificationSettings.families.raids.hint',
    eventTypes: [
      GuildNotificationEventType.RaidPublished,
      GuildNotificationEventType.RaidCancelled,
      GuildNotificationEventType.RaidRescheduled,
    ],
  },
  {
    id: 'raidComposition',
    labelKey: 'guildSettings.notificationSettings.families.raidComposition.label',
    hintKey: 'guildSettings.notificationSettings.families.raidComposition.hint',
    eventTypes: [
      GuildNotificationEventType.RaidSlotAssigned,
      GuildNotificationEventType.RaidSlotUnassigned,
      GuildNotificationEventType.RaidSlotsSwapped,
      GuildNotificationEventType.RaidSlotSpecChanged,
    ],
  },
  {
    id: 'raidCompositionAnnouncement',
    labelKey: 'guildSettings.notificationSettings.families.raidCompositionAnnouncement.label',
    hintKey: 'guildSettings.notificationSettings.families.raidCompositionAnnouncement.hint',
    eventTypes: [
      GuildNotificationEventType.RaidCompositionAnnouncementPosted,
      GuildNotificationEventType.RaidCompositionAnnouncementDm,
    ],
  },
  {
    id: 'raidSignupCall',
    labelKey: 'guildSettings.notificationSettings.families.raidSignupCall.label',
    hintKey: 'guildSettings.notificationSettings.families.raidSignupCall.hint',
    eventTypes: [GuildNotificationEventType.RaidSignupCallPosted],
  },
];

/** Event types that notify a player directly (DM) rather than posting to a channel — no channel picker for these rows. */
const CHANNELLESS_EVENT_TYPES = new Set<GuildNotificationEventType>([GuildNotificationEventType.RaidCompositionAnnouncementDm]);

@Component({
  selector: 'app-guild-notification-settings',
  imports: [CdkAccordion, CdkAccordionItem, IconButtonComponent, CheckboxComponent, SelectComponent, TranslocoPipe],
  templateUrl: './guild-notification-settings.component.html',
  styleUrl: './guild-notification-settings.component.scss',
})
export class GuildNotificationSettingsComponent implements OnInit {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildNotificationSettingsStore);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #settingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly #authStore = inject(AuthStore);
  readonly #wowBrancheService = inject(WowBrancheService);

  readonly #wowBranches = toSignal(this.#wowBrancheService.getAll(), { initialValue: [] });

  readonly families = NOTIFICATION_FAMILIES;
  readonly channels = this.#store.channels;
  readonly submitting = signal(false);
  /** Event type currently being reset, so only its row's action shows a disabled/busy state. */
  readonly resetting = signal<GuildNotificationEventType | null>(null);

  readonly #rows = signal<Map<GuildNotificationEventType, GuildNotificationSetting>>(new Map());

  /** Families the user has explicitly expanded — every family starts collapsed so the page opens compact. */
  readonly #expandedFamilies = signal<Set<string>>(new Set());

  /** Guild-wide (`GUILD_WIDE_KEY`) or one active branch's id (as a string, for `app-select`). */
  readonly scopeKey = signal<string>(GUILD_WIDE_KEY);

  readonly scopeGuildBranchId = computed<number | null>(() => {
    const key = this.scopeKey();
    return key === GUILD_WIDE_KEY ? null : Number(key);
  });

  readonly scopeOptions = computed<SelectOption<string>[]>(() => [
    { value: GUILD_WIDE_KEY, label: this.#transloco.translate('guildSettings.notificationSettings.scope.guildWide') },
    ...this.#branchesStore
      .branches()
      .filter((b) => b.isActive)
      .map((b) => ({
        value: String(b.id),
        label: b.branchName,
        iconUrl: expansionIconUrl(this.#wowBranches().find((wb) => wb.id === b.branchId)?.currentExpansionShortCode),
      })),
  ]);

  // Sorted by category then name so same-category channels stay contiguous — app-select folds
  // consecutive same-`group` options under one header, which is how same-named channels living
  // in different categories stay unambiguous.
  readonly channelOptions = computed<SelectOption<string>[]>(() =>
    [...this.channels()]
      .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '') || a.name.localeCompare(b.name))
      .map((channel) => ({
        value: channel.id,
        label: channel.missingPermissions.length === 0 ? channel.name : `⚠️ ${channel.name}`,
        group: channel.categoryName ?? undefined,
      })),
  );

  /** An enabled event with no channel picked can't be saved — there'd be nowhere to post to. Channelless (DM) events are exempt, they don't post to a channel at all. */
  readonly canSave = computed(() =>
    this.families.every((family) =>
      family.eventTypes.every(
        (eventType) => this.isChannelless(eventType) || !this.row(eventType).enabled || this.row(eventType).channelId !== null,
      ),
    ),
  );

  constructor() {
    effect(() => {
      const settings = this.#store.settings();
      this.#rows.set(new Map(settings.map((s) => [s.eventType, s])));
    });
  }

  ngOnInit(): void {
    this.#branchesStore.load(this.guildId());
    this.#store.load(this.guildId(), this.scopeGuildBranchId());
  }

  /** Switches the scope picker and re-points the store at the new branch (or guild-wide). */
  onScopeChange(key: string | null): void {
    this.scopeKey.set(key ?? GUILD_WIDE_KEY);
    this.#store.load(this.guildId(), this.scopeGuildBranchId());
  }

  row(eventType: GuildNotificationEventType): GuildNotificationSetting {
    return this.#rows().get(eventType) ?? { eventType, enabled: false, channelId: null };
  }

  isFamilyExpanded(familyId: string): boolean {
    return this.#expandedFamilies().has(familyId);
  }

  toggleFamily(familyId: string, expanded: boolean): void {
    const set = new Set(this.#expandedFamilies());
    expanded ? set.add(familyId) : set.delete(familyId);
    this.#expandedFamilies.set(set);
  }

  /** "N/M" summary shown in the collapsed header so a family's state is readable without opening it. */
  enabledCount(family: NotificationFamily): number {
    return family.eventTypes.filter((eventType) => this.row(eventType).enabled).length;
  }

  eventLabel(eventType: GuildNotificationEventType): string {
    return this.#transloco.translate(`guildSettings.notificationSettings.events.${eventType}`);
  }

  /**
   * True once a branch is selected and this row hasn't been explicitly saved for it yet — its
   * value is only the guild-wide fallback, not a real override.
   */
  isInherited(eventType: GuildNotificationEventType): boolean {
    const scope = this.scopeGuildBranchId();
    if (scope === null) return false;
    return (this.row(eventType).guildBranchId ?? null) !== scope;
  }

  channelHasNoPermission(channelId: string | null): boolean {
    if (!channelId) return false;
    return (this.channels().find((c) => c.id === channelId)?.missingPermissions.length ?? 0) > 0;
  }

  /** Comma-separated, translated list of the permissions the bot lacks in the given channel. */
  missingPermissionsLabel(channelId: string | null): string {
    const missing = this.channels().find((c) => c.id === channelId)?.missingPermissions ?? [];
    return missing
      .map((flag: DiscordChannelPermissionFlag) => this.#transloco.translate(`guildSettings.notificationSettings.channel.permissionFlags.${flag}`))
      .join(', ');
  }

  channelMissing(eventType: GuildNotificationEventType): boolean {
    if (this.isChannelless(eventType)) return false;
    const row = this.row(eventType);
    return row.enabled && row.channelId === null;
  }

  /** DM-style events notify a player directly — there's no channel to pick for them. */
  isChannelless(eventType: GuildNotificationEventType): boolean {
    return CHANNELLESS_EVENT_TYPES.has(eventType);
  }

  /**
   * Row checkbox/channel changes auto-save immediately (gated by `canSave()` — an enabled row
   * with no channel picked yet simply doesn't save until one is chosen, same pattern as the
   * Roster tab's Discord-role mode requiring at least one role). Both handlers only ever fire
   * from a real user interaction, never from the constructor's store-sync effect.
   */
  toggleEnabled(eventType: GuildNotificationEventType, enabled: boolean): void {
    this.#rows.update((rows) => new Map(rows).set(eventType, { ...this.row(eventType), enabled }));
    void this.save();
  }

  setChannel(eventType: GuildNotificationEventType, channelId: string | null): void {
    this.#rows.update((rows) => new Map(rows).set(eventType, { ...this.row(eventType), channelId }));
    void this.save();
  }

  private async save(): Promise<void> {
    if (!this.canSave()) return;

    const settings = this.families.flatMap((family) => family.eventTypes.map((eventType) => this.row(eventType)));
    const guildBranchId = this.scopeGuildBranchId();

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#settingsService.updateNotificationSettings(this.guildId(), guildBranchId, settings));
      // The whole batch was just written at `guildBranchId` — stamp it onto the optimistic patch
      // so `isInherited()` immediately reflects the new override instead of the stale pre-save
      // value (`null`/another branch) until the next full reload.
      const savedSettings = settings.map((s) => ({ ...s, guildBranchId }));
      this.#store.patchSettings(this.guildId(), guildBranchId, savedSettings);
      // First save clears the "absence notifications not configured" nudge — re-fetch /me so the
      // bell drops it immediately instead of waiting for the next unrelated refresh.
      this.#authStore.loadUser().subscribe();
      this.#snackbar.success('guildSettings.notificationSettings.saveSuccess');
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.submitting.set(false);
    }
  }

  /** Deletes this one event type's branch override so it falls back to inheriting the guild-wide setting. */
  async resetToInherited(eventType: GuildNotificationEventType): Promise<void> {
    const guildBranchId = this.scopeGuildBranchId();
    if (guildBranchId === null) return;

    this.resetting.set(eventType);
    try {
      await firstValueFrom(this.#settingsService.resetNotificationSetting(this.guildId(), guildBranchId, eventType));
      this.#store.reload();
      this.#snackbar.success('guildSettings.notificationSettings.scope.resetSuccess');
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.resetting.set(null);
    }
  }
}
