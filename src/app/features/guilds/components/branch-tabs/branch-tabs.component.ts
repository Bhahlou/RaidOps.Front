import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuildBranch } from '../../../../core/models/user-guild-branch.model';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { expansionIconUrl } from '../../../../shared/utils/expansion-icon.util';

type BranchLeaf = 'dashboard' | 'roster' | 'loot' | 'raids';

// Mirrors the `data.minAccessLevel` set per leaf in guilds.routes.ts — a tab must never offer a
// branch the branch-access guard would immediately bounce the user out of.
const REQUIRED_LEVEL: Record<BranchLeaf, GuildAccessLevel> = {
  dashboard: GuildAccessLevel.Public,
  roster: GuildAccessLevel.Roster,
  loot: GuildAccessLevel.Roster,
  'raids': GuildAccessLevel.Roster,
};

/**
 * Branch switcher for Dashboard/Roster/Loot/Raid builder — not Calendar, which stays guild-level (see
 * guilds.routes.ts). Renders nothing for single-branch guilds: no branch UI for the common case.
 * Reuses the visual language of the shared `app-tabs` component (same `.tabs`/`.tab`/`.tab--active`
 * look) but not the component itself — these are real route links between distinct pages, not a
 * same-page panel switch, so `routerLink`/`routerLinkActive` fit better than `app-tabs`'s
 * click-and-emit API.
 */
@Component({
  selector: 'app-branch-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './branch-tabs.component.html',
  styleUrl: './branch-tabs.component.scss',
})
export class BranchTabsComponent {
  readonly guildId = input.required<string>();
  readonly leaf = input.required<BranchLeaf>();

  readonly #authStore = inject(AuthStore);
  readonly #wowBrancheService = inject(WowBrancheService);

  readonly #wowBranches = toSignal(this.#wowBrancheService.getAll(), { initialValue: [] });

  // Short codes whose icon 404'd — falls back to no icon (label only) instead of a broken <img>.
  readonly #failedIcons = signal<Set<string>>(new Set());

  // Only branches the user has at least the leaf's required access level on — e.g. Roster
  // access is per-branch (open-to-all on one branch doesn't imply access on another), so a tab
  // must never be offered for a branch the guard would immediately redirect out of.
  readonly branches = computed(() => {
    const allBranches = this.#authStore.user()?.guilds.find((g) => g.id === this.guildId())?.branches ?? [];
    const requiredLevel = REQUIRED_LEVEL[this.leaf()];
    return allBranches.filter((b) => hasGuildAccess(b.accessLevel, requiredLevel));
  });

  iconUrl(branch: UserGuildBranch): string | null {
    const shortCode = this.#wowBranches().find((b) => b.id === branch.branchId)?.currentExpansionShortCode;
    if (!shortCode || this.#failedIcons().has(shortCode)) return null;
    return expansionIconUrl(shortCode);
  }

  onIconError(branch: UserGuildBranch): void {
    const shortCode = this.#wowBranches().find((b) => b.id === branch.branchId)?.currentExpansionShortCode;
    if (shortCode) this.#failedIcons.update((s) => new Set([...s, shortCode]));
  }
}
