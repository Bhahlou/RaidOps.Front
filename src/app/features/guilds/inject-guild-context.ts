import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbItem } from '../../shared/components/page-header/page-header.component';
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
  const guildId = inject(ActivatedRoute).parent!.snapshot.paramMap.get('id')!;

  function breadcrumbs(leafI18nKey: string, withDashboardLink = true): BreadcrumbItem[] {
    const guild = authStore.user()?.guilds.find(g => g.id === guildId);
    const rootCrumb: BreadcrumbItem = {
      label: guild?.name ?? '…',
      discordIcon: guild
        ? { id: guild.id, hash: guild.iconHash, type: DiscordIconType.Guild }
        : undefined,
      ...(withDashboardLink ? { link: ['/guilds', guildId, 'dashboard'] } : {}),
    };
    return [rootCrumb, { i18nKey: leafI18nKey }];
  }

  return { guildId, breadcrumbs };
}
