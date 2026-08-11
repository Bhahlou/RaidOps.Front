import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildBranchRegionCardComponent } from './guild-branch-region-card.component';
import { GuildBranchesService } from '../../services/guild-branches.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildBranch } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';

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

describe('GuildBranchRegionCardComponent', () => {
  let fixture: ComponentFixture<GuildBranchRegionCardComponent>;
  let component: GuildBranchRegionCardComponent;
  let branchesService: { updateRegion: ReturnType<typeof vi.fn> };
  let snackbar: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  const setup = (branchInput: GuildBranch = branch()) => {
    branchesService = { updateRegion: vi.fn().mockReturnValue(of(undefined)) };
    snackbar = { error: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildBranchRegionCardComponent],
      providers: [
        { provide: GuildBranchesService, useValue: branchesService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TranslocoService, useValue: { translate: vi.fn((key: string) => key) } },
      ],
    }).overrideComponent(GuildBranchRegionCardComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildBranchRegionCardComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('branch', branchInput);
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('pre-fills region from the branch input', () => {
      setup(branch({ region: 'eu' }));
      fixture.detectChanges();

      expect(component.region()).toBe('eu');
    });

    it('leaves region null when the branch has none configured yet', () => {
      setup(branch({ region: null }));
      fixture.detectChanges();

      expect(component.region()).toBeNull();
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

  // ── onRegionChange ────────────────────────────────────────────────────────

  describe('onRegionChange', () => {
    it('saves the new region, emits saved and shows a success snackbar', async () => {
      setup(branch({ region: null }));
      fixture.detectChanges();
      const savedSpy = vi.spyOn(component.saved, 'emit');

      await component.onRegionChange('eu');

      expect(branchesService.updateRegion).toHaveBeenCalledWith('g1', 7, 'eu');
      expect(component.region()).toBe('eu');
      expect(savedSpy).toHaveBeenCalled();
      expect(snackbar.success).toHaveBeenCalledWith('guildSettings.branches.regionSettings.saveSuccess');
      expect(component.submitting()).toBe(false);
    });

    it('is a no-op when the region is unchanged', async () => {
      setup(branch({ region: 'eu' }));
      fixture.detectChanges();

      await component.onRegionChange('eu');

      expect(branchesService.updateRegion).not.toHaveBeenCalled();
    });

    it('shows an error snackbar and resets submitting on failure', async () => {
      setup(branch({ region: null }));
      branchesService.updateRegion.mockReturnValue(throwError(() => new Error('failed')));
      fixture.detectChanges();

      await component.onRegionChange('eu');

      expect(snackbar.error).toHaveBeenCalledWith('errors.server');
      expect(component.submitting()).toBe(false);
    });
  });
});
