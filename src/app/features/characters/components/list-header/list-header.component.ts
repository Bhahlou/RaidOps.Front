import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { BnetAccount } from '../../models/bnet-account.model';
import { BnetLinkButtonComponent } from '../../../../shared/components/buttons/bnet-link-button/bnet-link-button.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { BnetIconComponent } from '../../../../shared/components/icons/bnet-icon/bnet-icon.component';
import {
  PageHeaderComponent,
  BreadcrumbItem,
} from '../../../../shared/components/layout/page-header/page-header.component';
import { REGION_FLAGS } from '../../../../shared/constants/bnet-regions';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

/**
 * Header bar for the characters list page.
 * Displays the breadcrumb (with the manual "?" link), the import button and BNet account chip
 * on wide screens, and a "more" menu grouping the same on narrow ones (see .actions-wide /
 * .actions-narrow-trigger in the stylesheet — both render, CSS picks one per breakpoint).
 */
@Component({
  selector: 'app-character-list-header',
  standalone: true,
  imports: [
    TranslocoPipe,
    BnetLinkButtonComponent,
    ButtonComponent,
    BnetIconComponent,
    PageHeaderComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
  ],
  templateUrl: './list-header.component.html',
  styleUrl: './list-header.component.scss',
})
export class ListHeaderComponent {
  readonly #authStore = inject(AuthStore);

  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();
  readonly bnetAccount = input<BnetAccount | null>(null);

  readonly linkBnet = output<string>();
  readonly openImport = output<void>();

  readonly regionFlags = REGION_FLAGS;

  readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const user = this.#authStore.user();
    return [
      {
        label: user?.name ?? '…',
        discordIcon: user
          ? { id: user.discordId, hash: user.avatarHash, type: DiscordIconType.User }
          : undefined,
      },
      { i18nKey: 'characters.list.title' },
    ];
  });
}
