import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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
  ...overrides,
});

// Real GuildBranchesStore/WowBrancheService go through HttpClient — mocked here (rather than
// relying on the bare `setup()` helper's trick of never reading the resource-backed signals) so
// `attributionExpansionId` can be exercised deterministically without a real HTTP round trip.
const setupWithReferenceData = (branches: GuildBranch[], wowBranches: Branch[]) => {
  TestBed.configureTestingModule({
    imports: [GuildSettingsComponent],
    providers: [
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})), parent: { snapshot: { paramMap: { get: () => 'g1' } }, paramMap: of(convertToParamMap({ id: 'g1' })) } } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: AuthStore, useValue: { user: signal(null) } },
      { provide: GuildBranchesStore, useValue: { branches: signal(branches), load: vi.fn() } },
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

  // ── attributionExpansionId ──────────────────────────────────────────────

  describe('attributionExpansionId', () => {
    it('resolves the active branch expansion id via its WoW branch short code', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: true, branchId: 4 })], [wowBranch({ id: 4, currentExpansionShortCode: 'TBC' })]);

      expect(component.attributionExpansionId()).toBe(2);
    });

    it('is null when no guild branch is active', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: false })], [wowBranch()]);

      expect(component.attributionExpansionId()).toBeNull();
    });

    it('is null when the active branch has no matching WoW branch', () => {
      const component = setupWithReferenceData([guildBranch({ isActive: true, branchId: 999 })], [wowBranch({ id: 4 })]);

      expect(component.attributionExpansionId()).toBeNull();
    });

    it('is null when there are no guild branches at all', () => {
      const component = setupWithReferenceData([], []);

      expect(component.attributionExpansionId()).toBeNull();
    });
  });
});
