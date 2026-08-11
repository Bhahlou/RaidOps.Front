import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { MultiSelectComponent, MultiSelectOption } from '../../../../shared/components/form/multi-select/multi-select.component';
import { DiscordRole } from '../../../../shared/models/discord-role.model';
import { formatDiscordColor } from '../../../../shared/utils/discord-color.util';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildBranch, GuildBranchRosterSettings } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { GuildBranchesService } from '../../services/guild-branches.service';

/**
 * Roster/officer role-set editor for one active guild branch. Auto-saves on every change — each
 * control (toggle click, multi-select pick) only ever fires from a real user interaction, never
 * from `ngOnInit`'s initial hydration off `branch()`, so there's no risk of persisting a value
 * nobody actually chose. The only cross-field rule ("roster roles required when Discord-role mode
 * is on") is a plain computed guard that also gates the auto-save itself — switching to
 * Discord-role mode without picking a role yet simply doesn't save until one is picked.
 */
@Component({
  selector: 'app-guild-branch-roster-settings-card',
  imports: [FormFieldCardComponent, TranslocoPipe, MultiSelectComponent],
  templateUrl: './guild-branch-roster-settings-card.component.html',
  styleUrl: './guild-branch-roster-settings-card.component.scss',
})
export class GuildBranchRosterSettingsCardComponent implements OnInit {
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
  readonly submitting = signal(false);

  readonly isDiscordRoleMode = computed(() => this.rosterMode() === RosterMode.DiscordRoleOnly);

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
  }

  onRosterModeChange(mode: RosterMode): void {
    this.rosterMode.set(mode);
    void this.save();
  }

  onRosterRoleIdsChange(roleIds: string[]): void {
    this.rosterRoleIds.set(roleIds);
    void this.save();
  }

  onOfficerRoleIdsChange(roleIds: string[]): void {
    this.officerRoleIds.set(roleIds);
    void this.save();
  }

  private async save(): Promise<void> {
    if (!this.canSave()) return;

    const settings: GuildBranchRosterSettings = {
      rosterMode: this.rosterMode(),
      rosterRoleIds: this.isDiscordRoleMode() ? this.rosterRoleIds() : [],
      officerRoleIds: this.officerRoleIds(),
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#branchesService.updateRosterSettings(this.guildId(), this.branch().id, settings));
      this.#snackbar.success('guildSettings.branches.rosterSettings.saveSuccess');
      this.saved.emit();
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.submitting.set(false);
    }
  }
}
