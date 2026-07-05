import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
    ReactiveFormsModule,
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
  readonly submitting = signal(false);

  readonly form = new FormGroup({
    timezone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rosterMode: new FormControl<RosterMode>(RosterMode.Open, { nonNullable: true }),
    minRosterRoleId: new FormControl<string | null>(null),
    minOfficerRoleId: new FormControl<string | null>(null, { validators: [Validators.required] }),
  });

  readonly #timezoneValue = toSignal(this.form.controls.timezone.valueChanges, {
    initialValue: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
  });

  readonly #rosterModeValue = toSignal(this.form.controls.rosterMode.valueChanges, {
    initialValue: RosterMode.Open,
  });

  readonly minRosterRoleIdValue = toSignal(this.form.controls.minRosterRoleId.valueChanges, {
    initialValue: null,
  });

  readonly minOfficerRoleIdValue = toSignal(this.form.controls.minOfficerRoleId.valueChanges, {
    initialValue: null,
  });

  readonly filteredTimezones = computed(() => {
    const query = this.#timezoneValue().toLowerCase();
    return ALL_TIMEZONE_OPTIONS.filter((tz) => tz.label.toLowerCase().includes(query));
  });

  readonly isDiscordRoleMode = computed(
    () => this.#rosterModeValue() === RosterMode.DiscordRoleOnly,
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
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localTz) {
      this.form.controls.timezone.setValue(localTz);
    }

    this.form.controls.rosterMode.valueChanges.subscribe((mode) => {
      const ctrl = this.form.controls.minRosterRoleId;
      if (mode === RosterMode.DiscordRoleOnly) {
        ctrl.addValidators(Validators.required);
      } else {
        ctrl.removeValidators(Validators.required);
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });

    // Roles are needed for both the roster and Officer threshold pickers, so load them eagerly.
    this.#loadRoles();

    this.#guildStore.loadSettings(this.guildId()).subscribe({
      next: (settings) => {
        this.form.patchValue({
          ...(settings.timezone ? { timezone: settings.timezone } : {}),
          rosterMode: settings.rosterMode,
          minRosterRoleId: settings.minRosterRoleId,
        });
      },
    });

    this.#officerThresholdStore.loadOfficerThreshold(this.guildId()).subscribe({
      next: (officerThreshold) => {
        this.form.patchValue({ minOfficerRoleId: officerThreshold.minOfficerRoleId });
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const { timezone, rosterMode, minRosterRoleId, minOfficerRoleId } = this.form.getRawValue();
    const settings: GuildSettings = {
      timezone,
      rosterMode,
      minRosterRoleId: rosterMode === RosterMode.DiscordRoleOnly ? minRosterRoleId : null,
    };
    const officerThreshold: OfficerThreshold = { minOfficerRoleId };

    this.submitting.set(true);
    forkJoin([
      this.#settingsService.updateSettings(this.guildId(), settings),
      this.#settingsService.updateOfficerThreshold(this.guildId(), officerThreshold),
    ]).subscribe({
      next: () => {
        this.submitting.set(false);
        this.#guildStore.patchSettings(this.guildId(), settings);
        this.#officerThresholdStore.patchOfficerThreshold(this.guildId(), officerThreshold);
        this.#snackbar.success('guildSettings.saveSuccess');
        // Resyncs /me so the "Officer threshold not configured" notification clears immediately
        // instead of lingering until the next reload/login.
        this.#authStore.loadUser().subscribe();
        this.saved.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.#snackbar.error('errors.server');
      },
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
