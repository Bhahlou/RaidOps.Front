import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { BnetAccount } from '../../models/bnet-account.model';
import { BnetLinkButtonComponent } from '../../../../shared/components/bnet-link-button/bnet-link-button.component';
import { REGION_FLAGS } from '../../../../shared/constants/bnet-regions';

/**
 * Header bar for the characters list page.
 * Displays the page title, the BNet account chip when linked, and action buttons.
 */
@Component({
  selector: 'app-character-list-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslocoPipe, BnetLinkButtonComponent],
  templateUrl: './list-header.component.html',
  styleUrl: './list-header.component.scss',
})
export class ListHeaderComponent {
  readonly isBnetLoading = input.required<boolean>();
  readonly isBnetLinked = input.required<boolean>();
  readonly bnetAccount = input<BnetAccount | null>(null);

  readonly linkBnet = output<string>();
  readonly openImport = output<void>();

  readonly regionFlags = REGION_FLAGS;
}
