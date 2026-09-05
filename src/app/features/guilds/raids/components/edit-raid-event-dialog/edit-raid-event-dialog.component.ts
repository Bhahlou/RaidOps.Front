import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidZoneStore } from '../../stores/raid-zone.store';
import { GuildStore } from '../../../stores/guild.store';
import { RaidsService } from '../../services/raids.service';
import { GuildSettingsService } from '../../../settings/services/guild-settings.service';
import { RaidEvent, RaidEventPayload } from '../../models/raid-event.model';
import { RaidEventStatus } from '../../models/raid-event-status.enum';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';
import { DiscordChannel } from '../../../../../shared/models/discord-channel.model';
import { DiscordCategory } from '../../../../../shared/models/discord-category.model';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import { submitRaidDialogRequest } from '../../utils/dialog-submit.util';
import { resetStaleExtendsRaidEventId, watchRaidEventChoices } from '../../utils/raid-event-choices.util';
import { RaidZoneFieldComponent } from '../raid-zone-field/raid-zone-field.component';
import { RaidChannelFieldComponent, RaidChannelMode } from '../raid-channel-field/raid-channel-field.component';

export interface EditRaidEventDialogData {
  guildId: string;
  guildBranchId: number;
  event: RaidEvent;
}

/**
 * Dialog for editing or deleting a single raid event occurrence. Deletion is always available and
 * permanently removes the event along with any slot assignments it has — the confirm dialog warns
 * more strongly when there's roster history to lose (see `hasAssignments`). For Signup-mode events,
 * also lets an officer move the dedicated announcement channel (existing pick or create-on-the-fly,
 * same as the create dialog) — the signup-call embed follows to the new channel, and the old channel
 * is deleted if RaidOps had created it just for this event. The Signup/DefaultPresent mode itself is
 * fixed at creation and can never be changed here — delete and recreate if it's genuinely wrong.
 */
@Component({
  selector: 'app-edit-raid-event-dialog',
  standalone: true,
  imports: [TranslocoPipe, ButtonComponent, SelectComponent, RaidZoneFieldComponent, RaidChannelFieldComponent],
  templateUrl: './edit-raid-event-dialog.component.html',
  styleUrl: './edit-raid-event-dialog.component.scss',
})
export class EditRaidEventDialogComponent {
  readonly #dialogRef = inject(DialogRef<boolean>);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #zoneStore = inject(RaidZoneStore);
  readonly #guildStore = inject(GuildStore);
  readonly #raidsService = inject(RaidsService);
  readonly #guildSettingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);
  readonly #transloco = inject(TranslocoService);
  readonly data = inject<EditRaidEventDialogData>(DIALOG_DATA);

  readonly Publication = RaidPublicationStatus;
  readonly zones = this.#zoneStore.zones;

  readonly isReadOnly = this.data.event.status !== RaidEventStatus.Scheduled;
  readonly hasAssignments = this.data.event.assignments.length > 0;
  readonly isDraft = this.data.event.publicationStatus === RaidPublicationStatus.Draft;
  readonly showChannelField = this.data.event.signupMode === SignupMode.Signup;

  readonly name = signal(this.data.event.name);
  readonly startsAtLocal = signal(toDatetimeLocal(this.data.event.startsAtUtc));
  readonly groupCount = signal(this.data.event.groupCount);
  readonly slotsPerGroup = signal(this.data.event.slotsPerGroup);
  readonly selectedZoneIds = signal<Set<number>>(new Set(this.data.event.raidZones.map((z) => z.id)));

  /** See `CreateRaidEventDialogComponent.extendsRaidEventId` — same field, editable after creation too. */
  readonly extendsRaidEventId = signal<number | null>(this.data.event.extendsRaidEventId);
  /** See `watchRaidEventChoices` — independent of the board's currently loaded range/single-event mode. */
  readonly #raidEventChoices = watchRaidEventChoices(this.#raidsService, this.data.guildId, this.data.guildBranchId, this.startsAtLocal);
  /**
   * Candidates exclude this event itself and any of its own descendants (an event that already
   * extends this one, directly or via the flattened chain) — picking either would hit the back
   * end's cycle guard. Deliberately does NOT exclude this event's current target: comparing against
   * `this.data.event.id` (not that target's own group key) keeps it selectable, so re-saving the
   * same link — or seeing it in the list at all — doesn't leave `extendsRaidEventId` pointing at a
   * value absent from `options`, which throws inside CdkListbox and breaks the overlay entirely.
   */
  readonly extendCandidates = computed<SelectOption<number>[]>(() => {
    this.#transloco.activeLang(); // depend on language changes so labels stay in sync
    const lang = this.#transloco.getActiveLang();
    const dayFormatter = new Intl.DateTimeFormat(lang, { weekday: 'short', day: '2-digit', month: '2-digit' });
    const timeFormatter = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
    const myId = this.data.event.id;
    const options = this.#raidEventChoices()
      .filter((e) => e.id !== myId && (e.extendsRaidEventId ?? e.id) !== myId)
      .map((e) => {
        const date = new Date(e.startsAtLocal);
        return { value: e.id, label: `${e.name} — ${dayFormatter.format(date)} ${timeFormatter.format(date)}` };
      });

    // Guarantees the currently-linked target is always a selectable option, even if a later date
    // edit moves it outside the freshly re-fetched lockout window — CdkListbox throws (and takes
    // the whole overlay's positioning down with it) if `value` ever points at something missing
    // from `options`.
    const { extendsRaidEventId: currentTargetId, extendsRaidEventName: currentTargetName } = this.data.event;
    if (currentTargetId != null && !options.some((o) => o.value === currentTargetId)) {
      options.unshift({ value: currentTargetId, label: currentTargetName ?? `#${currentTargetId}` });
    }

    return options;
  });

  readonly guildLanguage = computed(() => this.#guildStore.settings()?.language ?? 'en');
  readonly channels = signal<DiscordChannel[]>([]);
  readonly categories = signal<DiscordCategory[]>([]);
  readonly canCreateRootChannel = signal(true);
  readonly channelMode = signal<RaidChannelMode>('existing');
  readonly selectedChannelId = signal<string | null>(this.data.event.dedicatedAnnouncementChannelId);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly newChannelName = signal('');
  /** Mirrors `RaidChannelFieldComponent`'s own permission check — blocks submit before Discord returns a 403. */
  readonly canCreateChannelAtSelection = signal(true);

  readonly submitting = signal(false);

  readonly canSubmit = computed(() => {
    if (
      this.isReadOnly ||
      this.submitting() ||
      !this.name().trim() ||
      !this.startsAtLocal() ||
      this.selectedZoneIds().size === 0 ||
      this.groupCount() <= 0 ||
      this.slotsPerGroup() <= 0
    ) {
      return false;
    }
    if (!this.showChannelField) return true;

    return this.channelMode() === 'existing'
      ? this.selectedChannelId() !== null
      : this.newChannelName().trim().length > 0 && this.canCreateChannelAtSelection();
  });

  constructor() {
    this.#zoneStore.load(this.data.guildId, this.data.guildBranchId);
    resetStaleExtendsRaidEventId(this.extendCandidates, this.extendsRaidEventId);
    if (this.showChannelField) {
      this.#guildStore.loadSettings(this.data.guildId);
      this.#guildSettingsService.getNotificationChannels(this.data.guildId).subscribe((channels) => this.channels.set(channels));
      this.#guildSettingsService.getCategories(this.data.guildId).subscribe((result) => {
        this.canCreateRootChannel.set(result.canCreateRootChannel);
        this.categories.set(result.categories);
      });
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    // Same one-step channel creation as the create dialog — no separate "Create" click.
    if (this.showChannelField && this.channelMode() === 'new') {
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

    // Preserves the event's current bot-owned flag when the channel didn't actually change (e.g.
    // re-saving with the same existing selection) — only a fresh pick or a fresh creation should
    // ever flip it, otherwise a same-channel save would wrongly untrack a bot-owned channel.
    const dedicatedAnnouncementChannelIsBotOwned = this.showChannelField
      ? this.channelMode() === 'new' ||
        (this.selectedChannelId() === this.data.event.dedicatedAnnouncementChannelId && this.data.event.dedicatedAnnouncementChannelIsBotOwned)
      : false;

    const payload: RaidEventPayload = {
      name: this.name().trim(),
      startsAtUtc: new Date(this.startsAtLocal()).toISOString(),
      groupCount: this.groupCount(),
      slotsPerGroup: this.slotsPerGroup(),
      signupMode: this.data.event.signupMode,
      raidZoneIds: [...this.selectedZoneIds()],
      extendsRaidEventId: this.extendsRaidEventId(),
      dedicatedAnnouncementChannelId: this.showChannelField ? this.selectedChannelId() : null,
      dedicatedAnnouncementChannelIsBotOwned,
    };

    submitRaidDialogRequest(
      this.submitting,
      this.#snackbar,
      this.#dialogRef,
      'raidBuilder.eventDialog.saveSuccess',
      this.#boardStore.updateEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id, payload),
    );
  }

  publish(): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.eventDialog.publishConfirmTitle',
          message: 'raidBuilder.publishConfirm',
          messageParams: { name: this.data.event.name },
          confirmLabel: 'raidBuilder.publish',
          danger: false,
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#boardStore.publishEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id).subscribe({
          next: () => {
            this.#snackbar.success('raidBuilder.eventDialog.publishSuccess');
            this.#dialogRef.close(true);
          },
          error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
        });
      });
  }

  deleteEvent(): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.eventDialog.deleteConfirmTitle',
          message: this.hasAssignments
            ? 'raidBuilder.eventDialog.deleteConfirmMessageWithAssignments'
            : 'raidBuilder.eventDialog.deleteConfirmMessage',
          messageParams: { name: this.data.event.name },
          confirmLabel: 'raidBuilder.eventDialog.deleteEvent',
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.#boardStore.deleteEvent(this.data.guildId, this.data.guildBranchId, this.data.event.id).subscribe({
          next: () => {
            this.#snackbar.success('raidBuilder.eventDialog.deleteSuccess');
            this.#dialogRef.close(true);
          },
          error: (err: HttpErrorResponse) => this.#snackbar.error(raidErrorKey(err)),
        });
      });
  }

  close(): void {
    this.#dialogRef.close(false);
  }
}

/** Converts a UTC ISO datetime string to a `datetime-local` input value in the browser's local timezone. */
function toDatetimeLocal(isoUtc: string): string {
  const date = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
