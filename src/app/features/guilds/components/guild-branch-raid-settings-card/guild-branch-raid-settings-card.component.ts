import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormFieldCardComponent } from '../../../../shared/components/form/form-field-card/form-field-card.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildBranch } from '../../models/guild-branch.model';
import { SignupMode } from '../../models/signup-mode.enum';
import { GuildBranchesService } from '../../services/guild-branches.service';

/**
 * Default raid signup mode editor for one active guild branch. Auto-saves as soon as a mode is
 * picked — the toggle's (click) handler only ever fires from a real user interaction, never from
 * `ngOnInit`'s initial hydration off `branch()`.
 */
@Component({
  selector: 'app-guild-branch-raid-settings-card',
  imports: [FormFieldCardComponent, TranslocoPipe],
  templateUrl: './guild-branch-raid-settings-card.component.html',
  styleUrl: './guild-branch-raid-settings-card.component.scss',
})
export class GuildBranchRaidSettingsCardComponent implements OnInit {
  readonly guildId = input.required<string>();
  readonly branch = input.required<GuildBranch>();
  readonly saved = output<void>();

  readonly #branchesService = inject(GuildBranchesService);
  readonly #snackbar = inject(SnackbarService);

  readonly SignupMode = SignupMode;

  readonly signupMode = signal<SignupMode>(SignupMode.DefaultPresent);
  readonly submitting = signal(false);

  ngOnInit(): void {
    this.signupMode.set(this.branch().signupMode ?? SignupMode.DefaultPresent);
  }

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
