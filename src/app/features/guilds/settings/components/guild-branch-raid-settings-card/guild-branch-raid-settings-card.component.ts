import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormFieldCardComponent } from '../../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildBranch } from '../../../models/guild-branch.model';
import { SignupMode } from '../../../raids/models/signup-mode.enum';
import { GuildBranchesService } from '../../../services/guild-branches.service';

/**
 * Default raid signup mode editor for one active guild branch. Auto-saves as soon as a mode is
 * picked — the toggle's (click) handler only ever fires from a real user interaction, never from
 * the hydration off `branch()`.
 */
@Component({
  selector: 'app-guild-branch-raid-settings-card',
  imports: [FormFieldCardComponent, TranslocoPipe],
  templateUrl: './guild-branch-raid-settings-card.component.html',
  styleUrl: './guild-branch-raid-settings-card.component.scss',
})
export class GuildBranchRaidSettingsCardComponent {
  readonly guildId = input.required<string>();
  readonly branch = input.required<GuildBranch>();
  readonly saved = output<void>();

  readonly #branchesService = inject(GuildBranchesService);
  readonly #snackbar = inject(SnackbarService);

  readonly SignupMode = SignupMode;

  // linkedSignal (not signal(...) seeded in ngOnInit): the branch picker reuses this component instance
  // when switching branches, so the mode must re-derive from each new branch() input.
  readonly signupMode = linkedSignal<SignupMode>(() => this.branch().signupMode ?? SignupMode.DefaultPresent);
  readonly submitting = signal(false);

  async onSignupModeChange(mode: SignupMode): Promise<void> {
    this.signupMode.set(mode);
    if (mode === (this.branch().signupMode ?? SignupMode.DefaultPresent)) return;

    this.submitting.set(true);
    try {
      await firstValueFrom(this.#branchesService.updateSignupMode(this.guildId(), this.branch().id, mode));
      this.#snackbar.success('guildSettings.branches.raidSettings.saveSuccess');
      this.saved.emit();
    } catch {
      this.#snackbar.error('errors.server');
    } finally {
      this.submitting.set(false);
    }
  }
}
