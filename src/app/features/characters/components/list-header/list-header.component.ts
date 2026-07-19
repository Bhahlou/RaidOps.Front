import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { BnetAccount } from '../../models/bnet-account.model';
import { CharacterStore } from '../../stores/character.store';
import {
  BnetLinkButtonComponent,
  BnetRegion,
} from '../../../../shared/components/buttons/bnet-link-button/bnet-link-button.component';
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
  readonly #store = inject(CharacterStore);

  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();
  readonly bnetAccounts = input<BnetAccount[]>([]);

  /** First-time link, from the "Lier Battle.net" CTA. */
  readonly linkBnet = output<string>();
  /** "Ajouter un autre compte" — a region picked while at least one account is already linked. */
  readonly addAnotherAccount = output<BnetRegion>();
  readonly openImport = output<void>();

  readonly regionFlags = REGION_FLAGS;

  // Right-anchored: these triggers (the account chips, and their unlink submenu in the mobile
  // "more" menu) sit near the right edge of the page, so the default left-anchored menu position
  // overflows past them. Aligns the menu's right edge with the trigger's right edge instead,
  // opening downward (falling back to upward if there's no room below).
  readonly endAlignedMenuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  ];

  unlink(account: BnetAccount): void {
    this.#store.confirmAndUnlinkBnetAccount(account).subscribe();
  }

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
