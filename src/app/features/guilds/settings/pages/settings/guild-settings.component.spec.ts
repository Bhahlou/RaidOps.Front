import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { GuildSettingsComponent } from './guild-settings.component';
import { AuthStore } from '../../../../../core/stores/auth.store';
import { GuildBranchesStore } from '../../../stores/guild-branches.store';
import { WowBrancheService } from '../../../../../shared/services/wow-branche.service';
import { GuildBranch } from '../../../models/guild-branch.model';
import { Branch } from '../../../../../shared/models/branch.model';

const setup = (guildId: string | null, tab: string | null = null, router: { navigate: ReturnType<typeof vi.fn> } = { navigate: vi.fn() }) => {
  const route = {
    paramMap: of(convertToParamMap(tab ? { tab } : {})),
    parent: {
      snapshot: { paramMap: { get: () => guildId } },
      paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
    },
  };

  TestBed.configureTestingModule({
    imports: [GuildSettingsComponent],
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      { provide: AuthStore, useValue: { user: signal(null) } },
    ],
  }).overrideComponent(GuildSettingsComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildSettingsComponent).componentInstance;
};

const guildBranch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 1,
  branchId: 4,
  branchName: 'Classic Anniversary',
  isActive: true,
  rosterMode: null,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  signupMode: null,
  ...overrides,
});

const wowBranch = (overrides?: Partial<Branch>): Branch => ({
  id: 4,
  name: 'Classic Anniversary',
  bnetNamespacePrefix: 'dynamic-classicann',
  currentExpansionShortCode: 'TBC',
  isActive: true,
  syncAvailable: true,
  ...overrides,
});

// Real GuildBranchesStore/WowBrancheService go through HttpClient — mocked here (rather than
// relying on the bare `setup()` helper's trick of never reading the resource-backed signals) so
// `selectedBranchExpansionId` can be exercised deterministically without a real HTTP round trip.
const setupWithReferenceData = (branches: GuildBranch[] | WritableSignal<GuildBranch[]>, wowBranches: Branch[]) => {
  TestBed.configureTestingModule({
    imports: [GuildSettingsComponent],
    providers: [
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})), parent: { snapshot: { paramMap: { get: () => 'g1' } }, paramMap: of(convertToParamMap({ id: 'g1' })) } } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: AuthStore, useValue: { user: signal(null) } },
      { provide: GuildBranchesStore, useValue: { branches: Array.isArray(branches) ? signal(branches) : branches, load: vi.fn() } },
      { provide: WowBrancheService, useValue: { getAll: () => of(wowBranches) } },
    ],
  }).overrideComponent(GuildSettingsComponent, { set: { template: '', imports: [] } });

  return TestBed.createComponent(GuildSettingsComponent).componentInstance;
};

describe('GuildSettingsComponent', () => {
  it('should create', () => {
    expect(setup('g1')).toBeTruthy();
  });

  it('extracts guildId from the parent route', () => {
    expect(setup('guild-42').guildId).toBe('guild-42');
  });

  it('sets i18nKey to sidenav.guild.settings on the last breadcrumb', () => {
    expect(setup('g1').breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.settings');
  });

  // ── activeTab ───────────────────────────────────────────────────────────

  describe('activeTab', () => {
    it('defaults to general when the route has no tab segment', () => {
      expect(setup('g1').activeTab()).toBe('general');
    });

    it('reads notifications from the route segment', () => {
      expect(setup('g1', 'notifications').activeTab()).toBe('notifications');
    });

    it('reads roster from the route segment', () => {
      expect(setup('g1', 'roster').activeTab()).toBe('roster');
    });

    it('reads raids from the route segment', () => {
      expect(setup('g1', 'raids').activeTab()).toBe('raids');
    });

    it('falls back to general for an unknown tab segment', () => {
      expect(setup('g1', 'bogus').activeTab()).toBe('general');
    });
  });

  // ── onTabChange ─────────────────────────────────────────────────────────

  describe('onTabChange', () => {
    it('navigates to the sibling tab route', () => {
      const router = { navigate: vi.fn() };
      const component = setup('g1', 'general', router);

      component.onTabChange('notifications');

      expect(router.navigate).toHaveBeenCalledWith(['..', 'notifications'], { relativeTo: expect.anything() });
    });
  });

  // ── activeBranches / selectedBranch ────────────────────────────────────────

  describe('selectedBranch', () => {
    it('defaults to the first active branch', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5 })],
        [wowBranch()],
      );

      expect(component.selectedBranch()?.id).toBe(1);
    });

    it('ignores inactive branches', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1, isActive: false }), guildBranch({ id: 2, branchId: 5 })],
        [wowBranch()],
      );

      expect(component.activeBranches().map(b => b.id)).toEqual([2]);
      expect(component.selectedBranch()?.id).toBe(2);
    });

    it('follows the user pick', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5 })],
        [wowBranch()],
      );

      component.onBranchChange('2');

      expect(component.selectedBranch()?.id).toBe(2);
    });

    it('does not select an inactive branch even when picked', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5, isActive: false })],
        [wowBranch()],
      );

      component.onBranchChange('2');

      expect(component.selectedBranch()?.id).toBe(1);
    });

    it('falls back to the first active branch when the picked one is no longer active', () => {
      const branches = signal([guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5 })]);
      const component = setupWithReferenceData(branches, [wowBranch()]);
      component.onBranchChange('2');
      expect(component.selectedBranch()?.id).toBe(2);

      branches.set([guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5, isActive: false })]);

      expect(component.selectedBranch()?.id).toBe(1);
    });

    it('falls back to the first active branch when the pick is cleared', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1 }), guildBranch({ id: 2, branchId: 5 })],
        [wowBranch()],
      );
      component.onBranchChange('2');

      component.onBranchChange(null);

      expect(component.selectedBranch()?.id).toBe(1);
    });

    it('is null when no branch is active', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: false })], [wowBranch()]);

      expect(component.selectedBranch()).toBeNull();
    });

    it('is null when there are no branches at all', () => {
      const component = setupWithReferenceData([], []);

      expect(component.selectedBranch()).toBeNull();
    });
  });

  // ── branchOptions ──────────────────────────────────────────────────────────

  describe('branchOptions', () => {
    it('maps each active branch to a select option with its id, name and expansion icon', () => {
      const component = setupWithReferenceData(
        [
          guildBranch({ id: 1, branchId: 4, branchName: 'Classic Anniversary' }),
          guildBranch({ id: 2, branchId: 5, branchName: 'Classic Era', isActive: false }),
          guildBranch({ id: 3, branchId: 6, branchName: 'Retail' }),
        ],
        [
          wowBranch({ id: 4, currentExpansionShortCode: 'TBC' }),
          wowBranch({ id: 5, currentExpansionShortCode: 'Classic' }),
          wowBranch({ id: 6, currentExpansionShortCode: 'TWW' }),
        ],
      );

      expect(component.branchOptions()).toEqual([
        { value: '1', label: 'Classic Anniversary', iconUrl: '/assets/images/expansion-icons/TBC.png' },
        { value: '3', label: 'Retail', iconUrl: '/assets/images/expansion-icons/TWW.png' },
      ]);
    });

    it('has a null icon when the branch has no matching WoW branch', () => {
      const component = setupWithReferenceData([guildBranch({ id: 1, branchId: 999 })], [wowBranch({ id: 4 })]);

      expect(component.branchOptions()[0].iconUrl).toBeNull();
    });

    it('is empty when there are no active branches', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: false })], [wowBranch()]);

      expect(component.branchOptions()).toEqual([]);
    });
  });

  // ── selectedBranchExpansionId ──────────────────────────────────────────────

  describe('selectedBranchExpansionId', () => {
    it('resolves the selected branch expansion id via its WoW branch short code', () => {
      const component = setupWithReferenceData(
        [guildBranch({ id: 1, isActive: true, branchId: 4 }), guildBranch({ id: 2, isActive: true, branchId: 5 })],
        [wowBranch({ id: 4, currentExpansionShortCode: 'TBC' }), wowBranch({ id: 5, currentExpansionShortCode: 'Classic' })],
      );

      expect(component.selectedBranchExpansionId()).toBe(2);

      component.onBranchChange('2');

      expect(component.selectedBranch()?.id).toBe(2);
      expect(component.selectedBranchExpansionId()).toBe(1);
    });

    it('is null when no guild branch is active', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: false })], [wowBranch()]);

      expect(component.selectedBranchExpansionId()).toBeNull();
    });

    it('is null when the selected branch has no matching WoW branch', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: true, branchId: 999 })], [wowBranch({ id: 4 })]);

      expect(component.selectedBranchExpansionId()).toBeNull();
    });

    it('is null when there are no guild branches at all', () => {
      const component = setupWithReferenceData([], []);

      expect(component.selectedBranchExpansionId()).toBeNull();
    });
  });
});
