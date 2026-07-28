import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildBranchesComponent } from './guild-branches.component';
import { GuildBranchesService } from '../../services/guild-branches.service';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { GuildSettingsService } from '../../services/guild-settings.service';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { GuildBranch } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { Branch } from '../../../../shared/models/branch.model';
import { DiscordRole } from '../../../../shared/models/discord-role.model';

const wowBranch = (overrides?: Partial<Branch>): Branch => ({
  id: 3,
  name: 'Classic Era',
  bnetNamespacePrefix: 'dynamic-classic1x',
  currentExpansionShortCode: 'Classic',
  ...overrides,
});

const guildBranch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Era',
  isActive: true,
  rosterMode: RosterMode.Open,
  rosterRoleIds: [],
  officerRoleIds: [],
  ...overrides,
});

describe('GuildBranchesComponent', () => {
  let fixture: ComponentFixture<GuildBranchesComponent>;
  let component: GuildBranchesComponent;
  let branchesService: { activateBranch: ReturnType<typeof vi.fn>; deactivateBranch: ReturnType<typeof vi.fn> };
  let store: { branches: ReturnType<typeof signal<GuildBranch[]>>; isLoading: ReturnType<typeof signal<boolean>>; load: ReturnType<typeof vi.fn>; reload: ReturnType<typeof vi.fn> };
  let settingsService: { getDiscordRoles: ReturnType<typeof vi.fn> };
  let wowBranchService: { getAll: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let authStore: { loadUser: ReturnType<typeof vi.fn> };

  const setup = (branches: GuildBranch[] = [], wowBranches: Branch[] = [wowBranch()], roles: DiscordRole[] = []) => {
    branchesService = {
      activateBranch: vi.fn().mockReturnValue(of(undefined)),
      deactivateBranch: vi.fn().mockReturnValue(of(undefined)),
    };
    store = {
      branches: signal<GuildBranch[]>(branches),
      isLoading: signal(false),
      load: vi.fn(),
      reload: vi.fn(),
    };
    settingsService = { getDiscordRoles: vi.fn().mockReturnValue(of(roles)) };
    wowBranchService = { getAll: vi.fn().mockReturnValue(of(wowBranches)) };
    snackbar = { error: vi.fn(), success: vi.fn() };
    authStore = { loadUser: vi.fn().mockReturnValue(of(undefined)) };

    TestBed.configureTestingModule({
      imports: [GuildBranchesComponent],
      providers: [
        { provide: GuildBranchesService, useValue: branchesService },
        { provide: GuildBranchesStore, useValue: store },
        { provide: GuildSettingsService, useValue: settingsService },
        { provide: WowBrancheService, useValue: wowBranchService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: AuthStore, useValue: authStore },
        { provide: TranslocoService, useValue: { translate: vi.fn((key: string) => key) } },
      ],
    }).overrideComponent(GuildBranchesComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildBranchesComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads guild branches, WoW branches and Discord roles', () => {
      setup();
      fixture.detectChanges();

      expect(store.load).toHaveBeenCalledWith('g1');
      expect(wowBranchService.getAll).toHaveBeenCalled();
      expect(settingsService.getDiscordRoles).toHaveBeenCalledWith('g1');
    });

    it('populates wowBranches from the service', () => {
      setup([], [wowBranch({ id: 5, name: 'MoP Classic' })]);
      fixture.detectChanges();

      expect(component.wowBranches()).toEqual([wowBranch({ id: 5, name: 'MoP Classic' })]);
    });

    it('shows a snackbar error and clears loading when the role fetch fails', () => {
      setup();
      settingsService.getDiscordRoles.mockReturnValue(throwError(() => new Error('failed')));

      fixture.detectChanges();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.rolesLoading()).toBe(false);
    });
  });

  // ── branchOptions ─────────────────────────────────────────────────────────

  describe('branchOptions', () => {
    it('labels each WoW branch with its expansion short code', () => {
      setup([], [wowBranch({ id: 3, name: 'Classic Era', currentExpansionShortCode: 'Classic' })]);
      fixture.detectChanges();

      expect(component.branchOptions()).toEqual([{ value: 3, label: 'Classic Era (Classic)' }]);
    });
  });

  // ── activeBranchIds / activeBranches ──────────────────────────────────────

  describe('activeBranchIds', () => {
    it('only includes active guild branches', () => {
      setup([guildBranch({ branchId: 3, isActive: true }), guildBranch({ id: 8, branchId: 5, isActive: false })]);
      fixture.detectChanges();

      expect(component.activeBranchIds()).toEqual([3]);
    });
  });

  describe('activeBranches', () => {
    it('only includes active guild branches', () => {
      const active = guildBranch({ branchId: 3, isActive: true });
      setup([active, guildBranch({ id: 8, branchId: 5, isActive: false })]);
      fixture.detectChanges();

      expect(component.activeBranches()).toEqual([active]);
    });
  });

  // ── branchesPlaceholder ───────────────────────────────────────────────────

  describe('branchesPlaceholder', () => {
    it('shows the loading key while the store is loading', () => {
      setup();
      store.isLoading.set(true);
      fixture.detectChanges();

      expect(component.branchesPlaceholder()).toBe('guildSettings.branches.activation.loading');
    });

    it('shows the placeholder key once the store has loaded', () => {
      setup();
      store.isLoading.set(false);
      fixture.detectChanges();

      expect(component.branchesPlaceholder()).toBe('guildSettings.branches.activation.placeholder');
    });
  });

  // ── onBranchSelectionChange ───────────────────────────────────────────────

  describe('onBranchSelectionChange', () => {
    it('activates newly selected branches and reloads the store', async () => {
      setup([]);
      fixture.detectChanges();

      await component.onBranchSelectionChange([3]);

      expect(branchesService.activateBranch).toHaveBeenCalledWith('g1', 3);
      expect(store.reload).toHaveBeenCalled();
    });

    it('deactivates deselected branches by their guild-branch id and reloads the store', async () => {
      setup([guildBranch({ id: 7, branchId: 3, isActive: true })]);
      fixture.detectChanges();

      await component.onBranchSelectionChange([]);

      expect(branchesService.deactivateBranch).toHaveBeenCalledWith('g1', 7);
      expect(store.reload).toHaveBeenCalled();
    });

    it('does nothing for a branch id that is neither added nor removed', async () => {
      setup([guildBranch({ id: 7, branchId: 3, isActive: true })]);
      fixture.detectChanges();

      await component.onBranchSelectionChange([3]);

      expect(branchesService.activateBranch).not.toHaveBeenCalled();
      expect(branchesService.deactivateBranch).not.toHaveBeenCalled();
    });

    it('shows a snackbar error when activation fails', async () => {
      setup([]);
      branchesService.activateBranch.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.onBranchSelectionChange([3]);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('shows a snackbar error when deactivation fails', async () => {
      setup([guildBranch({ id: 7, branchId: 3, isActive: true })]);
      branchesService.deactivateBranch.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.onBranchSelectionChange([]);

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
    });

    it('is a no-op if the branch is no longer in the store by the time deactivation runs', async () => {
      const branch = guildBranch({ id: 7, branchId: 3, isActive: true });
      setup([branch]);
      fixture.detectChanges();

      // Simulates the store's branches signal changing between computing which branches to
      // deactivate and #deactivate looking the branch back up by id (e.g. a concurrent reload,
      // or another tab deactivating it first) — the guard should no-op rather than call the API
      // with a stale guild-branch id.
      (component as unknown as { guildBranches: () => GuildBranch[] }).guildBranches = vi.fn().mockReturnValueOnce([branch]).mockReturnValue([]);

      await component.onBranchSelectionChange([]);

      expect(branchesService.deactivateBranch).not.toHaveBeenCalled();
      expect(store.reload).not.toHaveBeenCalled();
    });
  });
});
