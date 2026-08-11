import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GuildSettingsFormComponent } from '../../components/guild-settings-form/guild-settings-form.component';
import { GuildNotificationSettingsComponent } from '../../components/guild-notification-settings/guild-notification-settings.component';
import { GuildBranchesComponent } from '../../components/guild-branches/guild-branches.component';
import { GuildRosterBranchesComponent } from '../../components/guild-roster-branches/guild-roster-branches.component';
import { GuildRaidBranchesComponent } from '../../components/guild-raid-branches/guild-raid-branches.component';
import { PageHeaderComponent } from '../../../../shared/components/layout/page-header/page-header.component';
import { TabDefinition, TabsComponent } from '../../../../shared/components/layout/tabs/tabs.component';
import { injectGuildContext } from '../../inject-guild-context';

type SettingsTabId = 'general' | 'roster' | 'raids' | 'notifications';

const TAB_IDS = new Set<SettingsTabId>(['general', 'roster', 'raids', 'notifications']);

@Component({
  selector: 'app-guild-settings',
  imports: [
    GuildSettingsFormComponent,
    GuildNotificationSettingsComponent,
    GuildBranchesComponent,
    GuildRosterBranchesComponent,
    GuildRaidBranchesComponent,
    PageHeaderComponent,
    TabsComponent,
  ],
  templateUrl: './guild-settings.component.html',
  styleUrl: './guild-settings.component.scss',
})
export class GuildSettingsComponent {
  readonly #guildContext = injectGuildContext();
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly guildId = this.#guildContext.guildId;

  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.settings'));

  readonly tabs: TabDefinition[] = [
    { id: 'general', labelKey: 'guildSettings.tabs.general' },
    { id: 'roster', labelKey: 'guildSettings.tabs.roster' },
    { id: 'raids', labelKey: 'guildSettings.tabs.raids' },
    { id: 'notifications', labelKey: 'guildSettings.tabs.notifications' },
  ];

  // Real route segment (`/settings/general`, `/settings/notifications`) rather than a query
  // param — a clean, shareable/bookmarkable URL for changelog links or pointing a user at a
  // specific section. Falls back to 'general' for an unknown value instead of failing.
  readonly #routeTab = toSignal(this.#route.paramMap, { requireSync: true });

  readonly activeTab = computed<SettingsTabId>(() => {
    const tab = this.#routeTab().get('tab');
    return TAB_IDS.has(tab as SettingsTabId) ? (tab as SettingsTabId) : 'general';
  });

  onTabChange(id: string): void {
    this.#router.navigate(['..', id], { relativeTo: this.#route });
  }
}
