import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordIconComponent } from '../discord-icon/discord-icon.component';
import { ManualHelpLinkComponent } from '../manual-help-link/manual-help-link.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

export interface BreadcrumbItem {
  label?: string;
  i18nKey?: string;
  link?: string[] | null;
  discordIcon?: { id: string; hash: string | null; type: DiscordIconType };
}

/** Points a page header's "?" link at a manual article — see {@link ManualHelpLinkComponent}. */
export interface ManualLink {
  category: string;
  article: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, MatIcon, TranslocoPipe, DiscordIconComponent, ManualHelpLinkComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly items = input.required<BreadcrumbItem[]>();
  readonly manualLink = input<ManualLink>();
}
