import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BranchTabsComponent } from './branch-tabs.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { WowBrancheService } from '../../../../shared/services/wow-branche.service';
import { UserGuildBranch } from '../../../../core/models/user-guild-branch.model';
import { UserGuild } from '../../../../core/models/user-guild.model';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';
import { Branch } from '../../../../shared/models/branch.model';

const branch = (overrides: Partial<UserGuildBranch> = {}): UserGuildBranch => ({
  id: 7,
  branchId: 3,
  branchName: 'Classic Anniversary',
  accessLevel: GuildAccessLevel.Roster,
  hasActiveCharacter: true,
  ...overrides,
});

const guild = (branches: UserGuildBranch[]): UserGuild => ({
  id: 'g1',
  name: 'Guild',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  branches,
  accessLevel: GuildAccessLevel.Roster,
});

const wowBranch = (overrides: Partial<Branch> = {}): Branch => ({
  id: 3,
  name: 'Classic Anniversary',
  bnetNamespacePrefix: 'classic1x',
  currentExpansionShortCode: 'TBC',
  ...overrides,
});

describe('BranchTabsComponent', () => {
  let fixture: ComponentFixture<BranchTabsComponent>;
  let component: BranchTabsComponent;
  let authStore: { user: ReturnType<typeof signal<UserGuild | null>> };
  let wowBrancheService: { getAll: ReturnType<typeof vi.fn> };

  const setup = (
    branches: UserGuildBranch[],
    leaf: 'dashboard' | 'roster' | 'loot' = 'roster',
    wowBranches: Branch[] = [wowBranch()],
  ) => {
    const user = { discordId: '1', name: 'Viewer', avatarHash: null, guilds: [guild(branches)], notifications: [] };
    authStore = { user: signal(user as never) };
    wowBrancheService = { getAll: vi.fn().mockReturnValue(of(wowBranches)) };

    TestBed.configureTestingModule({
      imports: [BranchTabsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
        { provide: WowBrancheService, useValue: wowBrancheService },
      ],
    });

    fixture = TestBed.createComponent(BranchTabsComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    fixture.componentRef.setInput('leaf', leaf);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  it('should create', () => {
    expect(setup([branch()])).toBeTruthy();
  });

  describe('branches', () => {
    it('is empty when the guild is not found for this user', () => {
      const c = setup([branch()]);
      fixture.componentRef.setInput('guildId', 'other-guild');
      fixture.detectChanges();

      expect(c.branches()).toEqual([]);
    });

    it('includes branches meeting the required level for the leaf', () => {
      const c = setup([branch({ id: 1, accessLevel: GuildAccessLevel.Roster })], 'roster');

      expect(c.branches().map((b) => b.id)).toEqual([1]);
    });

    it('excludes branches below the required level for the leaf', () => {
      const c = setup(
        [
          branch({ id: 1, accessLevel: GuildAccessLevel.Roster }),
          branch({ id: 2, accessLevel: GuildAccessLevel.Public }),
        ],
        'roster',
      );

      expect(c.branches().map((b) => b.id)).toEqual([1]);
    });

    it('includes every branch for the dashboard leaf, which only requires Public', () => {
      const c = setup(
        [
          branch({ id: 1, accessLevel: GuildAccessLevel.Roster }),
          branch({ id: 2, accessLevel: GuildAccessLevel.Public }),
        ],
        'dashboard',
      );

      expect(c.branches().map((b) => b.id)).toEqual([1, 2]);
    });
  });

  describe('rendering', () => {
    it('renders no tabs when only one branch is accessible', () => {
      setup([branch()]);

      expect(fixture.nativeElement.querySelectorAll('.tab').length).toBe(0);
    });

    it('renders one tab per accessible branch when there is more than one', () => {
      setup([branch({ id: 1, branchName: 'Classic Anniversary' }), branch({ id: 2, branchName: 'Classic' })]);

      const tabs = fixture.nativeElement.querySelectorAll('.tab');
      expect(tabs.length).toBe(2);
      expect(tabs[0].textContent).toContain('Classic Anniversary');
      expect(tabs[1].textContent).toContain('Classic');
    });
  });

  describe('iconUrl', () => {
    it('resolves the WoWpedia icon for a branch\'s current expansion short code', () => {
      const c = setup([branch({ id: 1, branchId: 3 })], 'roster', [wowBranch({ id: 3, currentExpansionShortCode: 'TBC' })]);

      expect(c.iconUrl(branch({ id: 1, branchId: 3 }))).toContain('Bc_icon.gif');
    });

    it('returns null when the branch\'s short code has no mapped icon', () => {
      const c = setup([branch({ id: 1, branchId: 3 })], 'roster', [wowBranch({ id: 3, currentExpansionShortCode: 'Unknown' })]);

      expect(c.iconUrl(branch({ id: 1, branchId: 3 }))).toBeNull();
    });

    it('returns null when the branch is not found in the WoW branch catalog', () => {
      const c = setup([branch({ id: 1, branchId: 3 })], 'roster', []);

      expect(c.iconUrl(branch({ id: 1, branchId: 3 }))).toBeNull();
    });

    it('returns null after onIconError marks the short code as failed', () => {
      const c = setup([branch({ id: 1, branchId: 3 })], 'roster', [wowBranch({ id: 3, currentExpansionShortCode: 'TBC' })]);
      const b = branch({ id: 1, branchId: 3 });
      expect(c.iconUrl(b)).not.toBeNull();

      c.onIconError(b);

      expect(c.iconUrl(b)).toBeNull();
    });
  });

  describe('onIconError', () => {
    it('does nothing when the branch has no resolvable short code', () => {
      const c = setup([branch({ id: 1, branchId: 3 })], 'roster', []);
      const b = branch({ id: 1, branchId: 3 });

      expect(() => c.onIconError(b)).not.toThrow();
    });
  });
});
