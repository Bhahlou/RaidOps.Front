import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { GuildSettingsFormComponent } from '../../components/guild-settings-form/guild-settings-form.component';
import { GuildNotificationSettingsComponent } from '../../components/guild-notification-settings/guild-notification-settings.component';
import { GuildBranchesComponent } from '../../components/guild-branches/guild-branches.component';
import { GuildRosterBranchesComponent } from '../../components/guild-roster-branches/guild-roster-branches.component';
import { GuildBranchRaidSettingsCardComponent } from '../../components/guild-branch-raid-settings-card/guild-branch-raid-settings-card.component';
import { GuildAttributionSettingsComponent } from '../../components/guild-attribution-settings/guild-attribution-settings.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/form/select/select.component';
import { PageHeaderComponent } from '../../../../../shared/components/layout/page-header/page-header.component';
import { TabDefinition, TabsComponent } from '../../../../../shared/components/layout/tabs/tabs.component';
import { WowBrancheService } from '../../../../../shared/services/wow-branche.service';
import { expansionIconUrl } from '../../../../../shared/utils/expansion-icon.util';
import { expansionIdFromShortCode } from '../../../../../shared/utils/expansion-id.util';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { injectGuildContext } from '../../../inject-guild-context';

type SettingsTabId = 'general' | 'roster' | 'raids' | 'notifications';

const TAB_IDS = new Set<SettingsTabId>(['general', 'roster', 'raids', 'notifications']);

@Component({
  selector: 'app-guild-settings',
  imports: [
    GuildSettingsFormComponent,
    GuildNotificationSettingsComponent,
    GuildBranchesComponent,
    GuildRosterBranchesComponent,
    GuildBranchRaidSettingsCardComponent,
    GuildAttributionSettingsComponent,
    PageHeaderComponent,
    SelectComponent,
    TabsComponent,
    TranslocoPipe,
  ],
  templateUrl: './guild-settings.component.html',
  styleUrl: './guild-settings.component.scss',
})
export class GuildSettingsComponent {
  readonly #guildContext = injectGuildContext();
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #wowBrancheService = inject(WowBrancheService);

  readonly guildId = this.#guildContext.guildId;

  readonly #wowBranches = toSignal(this.#wowBrancheService.getAll(), { initialValue: [] });

  /** Active guild branches — the Raids tab (signup mode, attribution template) works on one at a time. */
  readonly activeBranches = computed(() => this.#branchesStore.branches().filter((b) => b.isActive));

  readonly #selectedBranchKey = signal<string | null>(null);

  /** The branch being edited — the user's pick, or the first active branch until they choose one (or if their pick was since deactivated). */
  readonly selectedBranch = computed(() => {
    const branches = this.activeBranches();
    const key = this.#selectedBranchKey();
    return branches.find((b) => String(b.id) === key) ?? branches[0] ?? null;
  });

  readonly branchOptions = computed<SelectOption<string>[]>(() =>
    this.activeBranches().map((b) => ({
      value: String(b.id),
      label: b.branchName,
      iconUrl: expansionIconUrl(this.#wowBranches().find((wb) => wb.id === b.branchId)?.currentExpansionShortCode),
    })),
  );

  /** The selected branch's currently-active expansion — filters the class picker in the template editor. */
  readonly selectedBranchExpansionId = computed<number | null>(() => {
    const branchShortCode = this.#wowBranches().find((wb) => wb.id === this.selectedBranch()?.branchId)?.currentExpansionShortCode;
    return expansionIdFromShortCode(branchShortCode);
  });

  onBranchChange(key: string | null): void {
    this.#selectedBranchKey.set(key);
  }

  constructor() {
    this.#branchesStore.load(this.guildId);
  }

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
