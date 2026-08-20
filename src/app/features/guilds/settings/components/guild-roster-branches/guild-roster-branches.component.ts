import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordRole } from '../../../../../shared/models/discord-role.model';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { GuildBranchRosterSettingsCardComponent } from '../guild-branch-roster-settings-card/guild-branch-roster-settings-card.component';

/** Roster/officer role-set configuration for every active guild branch — the "Roster" settings tab. */
@Component({
  selector: 'app-guild-roster-branches',
  imports: [GuildBranchRosterSettingsCardComponent, TranslocoPipe],
  templateUrl: './guild-roster-branches.component.html',
  styleUrl: './guild-roster-branches.component.scss',
})
export class GuildRosterBranchesComponent implements OnInit {
  readonly guildId = input.required<string>();

  readonly #store = inject(GuildBranchesStore);
  readonly #settingsService = inject(GuildSettingsService);
  readonly #snackbar = inject(SnackbarService);
  readonly #authStore = inject(AuthStore);

  readonly availableRoles = signal<DiscordRole[]>([]);
  readonly rolesLoading = signal(true);

  readonly activeBranches = computed(() => this.#store.branches().filter((b) => b.isActive));

  ngOnInit(): void {
    this.#store.load(this.guildId());
    this.#loadRoles();
  }

  /**
   * The sidenav/notifications banner reads AuthStore.user() for "branch not fully configured"
   * warnings, which would otherwise stay stale until next login after an officer-roles save.
   */
  onSettingsSaved(): void {
    this.#authStore.loadUser().subscribe();
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
