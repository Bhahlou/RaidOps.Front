import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { CheckboxComponent } from '../../../../shared/components/form/checkbox/checkbox.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { GuildStore } from '../../stores/guild.store';
import { RaidsService } from '../../services/raids.service';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { RaidEventPayload } from '../../models/raid-event.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { DiscordChannel } from '../../../../shared/models/discord-channel.model';
import { DiscordCategory } from '../../../../shared/models/discord-category.model';
import { submitRaidDialogRequest } from '../../utils/dialog-submit.util';
import { RaidZoneFieldComponent } from '../raid-zone-field/raid-zone-field.component';
import { RaidChannelFieldComponent, RaidChannelMode } from '../raid-channel-field/raid-channel-field.component';

export interface CreateRaidEventDialogData {
  guildId: string;
  guildBranchId: number;
}

/** Dialog for creating an ad-hoc raid event (not backed by any recurring series). */
@Component({
  selector: 'app-create-raid-event-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, CheckboxComponent, RaidZoneFieldComponent, RaidChannelFieldComponent],
  templateUrl: './create-raid-event-dialog.component.html',
  styleUrl: './create-raid-event-dialog.component.scss',
})
export class CreateRaidEventDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #guildStore = inject(GuildStore);
  readonly #raidsService = inject(RaidsService);
  readonly #guildSettingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly data = inject<CreateRaidEventDialogData>(DIALOG_DATA);

  readonly zones = this.#zoneStore.zones;

  readonly name = signal('');
  /** `datetime-local` input value, `"yyyy-MM-ddTHH:mm"` in the browser's local timezone. */
  readonly startsAtLocal = signal('');
  readonly groupCount = signal(5);
  readonly slotsPerGroup = signal(5);
  readonly selectedZoneIds = signal<Set<number>>(new Set());

  /** The branch's configured default — the Signup-mode checkbox only makes sense to offer when this is DefaultPresent. */
  readonly branchDefaultSignupMode = computed<SignupMode>(() => {
    const branch = this.#branchesStore.branches().find((b) => b.id === this.data.guildBranchId);
    return branch?.signupMode ?? SignupMode.DefaultPresent;
  });
  readonly showSignupOverride = computed(() => this.branchDefaultSignupMode() === SignupMode.DefaultPresent);
  readonly signupOverride = signal(false);
  readonly isSignupMode = computed(() => this.branchDefaultSignupMode() === SignupMode.Signup || this.signupOverride());

  readonly guildLanguage = computed(() => this.#guildStore.settings()?.language ?? 'en');
  readonly channels = signal<DiscordChannel[]>([]);
  readonly categories = signal<DiscordCategory[]>([]);
  readonly canCreateRootChannel = signal(true);
  readonly channelMode = signal<RaidChannelMode>('existing');
  readonly selectedChannelId = signal<string | null>(null);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly newChannelName = signal('');
  /** Mirrors `RaidChannelFieldComponent`'s own permission check — blocks submit before Discord returns a 403. */
  readonly canCreateChannelAtSelection = signal(true);

  readonly submitting = signal(false);

  readonly canSubmit = computed(() => {
    if (
      this.submitting() ||
      !this.name().trim() ||
      !this.startsAtLocal() ||
      this.selectedZoneIds().size === 0 ||
      this.groupCount() <= 0 ||
      this.slotsPerGroup() <= 0
    ) {
      return false;
    }
    if (!this.isSignupMode()) return true;

    return this.channelMode() === 'existing'
      ? this.selectedChannelId() !== null
      : this.newChannelName().trim().length > 0 && this.canCreateChannelAtSelection();
  });

  constructor() {
    this.#zoneStore.load(this.data.guildId, this.data.guildBranchId);
    this.#branchesStore.load(this.data.guildId);
    this.#guildStore.loadSettings(this.data.guildId);
    this.#guildSettingsService.getNotificationChannels(this.data.guildId).subscribe((channels) => this.channels.set(channels));
    this.#guildSettingsService.getCategories(this.data.guildId).subscribe((result) => {
      this.canCreateRootChannel.set(result.canCreateRootChannel);
      this.categories.set(result.categories);
    });
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    // The dedicated channel is created as part of submitting the raid itself — no separate
    // "Create" step — so the whole dialog reads as one action instead of two sequential ones.
    if (this.isSignupMode() && this.channelMode() === 'new') {
      this.submitting.set(true);
      try {
        const response = await firstValueFrom(
          this.#raidsService.createAnnouncementChannel(
            this.data.guildId,
            this.data.guildBranchId,
            this.newChannelName().trim(),
            this.selectedCategoryId(),
          ),
        );
        this.selectedChannelId.set(response.body.id);
      } catch {
        this.submitting.set(false);
        this.#snackbar.error('raidBuilder.eventDialog.createChannelFailed');
        return;
      }
    }

    const payload: RaidEventPayload = {
      name: this.name().trim(),
      startsAtUtc: new Date(this.startsAtLocal()).toISOString(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: SignupMode.DefaultPresent,
      raidZoneIds: [...this.selectedZoneIds()],
      signupModeOverride: this.showSignupOverride() && this.signupOverride() ? SignupMode.Signup : null,
      dedicatedAnnouncementChannelId: this.isSignupMode() ? this.selectedChannelId() : null,
      dedicatedAnnouncementChannelIsBotOwned: this.isSignupMode() && this.channelMode() === 'new',
    };

    submitRaidDialogRequest(
      this.submitting,
      this.#snackbar,
      this.#dialogRef,
      'raidBuilder.eventDialog.createSuccess',
      this.#boardStore.createEvent(this.data.guildId, this.data.guildBranchId, payload),
    );
  }

  cancel(): void {
    this.#dialogRef.close(false);
  }
}
