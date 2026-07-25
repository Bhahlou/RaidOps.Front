import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildNotificationEventType, GuildNotificationSetting } from '../../models/guild-notification-setting.model';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildNotificationSettingsStore } from '../../stores/guild-notification-settings.store';

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
];

@Component({
  selector: 'app-guild-notification-settings',
  imports: [ButtonComponent, CheckboxComponent, FormFieldCardComponent, SelectComponent, TranslocoPipe],
  templateUrl: './guild-notification-settings.component.html',
  styleUrl: './guild-notification-settings.component.scss',
})
export class GuildNotificationSettingsComponent implements OnInit {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildNotificationSettingsStore);
  readonly #settingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly #authStore = inject(AuthStore);

  readonly families = NOTIFICATION_FAMILIES;
  readonly channels = this.#store.channels;
  readonly submitting = signal(false);

  readonly #rows = signal<Map<GuildNotificationEventType, GuildNotificationSetting>>(new Map());

  // Sorted by category then name so same-category channels stay contiguous — app-select folds
  // consecutive same-`group` options under one header, which is how same-named channels living
  // in different categories stay unambiguous.
  readonly channelOptions = computed<SelectOption<string>[]>(() =>
    [...this.channels()]
      .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '') || a.name.localeCompare(b.name))
      .map((channel) => ({
        value: channel.id,
        label: channel.botCanSendMessages ? channel.name : `⚠️ ${channel.name}`,
        group: channel.categoryName ?? undefined,
      })),
  );

  /** An enabled event with no channel picked can't be saved — there'd be nowhere to post to. */
  readonly canSave = computed(() =>
    this.families.every((family) =>
      family.eventTypes.every((eventType) => !this.row(eventType).enabled || this.row(eventType).channelId !== null),
    ),
  );

  constructor() {
    effect(() => {
      const settings = this.#store.settings();
      if (!settings.length) return;
      this.#rows.set(new Map(settings.map((s) => [s.eventType, s])));
    });
  }

  ngOnInit(): void {
    this.#store.load(this.guildId());
  }

  row(eventType: GuildNotificationEventType): GuildNotificationSetting {
    return this.#rows().get(eventType) ?? { eventType, enabled: false, channelId: null };
  }

  eventLabel(eventType: GuildNotificationEventType): string {
    return this.#transloco.translate(`guildSettings.notificationSettings.events.${eventType}`);
  }

  channelHasNoPermission(channelId: string | null): boolean {
    if (!channelId) return false;
    return this.channels().find((c) => c.id === channelId)?.botCanSendMessages === false;
  }

  channelMissing(eventType: GuildNotificationEventType): boolean {
    const row = this.row(eventType);
    return row.enabled && row.channelId === null;
  }

  toggleEnabled(eventType: GuildNotificationEventType, enabled: boolean): void {
    this.#rows.update((rows) => new Map(rows).set(eventType, { ...this.row(eventType), enabled }));
  }

  setChannel(eventType: GuildNotificationEventType, channelId: string | null): void {
    this.#rows.update((rows) => new Map(rows).set(eventType, { ...this.row(eventType), channelId }));
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;

    const settings = this.families.flatMap((family) => family.eventTypes.map((eventType) => this.row(eventType)));

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#settingsService.updateNotificationSettings(this.guildId(), settings));
      this.#store.patchSettings(this.guildId(), settings);
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
}
