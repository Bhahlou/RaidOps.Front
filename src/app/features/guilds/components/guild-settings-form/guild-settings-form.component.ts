import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { form, FormField, FormRoot, required, submit as submitForm } from '@angular/forms/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
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
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { LanguageService } from '../../../../core/services/language.service';

interface TimezoneOption {
  id: string;
  label: string;
}

interface SettingsFormModel {
  timezone: string;
  rosterMode: RosterMode;
  minRosterRoleId: string | null;
  minOfficerRoleId: string | null;
  language: string;
}

/** Native-language labels — deliberately not translated, same convention as the header's lang selector. */
const LANGUAGE_LABELS: Record<string, string> = { fr: 'Français', en: 'English', de: 'Deutsch' };

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
    FormRoot,
    SelectComponent,
    FormFieldCardComponent,
    TranslocoPipe,
    RoleThresholdPickerComponent,
    ButtonComponent,
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
  readonly #languageService = inject(LanguageService);

  readonly RosterMode = RosterMode;

  readonly availableRoles = signal<DiscordRole[]>([]);
  readonly rolesLoading = signal(true);

  readonly #model = signal<SettingsFormModel>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    rosterMode: RosterMode.Open,
    minRosterRoleId: null,
    minOfficerRoleId: null,
    language: this.#languageService.activeLang,
  });

  readonly settingsForm = form(
    this.#model,
    (schemaPath) => {
      required(schemaPath.timezone);
      required(schemaPath.minRosterRoleId, {
        when: ({ valueOf }) => valueOf(schemaPath.rosterMode) === RosterMode.DiscordRoleOnly,
      });
      required(schemaPath.minOfficerRoleId);
      required(schemaPath.language);
    },
    {
      submission: {
        action: async (field) => {
          const { timezone, rosterMode, minRosterRoleId, minOfficerRoleId, language } = field().value();
          const settings: GuildSettings = {
            timezone,
            rosterMode,
            minRosterRoleId: rosterMode === RosterMode.DiscordRoleOnly ? minRosterRoleId : null,
            language,
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
        },
      },
    },
  );

  readonly submitting = computed(() => this.settingsForm().submitting());

  readonly timezoneOptions: SelectOption<string>[] = ALL_TIMEZONE_OPTIONS.map((tz) => ({
    value: tz.id,
    label: tz.label,
  }));

  readonly languageOptions: SelectOption<string>[] = this.#languageService.availableLangs.map((lang) => ({
    value: lang,
    label: LANGUAGE_LABELS[lang] ?? lang,
  }));

  readonly isDiscordRoleMode = computed(
    () => this.settingsForm.rosterMode().value() === RosterMode.DiscordRoleOnly,
  );

  /**
   * True once settings have loaded and the guild has no `language` saved server-side yet — the
   * value currently shown in the picker is only this browser's own guess (see `#model`'s initial
   * value), never persisted for the guild until Save is pressed. Surfaces that distinction in the
   * template instead of letting an unsaved guess look identical to a real saved setting.
   */
  readonly languageNotYetSaved = computed(() => {
    const settings = this.#guildStore.settings();
    return settings != null && !settings.language;
  });

  /**
   * Roles in display order, preserving the backend order (ascending by Discord position).
   * In Discord, lower position number = higher in the role hierarchy = more powerful.
   * Index 0 = most powerful (Admin), last index = least powerful.
   */
  readonly sortedRoles = computed(() => this.availableRoles());

  constructor() {
    // GuildStore/OfficerThresholdStore are httpResource()-backed and thus resolve asynchronously —
    // these effects patch the local form model whenever their signals produce a value, instead of
    // the one-shot Observable.subscribe() the pre-httpResource version used. Also re-fires (as a
    // harmless no-op) right after this component's own patchSettings()/patchOfficerThreshold() calls
    // on submit, since those write the same values the model already holds.
    effect(() => {
      const settings = this.#guildStore.settings();
      if (!settings) return;
      this.#model.update((m) => ({
        ...m,
        ...(settings.timezone ? { timezone: settings.timezone } : {}),
        rosterMode: settings.rosterMode,
        minRosterRoleId: settings.minRosterRoleId,
        ...(settings.language ? { language: settings.language } : {}),
      }));
    });

    effect(() => {
      const officerThreshold = this.#officerThresholdStore.officerThreshold();
      if (!officerThreshold) return;
      this.#model.update((m) => ({ ...m, minOfficerRoleId: officerThreshold.minOfficerRoleId }));
    });
  }

  ngOnInit(): void {
    // Roles are needed for both the roster and Officer threshold pickers, so load them eagerly.
    this.#loadRoles();
    this.#guildStore.loadSettings(this.guildId());
    this.#officerThresholdStore.loadOfficerThreshold(this.guildId());
  }

  /**
   * The roster-mode toggle is a plain pair of buttons (not a FormValueControl), so its value is
   * wired manually instead of via [formField].
   */
  onRosterModeChange(mode: RosterMode): void {
    this.settingsForm.rosterMode().value.set(mode);
    if (mode !== RosterMode.DiscordRoleOnly) {
      this.settingsForm.minRosterRoleId().value.set(null);
    }
  }

  /**
   * The <form> uses [formRoot] to trigger submission from a real DOM submit event (see the
   * template) — this method exists so the submission flow can also be triggered directly (used
   * by this component's own tests). Both paths run the same pre-configured submission.action.
   */
  async submit(): Promise<void> {
    await submitForm(this.settingsForm);
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
