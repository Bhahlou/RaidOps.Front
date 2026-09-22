import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { PageHeaderComponent, BreadcrumbItem } from '../../../../../shared/components/layout/page-header/page-header.component';
import { EmptyHintComponent } from '../../../../../shared/components/feedback/empty-hint/empty-hint.component';
import { WowClassService } from '../../../../../shared/services/wow-class.service';
import { injectGuildContext, injectGuildBranchContext } from '../../../inject-guild-context';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildAccessLevel, hasGuildAccess } from '../../../../../core/models/guild-access-level.enum';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { CharacterStore } from '../../../../characters/stores/character.store';
import { Spec } from '../../../../../shared/models/spec.model';
import { RaidAttributionsStore } from '../../stores/raid-attributions.store';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEventAttributionsService } from '../../services/raid-event-attributions.service';
import { RaidBoss } from '../../models/raid-boss.model';
import { RaidAttributionScopeComponent, SlotChangeEvent } from '../../components/raid-attribution-scope/raid-attribution-scope.component';
import { raidBossIconUrl, raidBossNameKey, raidZoneNameKey } from '../../utils/raid-boss-name.util';
import { raidZoneIconUrl } from '../../utils/raid-zone-icon.util';

interface BossGroup {
  raidZoneId: number;
  raidZoneShortCode: string;
  bosses: RaidBoss[];
}

/**
 * Assignments page shell — the "General" scope is always shown (guild-wide rows that matter every
 * raid night, regardless of which boss is up), with a boss picked from the sidebar shown alongside
 * it below. Actual section/row rendering lives in `RaidAttributionScopeComponent`, instantiated
 * once for each scope currently on screen.
 */
@Component({
  selector: 'app-raid-attributions',
  imports: [RouterLink, RouterLinkActive, PageHeaderComponent, EmptyHintComponent, RaidAttributionScopeComponent, TranslocoPipe],
  templateUrl: './raid-attributions.component.html',
  styleUrl: './raid-attributions.component.scss',
})
export class RaidAttributionsComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchContext = injectGuildBranchContext();
  readonly #route = inject(ActivatedRoute);
  readonly #authStore = inject(AuthStore);
  readonly #store = inject(RaidAttributionsStore);
  readonly #boardStore = inject(RaidBoardStore);
  readonly #attributionsService = inject(RaidEventAttributionsService);
  readonly #characterStore = inject(CharacterStore);
  readonly #wowClassService = inject(WowClassService);
  readonly #snackbar = inject(SnackbarService);

  readonly guildId = this.#guildContext.currentGuildId;
  readonly guildBranchId = this.#branchContext.currentBranchId;
  readonly eventId = Number(this.#route.snapshot.paramMap.get('eventId'));
  /** Boss currently selected in the sidebar, from the route — `null` shows General only. */
  readonly bossId = this.#route.snapshot.paramMap.get('bossId') ? Number(this.#route.snapshot.paramMap.get('bossId')) : null;

  readonly generalData = this.#store.generalData;
  readonly bossData = this.#store.bossData;
  readonly isLoading = this.#store.isLoading;

  readonly specs = signal<Spec[]>([]);
  readonly classColorById = signal<Map<number, string>>(new Map());
  readonly bosses = signal<RaidBoss[]>([]);

  readonly currentBoss = computed(() => this.bosses().find((b) => b.id === this.bossId) ?? null);

  /** Bosses grouped by zone, in the event's target-zone order — usually one group, unless a split event covers several zones. */
  readonly bossGroups = computed<BossGroup[]>(() => {
    const groups: BossGroup[] = [];
    for (const boss of this.bosses()) {
      let group = groups.at(-1);
      if (group?.raidZoneId !== boss.raidZoneId) {
        group = { raidZoneId: boss.raidZoneId, raidZoneShortCode: boss.raidZoneShortCode, bosses: [] };
        groups.push(group);
      }
      group.bosses.push(boss);
    }
    return groups;
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const [guildCrumb] = this.#guildContext.breadcrumbs('sidenav.guild.raidBuilder');
    const raidsCrumb: BreadcrumbItem = {
      i18nKey: 'sidenav.guild.raidBuilder',
      link: ['/guilds', this.guildId(), String(this.guildBranchId()), 'raids'],
    };
    const raidName = this.#boardStore.events().find((e) => e.id === this.eventId)?.name;
    const detailCrumb: BreadcrumbItem = {
      ...(raidName ? { label: raidName } : { i18nKey: 'raidBuilder.detail.breadcrumb' }),
      link: ['/guilds', this.guildId(), String(this.guildBranchId()), 'raids', String(this.eventId)],
    };
    return [guildCrumb, raidsCrumb, detailCrumb, { i18nKey: 'raidBuilder.detail.hub.assignments' }];
  });

  readonly isOfficer = computed(() => {
    const guild = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId());
    return guild ? hasGuildAccess(guild.accessLevel, GuildAccessLevel.Officer) : false;
  });

  constructor() {
    this.#store.load(this.guildId(), this.guildBranchId(), this.eventId, this.bossId);
    this.#boardStore.loadEvent(this.guildId(), this.guildBranchId(), this.eventId);
    this.#characterStore.loadSpecs().subscribe((specs) => this.specs.set(specs));
    this.#wowClassService.getAll().subscribe((classes) => this.classColorById.set(new Map(classes.map((c) => [c.id, '#' + c.color]))));
    this.#attributionsService.getBossesForEvent(this.guildId(), this.guildBranchId(), this.eventId).subscribe((bosses) => this.bosses.set(bosses));
  }

  bossLink(bossId: number): (string | number)[] {
    return ['/guilds', this.guildId(), String(this.guildBranchId()), 'raids', String(this.eventId), 'attributions', bossId];
  }

  zoneNameKey(shortCode: string): string {
    return raidZoneNameKey(shortCode);
  }

  zoneIconUrl(shortCode: string): string | null {
    return raidZoneIconUrl(shortCode);
  }

  bossNameKey(name: string): string {
    return raidBossNameKey(name);
  }

  bossIconUrl(name: string): string | null {
    return raidBossIconUrl(name);
  }

  onGeneralSlotChange(event: SlotChangeEvent): void {
    this.#submitSlotChange(null, event);
  }

  onBossSlotChange(event: SlotChangeEvent): void {
    this.#submitSlotChange(this.bossId, event);
  }

  #submitSlotChange(bossId: number | null, event: SlotChangeEvent): void {
    const { definitionId, cellId, instanceIndex, characterId } = event;

    if (characterId === null) {
      this.#attributionsService.clearAttribution(this.guildId(), this.guildBranchId(), this.eventId, bossId, definitionId, cellId, instanceIndex).subscribe({
        next: () => this.#store.reload(),
        error: () => this.#snackbar.error('errors.server'),
      });
      return;
    }

    this.#attributionsService.setAttribution(this.guildId(), this.guildBranchId(), this.eventId, bossId, definitionId, cellId, instanceIndex, characterId).subscribe({
      next: () => this.#store.reload(),
      error: (err: HttpErrorResponse) => this.#snackbar.error(err.error?.error ? `raidBuilder.attributions.errors.${err.error.error}` : 'errors.server'),
    });
  }
}
