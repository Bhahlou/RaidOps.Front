import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/layout/page-header/page-header.component';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../../shared/components/buttons/icon-button/icon-button.component';
import { BranchTabsComponent } from '../../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../../inject-guild-context';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../../core/models/guild-access-level.enum';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidsService } from '../../services/raids.service';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidPublicationStatus } from '../../models/raid-publication-status.enum';
import { SignupMode } from '../../models/signup-mode.enum';
import { SignupStatus } from '../../models/signup-status.enum';
import { countRaidRoles, RAID_ROLE_ICON, RAID_ROLE_ORDER } from '../../utils/raid-role.util';
import { raidZoneIconUrl } from '../../utils/raid-zone-icon.util';
import { GuildRosterStore } from '../../../roster/stores/guild-roster.store';
import { RaidEventGridComponent } from '../../components/raid-event-grid/raid-event-grid.component';
import { RaidSignupListComponent } from '../../components/raid-signup-list/raid-signup-list.component';
import { RaidAvailableRosterComponent } from '../../components/raid-available-roster/raid-available-roster.component';
import { RaidGroupingCharacterDialogComponent } from '../../components/raid-grouping-character-dialog/raid-grouping-character-dialog.component';
import { EditRaidEventDialogComponent } from '../../components/edit-raid-event-dialog/edit-raid-event-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/dialogs/confirm-dialog/confirm-dialog.component';
import { raidErrorKey } from '../../utils/raid-error-key.util';
import {
  SignupCharacterDialogComponent,
  SignupCharacterDialogResult,
} from '../../components/signup-character-dialog/signup-character-dialog.component';

/** Placeholder hub-strip link — no route yet, just establishes the page's eventual scope. */
interface DetailHubLink {
  icon: string;
  labelKey: string;
}

const HUB_LINKS: DetailHubLink[] = [
  { icon: 'inventory_2', labelKey: 'raidBuilder.detail.hub.loot' },
  { icon: 'assignment_ind', labelKey: 'raidBuilder.detail.hub.assignments' },
  { icon: 'description', labelKey: 'raidBuilder.detail.hub.logs' },
  { icon: 'insights', labelKey: 'raidBuilder.detail.hub.analysis' },
];

/**
 * Detail page for a single raid event, reached from the raids list or the Discord composition
 * announcement's title link. Bespoke, more spacious variant of the raid card the list page
 * renders — same composition grid and signup list, but its own header (full date/time, zone
 * chips, labeled self-serve RSVP) since it only ever shows the one raid. Sources the full event
 * through `RaidBoardStore`'s single-event loading mode (`loadEvent`) rather than the list page's
 * date-range `loadRange`, so the reused grid/signup-list's mutate-then-`reload()` calls keep
 * working unmodified. The header's officer actions are mutually exclusive on publication status:
 * a draft event offers "Publish" (no grouping ping is possible until roster members can even see
 * the raid), a published one offers the grouping ping instead (mirrored by the Discord
 * `/raid invite` subcommand).
 */
@Component({
  selector: 'app-raid-detail',
  imports: [
    PageHeaderComponent,
    EmptyHintComponent,
    ButtonComponent,
    IconButtonComponent,
    BranchTabsComponent,
    CdkDropListGroup,
    RaidEventGridComponent,
    RaidSignupListComponent,
    RaidAvailableRosterComponent,
    TranslocoPipe,
  ],
  templateUrl: './raid-detail.component.html',
  styleUrl: './raid-detail.component.scss',
})
export class RaidDetailComponent {
  readonly SignupMode = SignupMode;
  readonly SignupStatus = SignupStatus;
  readonly PublicationStatus = RaidPublicationStatus;
  readonly roleOrder = RAID_ROLE_ORDER;
  readonly roleIcon = RAID_ROLE_ICON;
  readonly hubLinks = HUB_LINKS;

  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #route = inject(ActivatedRoute);
  readonly #authStore = inject(AuthStore);
  readonly #rosterStore = inject(GuildRosterStore);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #raidsService = inject(RaidsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);
  readonly #transloco = inject(TranslocoService);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly eventId = Number(this.#route.snapshot.paramMap.get('eventId'));

  readonly event = computed<RaidEvent | undefined>(() => this.#boardStore.events().find((e) => e.id === this.eventId));
  readonly isLoading = this.#boardStore.isLoading;

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const [guildCrumb] = this.#guildContext.breadcrumbs('sidenav.guild.raidBuilder');
    const raidsCrumb: BreadcrumbItem = {
      i18nKey: 'sidenav.guild.raidBuilder',
      link: ['/guilds', this.guildId(), String(this.guildBranchId()), 'raids'],
    };
    const raidName = this.event()?.name;
    const leafCrumb: BreadcrumbItem = raidName ? { label: raidName } : { i18nKey: 'raidBuilder.detail.breadcrumb' };
    return [guildCrumb, raidsCrumb, leafCrumb];
  });

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  readonly currentUserDiscordId = computed(() => this.#authStore.user()?.discordId ?? null);

  readonly rosterMembers = computed(() => this.#rosterStore.members() ?? []);

  /** The viewer's own characters on this branch's roster — the pool an Accept/Tentative RSVP can pick from. */
  readonly myCharacters = computed(() => this.rosterMembers().filter((m) => m.playerDiscordId === this.currentUserDiscordId()));

  readonly triggeringGrouping = signal(false);
  readonly publishing = signal(false);

  constructor() {
    this.#boardStore.loadEvent(this.guildId(), this.guildBranchId(), this.eventId);
    this.#rosterStore.loadRoster(this.guildId(), this.guildBranchId());
  }

  roleCounts(event: RaidEvent): Record<string, number> {
    return countRaidRoles(event.assignments);
  }

  zoneIcon(shortCode: string): string | null {
    return raidZoneIconUrl(shortCode);
  }

  /** Full date/time in clear text — the detail page only ever shows one raid, so there's room to spell it out. */
  fullDateTime(event: RaidEvent): string {
    this.#transloco.activeLang(); // depend on language changes so the label stays in sync
    const lang = this.#transloco.getActiveLang();
    const date = new Date(event.startsAtUtc);
    const dayFormatter = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeFormatter = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
    return `${dayFormatter.format(date)} · ${timeFormatter.format(date)}`;
  }

  setSignup(status: SignupStatus): void {
    const event = this.event();
    if (!event) return;

    // Declined carries no character; Accepted and Tentative both commit one (matches the Discord
    // signup-call buttons and the server's own validation — see SetMyRaidSignupCommandHandler).
    if (status === SignupStatus.Declined) {
      this.#submitSignup(status, null, null);
      return;
    }

    const characters = this.myCharacters();
    const onlyCharacter = characters.length === 1 ? characters[0] : null;
    if (onlyCharacter && onlyCharacter.raidSpecs.length <= 1) {
      this.#submitSignup(status, onlyCharacter.characterId, onlyCharacter.raidSpecs[0]?.specId ?? null);
      return;
    }

    this.#dialog
      .open<SignupCharacterDialogResult | null>(SignupCharacterDialogComponent, {
        width: '360px',
        data: {
          characters: characters.map((c) => ({ characterId: c.characterId, characterName: c.characterName, raidSpecs: c.raidSpecs })),
          currentCharacterId: event.mySignupCharacterId,
          currentSpecId: event.mySignupSpecId,
        },
      })
      .closed.subscribe((result) => {
        if (result != null) this.#submitSignup(status, result.characterId, result.specId);
      });
  }

  #submitSignup(status: SignupStatus, characterId: number | null, specId: number | null): void {
    this.#boardStore.setMySignup(this.guildId(), this.guildBranchId(), this.eventId, status, characterId, specId).subscribe({
      next: () => this.#boardStore.reload(),
      error: () => this.#snackbar.error('raidBuilder.signup.saveFailed'),
    });
  }

  openEditEventDialog(event: RaidEvent): void {
    this.#dialog
      .open<boolean>(EditRaidEventDialogComponent, {
        width: 'min(720px, 95vw)',
        data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), event },
      })
      .closed.subscribe((saved) => {
        if (saved) this.#boardStore.reload();
      });
  }

  publishEvent(event: RaidEvent): void {
    this.#dialog
      .open<boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: {
          title: 'raidBuilder.eventDialog.publishConfirmTitle',
          message: 'raidBuilder.publishConfirm',
          messageParams: { name: event.name },
          confirmLabel: 'raidBuilder.publish',
          danger: false,
        },
      })
      .closed.subscribe((confirmed) => {
        if (!confirmed) return;

        this.publishing.set(true);
        this.#boardStore.publishEvent(this.guildId(), this.guildBranchId(), event.id).subscribe({
          next: () => {
            this.publishing.set(false);
            this.#snackbar.success('raidBuilder.eventDialog.publishSuccess');
            this.#boardStore.reload();
          },
          error: (err: HttpErrorResponse) => {
            this.publishing.set(false);
            this.#snackbar.error(raidErrorKey(err));
          },
        });
      });
  }

  async triggerGrouping(): Promise<void> {
    this.triggeringGrouping.set(true);
    try {
      await firstValueFrom(this.#raidsService.announceGrouping(this.guildId(), this.guildBranchId(), this.eventId));
      this.#snackbar.success('raidBuilder.detail.groupingSent');
    } catch (err) {
      const code = (err as HttpErrorResponse).error?.error as string | undefined;
      if (code === 'RaidGroupingRequesterHasNoCharacter') {
        this.#dialog
          .open<boolean>(RaidGroupingCharacterDialogComponent, {
            width: '420px',
            data: { guildId: this.guildId(), guildBranchId: this.guildBranchId(), eventId: this.eventId },
          })
          .closed.subscribe((sent) => {
            if (sent) this.#snackbar.success('raidBuilder.detail.groupingSent');
          });
      } else {
        this.#snackbar.error('raidBuilder.detail.groupingFailed');
      }
    } finally {
      this.triggeringGrouping.set(false);
    }
  }
}
