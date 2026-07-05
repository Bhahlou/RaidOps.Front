import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { form, FormField, required, submit as submitForm } from '@angular/forms/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscordRole } from '../../../../shared/models/discord-role.model';
import { GuildSettings } from '../../models/guild-settings.model';
import { OfficerThreshold } from '../../models/officer-threshold.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildStore } from '../../stores/guild.store';
import { OfficerThresholdStore } from '../../stores/officer-threshold.store';
import { RoleThresholdPickerComponent } from '../role-threshold-picker/role-threshold-picker.component';

interface TimezoneOption {
  id: string;
  label: string;
}

interface SettingsFormModel {
  timezone: string;
  rosterMode: RosterMode;
  minRosterRoleId: string | null;
  minOfficerRoleId: string | null;
}

const NOW = new Date();

export function buildTimezoneOption(tz: string): TimezoneOption {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(NOW);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return { id: tz, label: `${tz} (${offset})` };
  } catch {
    return { id: tz, label: tz };
  }
}

const ALL_TIMEZONE_OPTIONS: TimezoneOption[] =
  Intl.supportedValuesOf('timeZone').map(buildTimezoneOption);

@Component({
  selector: 'app-guild-settings-form',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
    RoleThresholdPickerComponent,
  ],
  templateUrl: './guild-settings-form.component.html',
  styleUrl: './guild-settings-form.component.scss',
})
export class GuildSettingsFormComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly saved = output<void>();

  readonly #settingsService = inject(GuildSettingsService);
  readonly #guildStore = inject(GuildStore);
  readonly #officerThresholdStore = inject(OfficerThresholdStore);
  readonly #authStore = inject(AuthStore);
  readonly #snackbar = inject(SnackbarService);

  readonly RosterMode = RosterMode;

  readonly availableRoles = signal<DiscordRole[]>([]);
  readonly rolesLoading = signal(true);

  readonly #model = signal<SettingsFormModel>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    rosterMode: RosterMode.Open,
    minRosterRoleId: null,
    minOfficerRoleId: null,
  });

  readonly settingsForm = form(this.#model, (schemaPath) => {
    required(schemaPath.timezone);
    required(schemaPath.minRosterRoleId, {
      when: ({ valueOf }) => valueOf(schemaPath.rosterMode) === RosterMode.DiscordRoleOnly,
    });
    required(schemaPath.minOfficerRoleId);
  });

  readonly submitting = computed(() => this.settingsForm().submitting());

  readonly filteredTimezones = computed(() => {
    const query = this.settingsForm.timezone().value().toLowerCase();
    return ALL_TIMEZONE_OPTIONS.filter((tz) => tz.label.toLowerCase().includes(query));
  });

  readonly isDiscordRoleMode = computed(
    () => this.settingsForm.rosterMode().value() === RosterMode.DiscordRoleOnly,
  );

  /**
   * Roles in display order, preserving the backend order (ascending by Discord position).
   * In Discord, lower position number = higher in the role hierarchy = more powerful.
   * Index 0 = most powerful (Admin), last index = least powerful.
   */
  readonly sortedRoles = computed(() => this.availableRoles());

  readonly displayTimezone = (id: string): string =>
    ALL_TIMEZONE_OPTIONS.find((tz) => tz.id === id)?.label ?? id;

  ngOnInit(): void {
    // Roles are needed for both the roster and Officer threshold pickers, so load them eagerly.
    this.#loadRoles();

    this.#guildStore.loadSettings(this.guildId()).subscribe({
      next: (settings) => {
        this.#model.update((m) => ({
          ...m,
          ...(settings.timezone ? { timezone: settings.timezone } : {}),
          rosterMode: settings.rosterMode,
          minRosterRoleId: settings.minRosterRoleId,
        }));
      },
    });

    this.#officerThresholdStore.loadOfficerThreshold(this.guildId()).subscribe({
      next: (officerThreshold) => {
        this.#model.update((m) => ({ ...m, minOfficerRoleId: officerThreshold.minOfficerRoleId }));
      },
    });
  }

  /**
   * mat-button-toggle-group doesn't implement Signal Forms' FormValueControl (it only speaks the
   * older ControlValueAccessor), so its value is wired manually instead of via [formField].
   */
  onRosterModeChange(event: MatButtonToggleChange): void {
    this.settingsForm.rosterMode().value.set(event.value as RosterMode);
    if (event.value !== RosterMode.DiscordRoleOnly) {
      this.settingsForm.minRosterRoleId().value.set(null);
    }
  }

  /**
   * mat-autocomplete reports option selection through its own ControlValueAccessor hook, not a
   * native input event, so [formField] alone (which only listens for native input/change events)
   * never sees a value picked from the dropdown — only typed input. Bridged manually here.
   */
  onTimezoneSelected(event: MatAutocompleteSelectedEvent): void {
    this.settingsForm.timezone().value.set(event.option.value as string);
  }

  async submit(): Promise<void> {
    await submitForm(this.settingsForm, async (field) => {
      const { timezone, rosterMode, minRosterRoleId, minOfficerRoleId } = field().value();
      const settings: GuildSettings = {
        timezone,
        rosterMode,
        minRosterRoleId: rosterMode === RosterMode.DiscordRoleOnly ? minRosterRoleId : null,
      };
      const officerThreshold: OfficerThreshold = { minOfficerRoleId };

      try {
        await firstValueFrom(
          forkJoin([
            this.#settingsService.updateSettings(this.guildId(), settings),
            this.#settingsService.updateOfficerThreshold(this.guildId(), officerThreshold),
          ]),
        );
      } catch {
        this.#snackbar.error('errors.server');
        return { kind: 'serverError', message: 'errors.server' };
      }

      this.#guildStore.patchSettings(this.guildId(), settings);
      this.#officerThresholdStore.patchOfficerThreshold(this.guildId(), officerThreshold);
      this.#snackbar.success('guildSettings.saveSuccess');
      // Resyncs /me so the "Officer threshold not configured" notification clears immediately
      // instead of lingering until the next reload/login.
      this.#authStore.loadUser().subscribe();
      this.saved.emit();
      return undefined;
    });
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
