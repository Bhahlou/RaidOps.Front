import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { CheckboxComponent } from '../../../../../shared/components/form/checkbox/checkbox.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidSeriesStore } from '../../stores/raid-series.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { GuildSettingsService } from '../../../settings/services/guild-settings.service';
import { RaidSeries, RaidSeriesPayload } from '../../models/raid-series.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { DiscordChannel } from '../../../../../shared/models/discord-channel.model';
import { DiscordCategory } from '../../../../../shared/models/discord-category.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { RaidZoneFieldComponent } from '../raid-zone-field/raid-zone-field.component';
import { RaidChannelFieldComponent, RaidChannelMode } from '../raid-channel-field/raid-channel-field.component';

export interface CreateRaidSeriesDialogData {
  guildId: string;
  guildBranchId: number;
  /** The series to edit, or `null` to create a new one. */
  series: RaidSeries | null;
}

/** Backend `DayOfWeek` enum names, in English — the value sent to/received from the API. Never localized (see the enum's own culture-invariant serialization). */
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Dialog for creating or editing a raid series (recurring template). The signup-mode override and
 * dedicated-channel picker only apply on creation — an existing series' `SignupMode` is fixed once
 * occurrences have already materialized from it, and its channel setup can't be changed from here
 * either. "New channel" here means something different than on the event dialogs: since a series
 * has no single date, picking "new" doesn't create one channel now — it remembers the chosen
 * category, and the backend auto-creates a fresh channel per materialized occurrence in it (named
 * after the raid and that occurrence's own date) when `MaterializeRaidSeriesOccurrencesCommand`
 * runs, so every raid instance gets its own recognizable channel instead of every week reusing one.
 */
@Component({
  selector: 'app-create-raid-series-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, CheckboxComponent, SelectComponent, RaidZoneFieldComponent, RaidChannelFieldComponent],
  templateUrl: './create-raid-series-dialog.component.html',
  styleUrl: './create-raid-series-dialog.component.scss',
})
export class CreateRaidSeriesDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #seriesStore = inject(RaidSeriesStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #guildSettingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<CreateRaidSeriesDialogData>(DIALOG_DATA);

  readonly isEditMode = !!this.data.series;
  readonly zones = this.#zoneStore.zones;

  readonly branchDefaultSignupMode = computed<SignupMode>(() => {
    const branch = this.#branchesStore.branches().find((b) => b.id === this.data.guildBranchId);
    return branch?.signupMode ?? SignupMode.DefaultPresent;
  });
  readonly showSignupOverride = computed(() => !this.isEditMode && this.branchDefaultSignupMode() === SignupMode.DefaultPresent);
  readonly signupOverride = signal(false);
  readonly isSignupMode = computed(() => this.branchDefaultSignupMode() === SignupMode.Signup || this.signupOverride());
  /** The channel picker only ever applies on creation — see the class doc comment. */
  readonly showChannelField = computed(() => !this.isEditMode && this.isSignupMode());

  readonly channels = signal<DiscordChannel[]>([]);
  readonly categories = signal<DiscordCategory[]>([]);
  readonly canCreateRootChannel = signal(true);
  readonly channelMode = signal<RaidChannelMode>('existing');
  readonly selectedChannelId = signal<string | null>(null);
  readonly selectedCategoryId = signal<string | null>(null);
  /** Unused for a series (no per-occurrence name to type up front) — kept only for `RaidChannelFieldComponent`'s two-way binding contract. */
  readonly newChannelName = signal('');
  /** Mirrors `RaidChannelFieldComponent`'s own permission check — blocks submit before Discord returns a 403. */
  readonly canCreateChannelAtSelection = signal(true);

  readonly dayOptions = computed<SelectOption<string>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    return WEEKDAYS.map((day) => ({ value: day, label: this.#transloco.translate(`raidBuilder.weekday.${day}`) }));
  });

  readonly name = signal(this.data.series?.name ?? '');
  readonly recurrenceDayOfWeek = signal(this.data.series?.recurrenceDayOfWeek ?? 'Tuesday');
  readonly startTime = signal(this.data.series?.recurrenceStartTimeLocal.slice(0, 5) ?? '21:00');
  readonly recurrenceIntervalWeeks = signal(this.data.series?.recurrenceIntervalWeeks ?? 1);
  readonly groupCount = signal(this.data.series?.groupCount ?? 5);
  readonly slotsPerGroup = signal(this.data.series?.slotsPerGroup ?? 5);
  readonly selectedZoneIds = signal<Set<number>>(new Set(this.data.series?.raidZones.map((z) => z.id) ?? []));

  readonly submitting = signal(false);

  readonly canSubmit = computed(() => {
    if (
      this.submitting() ||
      !this.name().trim() ||
      this.selectedZoneIds().size === 0 ||
      this.groupCount() <= 0 ||
      this.slotsPerGroup() <= 0 ||
      this.recurrenceIntervalWeeks() <= 0
    ) {
      return false;
    }
    if (!this.showChannelField()) return true;

    // "new" requires a category (there's no per-occurrence channel to create without knowing
    // where) — unlike the event dialogs, root/no-category isn't a valid choice here.
    return this.channelMode() === 'existing' ? this.selectedChannelId() !== null : this.selectedCategoryId() !== null && this.canCreateChannelAtSelection();
  });

  constructor() {
    this.#zoneStore.load(this.data.guildId, this.data.guildBranchId);
    this.#branchesStore.load(this.data.guildId);
    if (!this.isEditMode) {
      this.#guildSettingsService.getNotificationChannels(this.data.guildId).subscribe((channels) => this.channels.set(channels));
      this.#guildSettingsService.getCategories(this.data.guildId).subscribe((result) => {
        this.canCreateRootChannel.set(result.canCreateRootChannel);
        this.categories.set(result.categories);
      });
    }
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const usesNewChannel = this.showChannelField() && this.channelMode() === 'new';

    const payload: RaidSeriesPayload = {
      name: this.name().trim(),
      recurrenceDayOfWeek: this.recurrenceDayOfWeek(),
      recurrenceStartTimeLocal: `${this.startTime()}:00`,
      recurrenceIntervalWeeks: this.recurrenceIntervalWeeks(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: SignupMode.DefaultPresent,
      raidZoneIds: [...this.selectedZoneIds()],
      signupModeOverride: this.showSignupOverride() && this.signupOverride() ? SignupMode.Signup : null,
      dedicatedAnnouncementChannelId: this.isEditMode || usesNewChannel ? undefined : this.selectedChannelId(),
      dedicatedAnnouncementChannelCategoryId: usesNewChannel ? this.selectedCategoryId() : undefined,
    };

    this.submitting.set(true);
    const request = this.data.series
      ? this.#seriesStore.updateSeries(this.data.guildId, this.data.guildBranchId, this.data.series.id, payload)
      : this.#seriesStore.createSeries(this.data.guildId, this.data.guildBranchId, payload);

    request.subscribe({
      next: () => {
        this.#snackbar.success('raidBuilder.seriesDialog.saveSuccess');
        this.#dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.#snackbar.error(raidErrorKey(err));
      },
    });
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
