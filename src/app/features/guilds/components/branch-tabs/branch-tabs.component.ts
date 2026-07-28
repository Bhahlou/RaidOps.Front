import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UserGuildBranch } from '../../../../core/models/user-guild-branch.model';
import { GuildAccessLevel, hasGuildAccess } from '../../../../core/models/guild-access-level.enum';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';

type BranchLeaf = 'dashboard' | 'roster' | 'loot';

// Mirrors the `data.minAccessLevel` set per leaf in guilds.routes.ts — a tab must never offer a
// branch the branch-access guard would immediately bounce the user out of.
const REQUIRED_LEVEL: Record<BranchLeaf, GuildAccessLevel> = {
  dashboard: GuildAccessLevel.Public,
  roster: GuildAccessLevel.Roster,
  loot: GuildAccessLevel.Roster,
};

// TEMPORARY — hotlinked WoWpedia icons, at the user's request, while a self-hosted/final set is
// sourced (see project_multi_branch_guild_architecture memory). Swap this map for local paths
// under public/assets/images/expansion-icons/ once available — nothing else here needs to change.
const EXPANSION_ICON_URLS: Record<string, string> = {
  Classic: 'https://static.wikia.nocookie.net/wowpedia/images/3/38/WoW_Icon_update.png/revision/latest?cb=20180602175550',
  TBC: 'https://static.wikia.nocookie.net/wowpedia/images/0/0e/Bc_icon.gif/revision/latest?cb=20110218184702',
  WotLK: 'https://static.wikia.nocookie.net/wowpedia/images/c/c1/Wrath-Logo-Small.png/revision/latest?cb=20090403101742',
  Cata: 'https://static.wikia.nocookie.net/wowpedia/images/e/ef/Cata-Logo-Small.png/revision/latest?cb=20120818171714',
  MoP: 'https://static.wikia.nocookie.net/wowpedia/images/2/26/Mists-Logo-Small.png/revision/latest?cb=20120407193524',
  WoD: 'https://static.wikia.nocookie.net/wowpedia/images/7/71/WoD-Logo-Small.png/revision/latest?cb=20131108221912',
  Legion: 'https://static.wikia.nocookie.net/wowpedia/images/f/fd/Legion-Logo-Small.png/revision/latest?cb=20150808040028',
  BfA: 'https://static.wikia.nocookie.net/wowpedia/images/c/c1/BattleForAzeroth-Logo-Small.png/revision/latest/scale-to-width-down/48?cb=20220421181442',
  SL: 'https://static.wikia.nocookie.net/wowpedia/images/9/9a/Shadowlands-Icon-Inline.png/revision/latest/scale-to-width-down/48?cb=20210930025728',
  DF: 'https://static.wikia.nocookie.net/wowpedia/images/6/61/Dragonflight-Icon-Inline.png/revision/latest/scale-to-width-down/48?cb=20220428173245',
  TWW: 'https://cdn2.steamgriddb.com/icon_thumb/262ab2fcd459d0f9190997df93c91845.png',
};

/**
 * Branch switcher for Dashboard/Roster/Loot — not Calendar, which stays guild-level (see
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
    return EXPANSION_ICON_URLS[shortCode] ?? null;
  }

  onIconError(branch: UserGuildBranch): void {
    const shortCode = this.#wowBranches().find((b) => b.id === branch.branchId)?.currentExpansionShortCode;
    if (shortCode) this.#failedIcons.update((s) => new Set([...s, shortCode]));
  }
}
