import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { GuildRosterBranchesComponent } from './guild-roster-branches.component';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildBranch } from '../../../models/guild-branch.model';
import { RosterMode } from '../../../models/roster-mode.enum';
import { DiscordRole } from '../../../../../shared/models/discord-role.model';

const guildBranch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
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

describe('GuildRosterBranchesComponent', () => {
  let fixture: ComponentFixture<GuildRosterBranchesComponent>;
  let component: GuildRosterBranchesComponent;
  let store: { branches: ReturnType<typeof signal<GuildBranch[]>>; load: ReturnType<typeof vi.fn> };
  let settingsService: { getDiscordRoles: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn> };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };

  const setup = (branches: GuildBranch[] = [], roles: DiscordRole[] = []) => {
    store = { branches: signal<GuildBranch[]>(branches), load: vi.fn() };
    settingsService = { getDiscordRoles: vi.fn().mockReturnValue(of(roles)) };
    snackbar = { error: vi.fn() };
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };

    TestBed.configureTestingModule({
      imports: [GuildRosterBranchesComponent],
      providers: [
        { provide: GuildBranchesStore, useValue: store },
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: AuthStore, useValue: authStore },
      ],
    }).overrideComponent(GuildRosterBranchesComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildRosterBranchesComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads guild branches and Discord roles', () => {
      setup();
      fixture.detectChanges();

      expect(store.load).toHaveBeenCalledWith('g1');
      expect(settingsService.getDiscordRoles).toHaveBeenCalledWith('g1');
    });

    it('populates availableRoles and clears rolesLoading on success', () => {
      setup([], [{ id: 'r1', name: 'Officer', color: 0, iconHash: null }]);
      fixture.detectChanges();

      expect(component.availableRoles()).toEqual([{ id: 'r1', name: 'Officer', color: 0, iconHash: null }]);
      expect(component.rolesLoading()).toBe(false);
    });

    it('shows a snackbar error and clears rolesLoading when the role fetch fails', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(throwError(() => new Error('failed')));

      fixture.detectChanges();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.rolesLoading()).toBe(false);
    });
  });

  // ── activeBranches ────────────────────────────────────────────────────────

  describe('activeBranches', () => {
    it('only includes active guild branches', () => {
      const active = guildBranch({ isActive: true });
      setup([active, guildBranch({ id: 8, isActive: false })]);
      fixture.detectChanges();

      expect(component.activeBranches()).toEqual([active]);
    });
  });

  // ── onSettingsSaved ───────────────────────────────────────────────────────

  describe('onSettingsSaved', () => {
    it('resyncs AuthStore after a roster/officer save', () => {
      setup();
      fixture.detectChanges();

      component.onSettingsSaved();

      expect(authStore.loadUser).toHaveBeenCalled();
    });
  });
});
