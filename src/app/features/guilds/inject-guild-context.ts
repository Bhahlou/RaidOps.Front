import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BreadcrumbItem } from '../../shared/components/layout/page-header/page-header.component';
import { AuthStore } from '../../core/stores/auth.store';
import { DiscordIconType } from '../../shared/models/discord-icon-type.enum';

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
      ...(withDashboardLink ? { link: ['/guilds', id, 'dashboard'] } : {}),
    };
    return [rootCrumb, { i18nKey: leafI18nKey }];
  }

  return { guildId, currentGuildId, breadcrumbs };
}
