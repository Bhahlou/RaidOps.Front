import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { GuildRaidBranchesComponent } from './guild-raid-branches.component';
import { GuildBranchesStore } from '../../stores/guild-branches.store';
import { GuildBranch } from '../../models/guild-branch.model';
import { RosterMode } from '../../models/roster-mode.enum';

const guildBranch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
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

describe('GuildRaidBranchesComponent', () => {
  let fixture: ComponentFixture<GuildRaidBranchesComponent>;
  let component: GuildRaidBranchesComponent;
  let store: { branches: ReturnType<typeof signal<GuildBranch[]>>; load: ReturnType<typeof vi.fn> };

  const setup = (branches: GuildBranch[] = []) => {
    store = { branches: signal<GuildBranch[]>(branches), load: vi.fn() };

    TestBed.configureTestingModule({
      imports: [GuildRaidBranchesComponent],
      providers: [{ provide: GuildBranchesStore, useValue: store }],
    }).overrideComponent(GuildRaidBranchesComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildRaidBranchesComponent);
    fixture.componentRef.setInput('guildId', 'g1');
    component = fixture.componentInstance;
    return component;
  };

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('loads guild branches', () => {
      setup();
      fixture.detectChanges();

      expect(store.load).toHaveBeenCalledWith('g1');
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
});
