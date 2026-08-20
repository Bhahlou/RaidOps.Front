import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GuildBranchRaidSettingsCardComponent } from './guild-branch-raid-settings-card.component';
import { GuildBranchesService } from '../../../services/guild-branches.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { GuildBranch } from '../../../models/guild-branch.model';
import { RosterMode } from '../../../models/roster-mode.enum';
import { SignupMode } from '../../../raids/models/signup-mode.enum';

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Era',
  isActive: true,
  rosterMode: RosterMode.Open,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  signupMode: null,
  ...overrides,
});

describe('GuildBranchRaidSettingsCardComponent', () => {
  let fixture: ComponentFixture<GuildBranchRaidSettingsCardComponent>;
  let component: GuildBranchRaidSettingsCardComponent;
  let branchesService: { updateSignupMode: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (branchInput: GuildBranch = branch()) => {
    branchesService = { updateSignupMode: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildBranchRaidSettingsCardComponent],
      providers: [
        { provide: GuildBranchesService, useValue: branchesService },
        { provide: SnackbarService, useValue: snackbar },
      ],
    }).overrideComponent(GuildBranchRaidSettingsCardComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildBranchRaidSettingsCardComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('branch', branchInput);
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('pre-fills signupMode from the branch input', () => {
      setup(branch({ signupMode: SignupMode.Signup }));
      fixture.detectChanges();

      expect(component.signupMode()).toBe(SignupMode.Signup);
    });

    it('defaults signupMode to DefaultPresent when the branch has none configured yet', () => {
      setup(branch({ signupMode: null }));
      fixture.detectChanges();

      expect(component.signupMode()).toBe(SignupMode.DefaultPresent);
    });
  });

  // ── onSignupModeChange ────────────────────────────────────────────────────

  describe('onSignupModeChange', () => {
    it('saves the new mode, emits saved and shows a success snackbar', async () => {
      setup(branch({ signupMode: SignupMode.DefaultPresent }));
      fixture.detectChanges();
      const savedSpy = vi.spyOn(component.saved, 'emit');

      await component.onSignupModeChange(SignupMode.Signup);

      expect(branchesService.updateSignupMode).toHaveBeenCalledWith('g1', 7, SignupMode.Signup);
      expect(component.signupMode()).toBe(SignupMode.Signup);
      expect(savedSpy).toHaveBeenCalled();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.branches.raidSettings.saveSuccess');
      expect(component.submitting()).toBe(false);
    });

    it('is a no-op when the mode is unchanged', async () => {
      setup(branch({ signupMode: SignupMode.DefaultPresent }));
      fixture.detectChanges();

      await component.onSignupModeChange(SignupMode.DefaultPresent);

      expect(branchesService.updateSignupMode).not.toHaveBeenCalled();
    });

    it('treats an unset branch signupMode as DefaultPresent for the no-op check', async () => {
      setup(branch({ signupMode: null }));
      fixture.detectChanges();

      await component.onSignupModeChange(SignupMode.DefaultPresent);

      expect(branchesService.updateSignupMode).not.toHaveBeenCalled();
    });

    it('shows an error snackbar and resets submitting on failure', async () => {
      setup(branch({ signupMode: SignupMode.DefaultPresent }));
      branchesService.updateSignupMode.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.onSignupModeChange(SignupMode.Signup);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
