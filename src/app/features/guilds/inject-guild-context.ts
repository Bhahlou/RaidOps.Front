import { effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BreadcrumbItem } from '../../shared/components/layout/page-header/page-header.component';
import { AuthStore } from '../../core/stores/auth.store';
import { DiscordIconType } from '../../shared/models/discord-icon-type.enum';
import { setLastVisitedBranchId } from './utils/last-visited-branch.util';

/**
 * Functional injection helper for guild page components.
 * Must be called in an injection context (class field initializer or constructor).
 *
 * Returns the current guild ID from the parent route and a `breadcrumbs()` factory.
 * Call `breadcrumbs()` inside a `computed()` so signal reads are tracked.
 */
export function injectGuildContext() {
  const authStore = inject(AuthStore);
  const route = inject(ActivatedRoute);
  const guildId = route.parent!.snapshot.paramMap.get('id')!;

  // The leaf route component is reused (not recreated) when only the parent's :id param
  // changes — e.g. switching guilds without leaving the current page. Plain snapshot reads
  // like `guildId` above go stale in that case. Pages that need to react to a guild switch
  // (reload data, refresh breadcrumbs) should read this signal instead.
  const currentGuildId = toSignal(
    route.parent!.paramMap.pipe(map(params => params.get('id')!)),
    { initialValue: guildId },
  );

  function breadcrumbs(leafI18nKey: string, withDashboardLink = true): BreadcrumbItem[] {
    const id = currentGuildId();
    const guild = authStore.user()?.guilds.find(g => g.id === id);
    const rootCrumb: BreadcrumbItem = {
      label: guild?.name ?? '…',
      discordIcon: guild
        ? { id: guild.id, hash: guild.iconHash, type: DiscordIconType.Guild }
        : undefined,
      ...(withDashboardLink ? { link: ['/guilds', id] } : {}),
    };
    return [rootCrumb, { i18nKey: leafI18nKey }];
  }

  return { guildId, currentGuildId, breadcrumbs };
}

/**
 * Functional injection helper for branch-scoped guild page components (dashboard/roster/loot —
 * not calendar, which stays guild-wide, see `guilds.routes.ts`).
 * Must be called in an injection context (class field initializer or constructor).
 */
export function injectGuildBranchContext() {
  const route = inject(ActivatedRoute);
  const guildId = route.snapshot.paramMap.get('id')!;
  const branchId = Number(route.snapshot.paramMap.get('branchId'));

  // Same staleness concern as currentGuildId above — the leaf route component is reused when
  // only :branchId changes (e.g. switching branches without leaving the current page).
  const currentBranchId = toSignal(
    route.paramMap.pipe(map(params => Number(params.get('branchId')))),
    { initialValue: branchId },
  );

  // Every visit to a branch-scoped page records itself as "last visited" for this guild — read
  // back by guildDefaultBranchGuard when the user later lands on the bare /guilds/:id, and by
  // the sidenav's own default-branch link.
  effect(() => setLastVisitedBranchId(guildId, currentBranchId()));

  return { branchId, currentBranchId };
}
