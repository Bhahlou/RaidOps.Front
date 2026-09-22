import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../../../shared/components/layout/page-header/page-header.component';
import { WowBrancheService } from '../../../../../shared/services/wow-branche.service';
import { expansionIdFromShortCode } from '../../../../../shared/utils/expansion-id.util';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { injectGuildContext } from '../../../inject-guild-context';
import { GuildAttributionSettingsComponent } from '../../components/guild-attribution-settings/guild-attribution-settings.component';

/**
 * Dedicated guild-level section for authoring raid content — the attribution template and each
 * boss's strategy board — kept out of the generic Settings area since both are edited far more
 * often than roster/notification config, and previously ended up split across two places
 * (definitions in Settings, the raid-plan viewer on Assignments) for no good reason.
 */
@Component({
  selector: 'app-guild-raid-assignments',
  imports: [PageHeaderComponent, GuildAttributionSettingsComponent],
  templateUrl: './guild-raid-assignments.component.html',
  styleUrl: './guild-raid-assignments.component.scss',
})
export class GuildRaidAssignmentsComponent {
  readonly #guildContext = injectGuildContext();
  readonly #branchesStore = inject(GuildBranchesStore);
  readonly #wowBrancheService = inject(WowBrancheService);

  readonly guildId = this.#guildContext.guildId;
  readonly breadcrumbs = computed(() => this.#guildContext.breadcrumbs('sidenav.guild.raidAssignments'));

  readonly #wowBranches = toSignal(this.#wowBrancheService.getAll(), { initialValue: [] });

  /**
   * The expansion the attribution template's spell picker searches against — the first active
   * branch's currently-active expansion. Good enough while spell data is TBC-only; once multiple
   * expansions are seeded, a guild running several branches at once would need to pick which one
   * to search, but that's not a real scenario yet.
   */
  readonly attributionExpansionId = computed<number | null>(() => {
    const activeBranch = this.#branchesStore.branches().find((b) => b.isActive);
    const branchShortCode = this.#wowBranches().find((wb) => wb.id === activeBranch?.branchId)?.currentExpansionShortCode;
    return expansionIdFromShortCode(branchShortCode);
  });

  constructor() {
    this.#branchesStore.load(this.guildId);
  }
}
