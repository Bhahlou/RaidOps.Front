import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildBranchSettingsCardComponent } from './guild-branch-settings-card.component';
import { GuildBranchesService } from '../../services/guild-branches.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildBranch } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';
import { DiscordRole } from '../../../../shared/models/discord-role.model';

const role = (id: string, color = 0, iconHash: string | null = null): DiscordRole =>
  ({ id, name: `Role ${id}`, color, iconHash });

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Era',
  isActive: true,
  rosterMode: RosterMode.Open,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  ...overrides,
});

describe('GuildBranchSettingsCardComponent', () => {
  let fixture: ComponentFixture<GuildBranchSettingsCardComponent>;
  let component: GuildBranchSettingsCardComponent;
  let branchesService: { updateRosterSettings: ReturnType<typeof vi.fn>; updateRegion: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (branchInput: GuildBranch = branch(), roles: DiscordRole[] = [], rolesLoading = false) => {
    branchesService = { updateRosterSettings: vi.fn().mockReturnValue(of(undefined)), updateRegion: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildBranchSettingsCardComponent],
      providers: [
        { provide: GuildBranchesService, useValue: branchesService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { translate: vi.fn((key: string) => key) } },
      ],
    }).overrideComponent(GuildBranchSettingsCardComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildBranchSettingsCardComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('branch', branchInput);
    fixture.componentRef.setInput('roles', roles);
    fixture.componentRef.setInput('rolesLoading', rolesLoading);
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('pre-fills roster/officer role state from the branch input', () => {
      setup(branch({ rosterMode: RosterMode.DiscordRoleOnly, rosterRoleIds: ['r1'], officerRoleIds: ['r2'] }));
      fixture.detectChanges();

      expect(component.rosterMode()).toBe(RosterMode.DiscordRoleOnly);
      expect(component.rosterRoleIds()).toEqual(['r1']);
      expect(component.officerRoleIds()).toEqual(['r2']);
    });

    it('defaults rosterMode to Open when the branch has none configured yet', () => {
      setup(branch({ rosterMode: null }));
      fixture.detectChanges();

      expect(component.rosterMode()).toBe(RosterMode.Open);
    });
  });

  // ── isDiscordRoleMode / canSave ──────────────────────────────────────────

  describe('isDiscordRoleMode', () => {
    it('is false when rosterMode is Open', () => {
      setup();
      fixture.detectChanges();

      expect(component.isDiscordRoleMode()).toBe(false);
    });

    it('is true when rosterMode is DiscordRoleOnly', () => {
      setup();
      fixture.detectChanges();
      component.rosterMode.set(RosterMode.DiscordRoleOnly);

      expect(component.isDiscordRoleMode()).toBe(true);
    });
  });

  describe('canSave', () => {
    it('is true in Open mode regardless of rosterRoleIds', () => {
      setup();
      fixture.detectChanges();

      expect(component.canSave()).toBe(true);
    });

    it('is false in DiscordRoleOnly mode with no roster roles selected', () => {
      setup();
      fixture.detectChanges();
      component.rosterMode.set(RosterMode.DiscordRoleOnly);

      expect(component.canSave()).toBe(false);
    });

    it('is true in DiscordRoleOnly mode with at least one roster role selected', () => {
      setup();
      fixture.detectChanges();
      component.rosterMode.set(RosterMode.DiscordRoleOnly);
      component.rosterRoleIds.set(['r1']);

      expect(component.canSave()).toBe(true);
    });
  });

  // ── regionOptions ─────────────────────────────────────────────────────────

  describe('regionOptions', () => {
    it('lists every region with a translated label', () => {
      setup();
      fixture.detectChanges();

      expect(component.regionOptions()).toEqual([
        { value: 'eu', label: 'guildSettings.branches.region.options.eu' },
        { value: 'us', label: 'guildSettings.branches.region.options.us' },
        { value: 'kr', label: 'guildSettings.branches.region.options.kr' },
        { value: 'tw', label: 'guildSettings.branches.region.options.tw' },
      ]);
    });
  });

  // ── roleOptions ───────────────────────────────────────────────────────────

  describe('roleOptions', () => {
    it('maps roles to color-carrying options when colored', () => {
      setup(branch(), [role('r1', 0xff0000)]);
      fixture.detectChanges();

      expect(component.roleOptions()).toEqual([
        { value: 'r1', label: 'Role r1', color: '#ff0000', iconUrl: null },
      ]);
    });

    it('builds a role-icon URL when the role has a custom icon', () => {
      setup(branch(), [role('r1', 0, 'icon-hash')]);
      fixture.detectChanges();

      expect(component.roleOptions()[0].iconUrl).toBe('https://cdn.discordapp.com/role-icons/r1/icon-hash.webp?size=32');
    });

    it('has no color for an uncolored role with no icon', () => {
      setup(branch(), [role('r1')]);
      fixture.detectChanges();

      expect(component.roleOptions()[0]).toEqual({ value: 'r1', label: 'Role r1', color: null, iconUrl: null });
    });
  });

  // ── rolesPlaceholder ──────────────────────────────────────────────────────

  describe('rolesPlaceholder', () => {
    it('shows the loading key while roles are loading', () => {
      setup(branch(), [], true);
      fixture.detectChanges();

      expect(component.rolesPlaceholder()).toBe('guildSettings.roles.loading');
    });

    it('shows the placeholder key once roles have loaded', () => {
      setup(branch(), [], false);
      fixture.detectChanges();

      expect(component.rolesPlaceholder()).toBe('guildSettings.roles.placeholder');
    });
  });

  // ── onRosterModeChange ────────────────────────────────────────────────────

  describe('onRosterModeChange', () => {
    it('updates rosterMode', () => {
      setup();
      fixture.detectChanges();

      component.onRosterModeChange(RosterMode.DiscordRoleOnly);

      expect(component.rosterMode()).toBe(RosterMode.DiscordRoleOnly);
    });
  });

  // ── save ──────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('does nothing when canSave is false', async () => {
      setup();
      fixture.detectChanges();
      component.rosterMode.set(RosterMode.DiscordRoleOnly);

      await component.save();

      expect(branchesService.updateRosterSettings).not.toHaveBeenCalled();
    });

    it('clears rosterRoleIds in the payload when rosterMode is Open', async () => {
      setup();
      fixture.detectChanges();
      component.rosterRoleIds.set(['stale-role']);

      await component.save();

      expect(branchesService.updateRosterSettings).toHaveBeenCalledWith('g1', 7, {
        rosterMode: RosterMode.Open,
        rosterRoleIds: [],
        officerRoleIds: [],
      });
    });

    it('sends rosterRoleIds when rosterMode is DiscordRoleOnly', async () => {
      setup();
      fixture.detectChanges();
      component.rosterMode.set(RosterMode.DiscordRoleOnly);
      component.rosterRoleIds.set(['r1']);
      component.officerRoleIds.set(['r2']);

      await component.save();

      expect(branchesService.updateRosterSettings).toHaveBeenCalledWith('g1', 7, {
        rosterMode: RosterMode.DiscordRoleOnly,
        rosterRoleIds: ['r1'],
        officerRoleIds: ['r2'],
      });
    });

    it('also updates the region when it was changed from the branch value', async () => {
      setup(branch({ region: 'eu' }));
      fixture.detectChanges();
      component.region.set('us');

      await component.save();

      expect(branchesService.updateRegion).toHaveBeenCalledWith('g1', 7, 'us');
    });

    it('does not update the region when it is unchanged from the branch value', async () => {
      setup(branch({ region: 'eu' }));
      fixture.detectChanges();

      await component.save();

      expect(branchesService.updateRegion).not.toHaveBeenCalled();
    });

    it('does not update the region while it is still unset', async () => {
      setup(branch({ region: null }));
      fixture.detectChanges();

      await component.save();

      expect(branchesService.updateRegion).not.toHaveBeenCalled();
    });

    it('shows an error snackbar when the region update fails', async () => {
      setup(branch({ region: 'eu' }));
      branchesService.updateRegion.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();
      component.region.set('us');

      await component.save();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });

    it('shows a success snackbar and emits saved on success', async () => {
      setup();
      fixture.detectChanges();
      const savedSpy = vi.spyOn(component.saved, 'emit');

      await component.save();

      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.branches.rosterSettings.saveSuccess');
      expect(savedSpy).toHaveBeenCalled();
      expect(component.submitting()).toBe(false);
    });

    it('shows an error snackbar and resets submitting on failure', async () => {
      setup();
      branchesService.updateRosterSettings.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.save();

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
