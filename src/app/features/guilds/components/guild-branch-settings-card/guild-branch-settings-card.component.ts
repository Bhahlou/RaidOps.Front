import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { MultiSelectComponent, MultiSelectOption } from '../../../../shared/components/form/multi-select/multi-select.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { DiscordRole } from '../../../../shared/models/discord-role.model';
import { formatDiscordColor } from '../../../../shared/utils/discord-color.util';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildBranch, GuildBranchRegion, GuildBranchRosterSettings } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { GuildBranchesService } from '../../services/guild-branches.service';

const REGIONS: GuildBranchRegion[] = ['eu', 'us', 'kr', 'tw'];

/**
 * Roster/officer role-set editor for one active guild branch. Deliberately hand-rolled signals
 * instead of Signal Forms — the only cross-field rule ("roster roles required when Discord-role
 * mode is on") is a plain computed guard, the same pattern already used by
 * GuildNotificationSettingsComponent's `canSave`, rather than fighting the schema API over
 * array-length validation.
 */
@Component({
  selector: 'app-guild-branch-settings-card',
  imports: [FormFieldCardComponent, TranslocoPipe, MultiSelectComponent, SelectComponent, ButtonComponent],
  templateUrl: './guild-branch-settings-card.component.html',
  styleUrl: './guild-branch-settings-card.component.scss',
})
export class GuildBranchSettingsCardComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly branch = input.required<GuildBranch>();
  readonly roles = input<DiscordRole[]>([]);
  readonly rolesLoading = input(false);
  readonly saved = output<void>();

  readonly #branchesService = inject(GuildBranchesService);
  readonly #snackbar = inject(SnackbarService);
  readonly #transloco = inject(TranslocoService);

  readonly RosterMode = RosterMode;

  readonly rosterMode = signal<RosterMode>(RosterMode.Open);
  readonly rosterRoleIds = signal<string[]>([]);
  readonly officerRoleIds = signal<string[]>([]);
  readonly region = signal<GuildBranchRegion | null>(null);
  readonly submitting = signal(false);

  readonly isDiscordRoleMode = computed(() => this.rosterMode() === RosterMode.DiscordRoleOnly);

  readonly regionOptions = computed<SelectOption<GuildBranchRegion>[]>(() =>
    REGIONS.map((region) => ({ value: region, label: this.#transloco.translate(`guildSettings.branches.region.options.${region}`) })),
  );

  /** Roster roles must be non-empty in Discord-role mode — otherwise nobody could ever join. */
  readonly canSave = computed(() => !this.isDiscordRoleMode() || this.rosterRoleIds().length > 0);

  readonly roleOptions = computed<MultiSelectOption<string>[]>(() =>
    this.roles().map((role) => ({
      value: role.id,
      label: role.name,
      color: formatDiscordColor(role.color),
      iconUrl: role.iconHash ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.iconHash}.webp?size=32` : null,
    })),
  );

  readonly rolesPlaceholder = computed(() =>
    this.rolesLoading()
      ? this.#transloco.translate('guildSettings.roles.loading')
      : this.#transloco.translate('guildSettings.roles.placeholder'),
  );

  ngOnInit(): void {
    const branch = this.branch();
    this.rosterMode.set(branch.rosterMode ?? RosterMode.Open);
    this.rosterRoleIds.set(branch.rosterRoleIds);
    this.officerRoleIds.set(branch.officerRoleIds);
    this.region.set(branch.region);
  }

  onRosterModeChange(mode: RosterMode): void {
    this.rosterMode.set(mode);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;

    const settings: GuildBranchRosterSettings = {
      rosterMode: this.rosterMode(),
      rosterRoleIds: this.isDiscordRoleMode() ? this.rosterRoleIds() : [],
      officerRoleIds: this.officerRoleIds(),
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#branchesService.updateRosterSettings(this.guildId(), this.branch().id, settings));

      const region = this.region();
      if (region && region !== this.branch().region) {
        await firstValueFrom(this.#branchesService.updateRegion(this.guildId(), this.branch().id, region));
      }

      this.#snackbar.success('guildSettings.branches.rosterSettings.saveSuccess');
      this.saved.emit();
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.submitting.set(false);
    }
  }
}
