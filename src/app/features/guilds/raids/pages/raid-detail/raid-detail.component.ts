import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/layout/page-header/page-header.component';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { ButtonComponent } from '../../../../../shared/components/buttons/button/button.component';
import { BranchTabsComponent } from '../../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../../inject-guild-context';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../../core/models/guild-access-level.enum';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { RaidsService } from '../../services/raids.service';
import { RaidGroupingCharacterDialogComponent } from '../../components/raid-grouping-character-dialog/raid-grouping-character-dialog.component';
import {
  SignupCharacterDialogComponent,
  SignupCharacterDialogResult,
} from '../../components/signup-character-dialog/signup-character-dialog.component';
import { GuildRosterStore } from '../../../roster/stores/guild-roster.store';
import { SignupMode } from '../../models/signup-mode.enum';
import { SignupStatus } from '../../models/signup-status.enum';
import { RaidSignup } from '../../models/raid-signup.model';

/**
 * Placeholder detail page for a single raid event, reached from the Discord composition
 * announcement's title link. Deliberately empty for now — this is where attendance, loot, and
 * log-analysis links will live once those features exist. The one piece of real interactivity
 * today is the "trigger grouping" ping, mirrored by the Discord `/raid invite` subcommand. The
 * only raid data fetched is the event's name, for the breadcrumb — a not-yet-published raid still
 * surfaces the backend's rejection via a toast when grouping is triggered, rather than the button
 * being pre-emptively hidden.
 */
@Component({
  selector: 'app-raid-detail',
  imports: [PageHeaderComponent, EmptyHintComponent, ButtonComponent, BranchTabsComponent, TranslocoPipe],
  templateUrl: './raid-detail.component.html',
  styleUrl: './raid-detail.component.scss',
})
export class RaidDetailComponent {
  readonly SignupMode = SignupMode;
  readonly SignupStatus = SignupStatus;
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #route = inject(ActivatedRoute);
  readonly #authStore = inject(AuthStore);
  readonly #raidsService = inject(RaidsService);
  readonly #rosterStore = inject(GuildRosterStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly eventId = Number(this.#route.snapshot.paramMap.get('eventId'));

  readonly raidName = signal<string | null>(null);
  readonly signupMode = signal<SignupMode>(SignupMode.DefaultPresent);
  readonly mySignupStatus = signal<SignupStatus | null>(null);
  readonly mySignupCharacterId = signal<number | null>(null);
  readonly mySignupSpecId = signal<number | null>(null);
  readonly signups = signal<RaidSignup[]>([]);
  readonly savingSignup = signal(false);

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const [guildCrumb] = this.#guildContext.breadcrumbs('sidenav.guild.raidBuilder');
    const raidsCrumb: BreadcrumbItem = {
      i18nKey: 'sidenav.guild.raidBuilder',
      link: ['/guilds', this.guildId(), String(this.guildBranchId()), 'raids'],
    };
    const raidName = this.raidName();
    const leafCrumb: BreadcrumbItem = raidName ? { label: raidName } : { i18nKey: 'raidBuilder.detail.breadcrumb' };
    return [guildCrumb, raidsCrumb, leafCrumb];
  });

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  readonly acceptedSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Accepted));
  readonly tentativeSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Tentative));
  readonly declinedSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Declined));
  readonly noResponseSignups = computed(() => this.signups().filter((s) => s.status === null));

  /** The viewer's own characters on this branch's roster — the pool an Accept/Tentative RSVP can pick from. */
  readonly myCharacters = computed(() => {
    const discordId = this.#authStore.user()?.discordId;
    return (this.#rosterStore.members() ?? []).filter((m) => m.playerDiscordId === discordId);
  });

  readonly triggeringGrouping = signal(false);

  constructor() {
    this.#raidsService.getEventSummary(this.guildId(), this.guildBranchId(), this.eventId).subscribe({
      next: (summary) => {
        this.raidName.set(summary.name);
        this.signupMode.set(summary.signupMode);
        this.mySignupStatus.set(summary.mySignupStatus);
        this.mySignupCharacterId.set(summary.mySignupCharacterId);
        this.mySignupSpecId.set(summary.mySignupSpecId);
        if (summary.signupMode === SignupMode.Signup) {
          this.#rosterStore.loadRoster(this.guildId(), this.guildBranchId());
          if (this.isOfficer()) this.#loadSignups();
        }
      },
      error: () => this.raidName.set(null),
    });
  }

  #loadSignups(): void {
    this.#raidsService.getSignups(this.guildId(), this.guildBranchId(), this.eventId).subscribe({
      next: (signups) => this.signups.set(signups),
      error: () => this.signups.set([]),
    });
  }

  setSignup(status: SignupStatus): void {
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
          currentCharacterId: this.mySignupCharacterId(),
          currentSpecId: this.mySignupSpecId(),
        },
      })
      .closed.subscribe((result) => {
        if (result != null) this.#submitSignup(status, result.characterId, result.specId);
      });
  }

  #submitSignup(status: SignupStatus, characterId: number | null, specId: number | null): void {
    this.savingSignup.set(true);
    this.#raidsService.setMySignup(this.guildId(), this.guildBranchId(), this.eventId, status, characterId, specId).subscribe({
      next: () => {
        this.mySignupStatus.set(status);
        this.mySignupCharacterId.set(characterId);
        this.mySignupSpecId.set(specId);
        this.savingSignup.set(false);
        if (this.isOfficer()) this.#loadSignups();
      },
      error: () => {
        this.savingSignup.set(false);
        this.#snackbar.error('raidBuilder.signup.saveFailed');
      },
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
