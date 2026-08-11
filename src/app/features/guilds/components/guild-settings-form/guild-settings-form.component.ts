import { Component, computed, effect, inject, input, OnInit, output, signal, untracked } from '@angular/core';
import { form, FormField, FormRoot, required, submit as submitForm } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { SelectComponent, SelectOption } from '../../../../shared/components/form/select/select.component';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { GuildSettings } from '../../models/guild-settings.model';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildStore } from '../../stores/guild.store';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { LanguageService } from '../../../../core/services/language.service';

interface TimezoneOption {
  id: string;
  label: string;
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
  imports: [FormField, FormRoot, SelectComponent, FormFieldCardComponent, TranslocoPipe, ButtonComponent],
  templateUrl: './guild-settings-form.component.html',
  styleUrl: './guild-settings-form.component.scss',
})
export class GuildSettingsFormComponent implements OnInit {
  readonly guildId = input.required<string>();
  /**
   * When true, saves as soon as the user picks a value — no Save button. Only safe for contexts
   * where accepting the pre-filled browser guess without interacting is a valid end state (the
   * settings page); the get-started wizard and register flow keep the explicit button, since there
   * the click is what confirms/advances past a guessed default the officer never touched.
   */
  readonly autoSave = input(false);
  readonly saved = output<void>();

  readonly #settingsService = inject(GuildSettingsService);
  readonly #guildStore = inject(GuildStore);
  readonly #authStore = inject(AuthStore);
  readonly #snackbar = inject(SnackbarService);
  readonly #languageService = inject(LanguageService);

  readonly #model = signal<GuildSettings>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    language: this.#languageService.activeLang,
  });

  readonly settingsForm = form(
    this.#model,
    (schemaPath) => {
      required(schemaPath.timezone);
      required(schemaPath.language);
    },
    {
      submission: {
        action: async (field) => {
          const settings = field().value();

          try {
            await firstValueFrom(this.#settingsService.updateSettings(this.guildId(), settings));
          } catch {
            this.#snackbar.error('errors.server');
            return { kind: 'serverError', message: 'errors.server' };
          }

          this.#guildStore.patchSettings(this.guildId(), settings);
          this.#snackbar.success('guildSettings.saveSuccess');
          // Resyncs /me so the "guild language not configured" notification clears immediately
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

  constructor() {
    // GuildStore is httpResource()-backed and thus resolves asynchronously — this effect patches
    // the local form model whenever the signal produces a value, instead of the one-shot
    // Observable.subscribe() the pre-httpResource version used. Also re-fires (as a harmless
    // no-op) right after this component's own patchSettings() call on submit, since that writes
    // the same values the model already holds.
    effect(() => {
      const settings = this.#guildStore.settings();
      if (!settings) return;
      this.#model.update((m) => ({
        ...m,
        ...(settings.timezone ? { timezone: settings.timezone } : {}),
        ...(settings.language ? { language: settings.language } : {}),
      }));
    });

    // Auto-save mode: `dirty()` only turns true from a real interaction with a bound control,
    // never from the effect above (a programmatic model write) nor from the constructor's initial
    // browser-guessed default — so this can never silently persist a guess nobody confirmed.
    effect(() => {
      if (!this.autoSave()) return;
      // Read the values so this effect re-runs on every subsequent pick, not just the first one.
      this.settingsForm.timezone().value();
      this.settingsForm.language().value();
      if (!this.settingsForm().dirty()) return;
      // untracked: submitting() flips false the instant an auto-save completes, and reading it
      // as a tracked dependency here would re-run this effect on that very transition — calling
      // submit() again and again forever. submit() already no-ops on a concurrent in-flight call,
      // so this is a defensive check only, not the actual re-entrancy guard.
      if (untracked(() => this.submitting())) return;
      void this.submit();
    });
  }

  ngOnInit(): void {
    this.#guildStore.loadSettings(this.guildId());
  }

  /**
   * The <form> uses [formRoot] to trigger submission from a real DOM submit event (see the
   * template) — this method exists so the submission flow can also be triggered directly (used
   * by this component's own tests). Both paths run the same pre-configured submission.action.
   */
  async submit(): Promise<void> {
    await submitForm(this.settingsForm);
  }
}
