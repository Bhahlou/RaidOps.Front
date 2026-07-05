import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetAccount } from '../../models/bnet-account.model';
import { BnetLinkButtonComponent } from '../../../../shared/components/bnet-link-button/bnet-link-button.component';
import { BnetIconComponent } from '../../../../shared/components/bnet-icon/bnet-icon.component';
import {
  PageHeaderComponent,
  BreadcrumbItem,
} from '../../../../shared/components/page-header/page-header.component';
import { REGION_FLAGS } from '../../../../shared/constants/bnet-regions';
import { AuthStore } from '../../../../core/stores/auth.store';
import { DiscordIconType } from '../../../../shared/models/discord-icon-type.enum';

/**
 * Header bar for the characters list page.
 * Displays the breadcrumb (with the manual "?" link), the BNet account chip when linked, and action buttons.
 */
@Component({
  selector: 'app-character-list-header',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
    BnetLinkButtonComponent,
    BnetIconComponent,
    PageHeaderComponent,
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
