import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../shared/components/layout/page-header/page-header.component';
import { EmptyHintComponent } from '../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { BranchTabsComponent } from '../../components/branch-tabs/branch-tabs.component';
import { injectGuildContext, injectGuildBranchContext } from '../../inject-guild-context';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { RaidsService } from '../../services/raids.service';
import { RaidGroupingCharacterDialogComponent } from '../../components/raid-grouping-character-dialog/raid-grouping-character-dialog.component';

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
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #route = inject(ActivatedRoute);
  readonly #authStore = inject(AuthStore);
  readonly #raidsService = inject(RaidsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #dialog = inject(Dialog);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly eventId = Number(this.#route.snapshot.paramMap.get('eventId'));

  readonly raidName = signal<string | null>(null);

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

  readonly triggeringGrouping = signal(false);

  constructor() {
    this.#raidsService.getEventSummary(this.guildId(), this.guildBranchId(), this.eventId).subscribe({
      next: (summary) => this.raidName.set(summary.name),
      error: () => this.raidName.set(null),
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
