import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MultiSelectComponent, MultiSelectOption } from '../../../../shared/components/form/multi-select/multi-select.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { DiscordRole } from '../../../../shared/models/discord-role.model';
import { Branch } from '../../../../shared/models/branch.model';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildBranchesService } from '../../services/guild-branches.service';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildBranchSettingsCardComponent } from '../guild-branch-settings-card/guild-branch-settings-card.component';

@Component({
  selector: 'app-guild-branches',
  imports: [MultiSelectComponent, FormFieldCardComponent, TranslocoPipe, GuildBranchSettingsCardComponent],
  templateUrl: './guild-branches.component.html',
  styleUrl: './guild-branches.component.scss',
})
export class GuildBranchesComponent implements OnInit {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildBranchesStore);
  readonly #branchesService = inject(GuildBranchesService);
  readonly #wowBranchService = inject(WowBrancheService);
  readonly #settingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #authStore = inject(AuthStore);
  readonly #transloco = inject(TranslocoService);

  readonly wowBranches = signal<Branch[]>([]);
  readonly availableRoles = signal<DiscordRole[]>([]);
  readonly rolesLoading = signal(true);

  readonly guildBranches = this.#store.branches;
  readonly isLoading = this.#store.isLoading;

  readonly branchOptions = computed<MultiSelectOption<number>[]>(() =>
    this.wowBranches().map((b) => ({ value: b.id, label: `${b.name} (${b.currentExpansionShortCode})` })),
  );

  readonly activeBranchIds = computed(() =>
    this.guildBranches()
      .filter((b) => b.isActive)
      .map((b) => b.branchId),
  );

  readonly activeBranches = computed(() => this.guildBranches().filter((b) => b.isActive));

  readonly branchesPlaceholder = computed(() =>
    this.isLoading()
      ? this.#transloco.translate('guildSettings.branches.activation.loading')
      : this.#transloco.translate('guildSettings.branches.activation.placeholder'),
  );

  ngOnInit(): void {
    this.#store.load(this.guildId());
    this.#wowBranchService.getAll().subscribe((branches) => this.wowBranches.set(branches));
    this.#loadRoles();
  }

  /**
   * Returns a Promise purely so tests can await the resulting activate/deactivate calls —
   * the (valueChange) template binding fires it without awaiting either way.
   */
  async onBranchSelectionChange(branchIds: number[]): Promise<void> {
    const current = new Set(this.activeBranchIds());
    const next = new Set(branchIds);

    const toActivate = branchIds.filter((id) => !current.has(id));
    const toDeactivate = [...current].filter((id) => !next.has(id));

    await Promise.all([...toActivate.map((id) => this.#activate(id)), ...toDeactivate.map((id) => this.#deactivate(id))]);
  }

  async #activate(branchId: number): Promise<void> {
    try {
      await firstValueFrom(this.#branchesService.activateBranch(this.guildId(), branchId));
      this.#store.reload();
      // The sidenav and branch routing guards read AuthStore.user().guilds[].branches, which
      // would otherwise go stale until next login — resync it so the newly-activated branch is
      // immediately visible/navigable.
      this.#authStore.loadUser().subscribe();
    } catch {
      this.#snackbar.error('errors.server');
    }
  }

  async #deactivate(branchId: number): Promise<void> {
    const guildBranch = this.guildBranches().find((b) => b.branchId === branchId);
    if (!guildBranch) return;

    try {
      await firstValueFrom(this.#branchesService.deactivateBranch(this.guildId(), guildBranch.id));
      this.#store.reload();
      this.#authStore.loadUser().subscribe();
    } catch {
      this.#snackbar.error('errors.server');
    }
  }

  #loadRoles(): void {
    this.rolesLoading.set(true);
    this.#settingsService.getDiscordRoles(this.guildId()).subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
      },
      error: () => {
        this.rolesLoading.set(false);
        this.#snackbar.error('errors.server');
      },
    });
  }
}
