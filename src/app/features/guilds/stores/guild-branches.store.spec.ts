import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GuildBranch } from '../models/guild-branch.model';
import { RosterMode } from '../models/roster-mode.enum';
import { GuildBranchesStore } from './guild-branches.store';

const branch = (overrides?: Partial<GuildBranch>): GuildBranch => ({
  id: 1,
  branchId: 3,
  branchName: 'Classic Era',
  isActive: true,
  rosterMode: RosterMode.Open,
  rosterRoleIds: [],
  officerRoleIds: [],
  region: null,
  ...overrides,
});

describe('GuildBranchesStore', () => {
  let store: GuildBranchesStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildBranchesStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GuildBranchesStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── branches / isLoading ─────────────────────────────────────────────────

  describe('branches', () => {
    it('is empty before any guild is set', () => {
      TestBed.tick();
      expect(store.branches()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });
  });

  // ── load ──────────────────────────────────────────────────────────────────

  describe('load', () => {
    it('fetches the branches for the given guild', async () => {
      const b = [branch({ branchName: 'MoP Classic' })];

      store.load('g1');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches'));
      expect(req.request.method).toBe('GET');
      req.flush(b);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.branches()).toEqual(b);
      expect(store.isLoading()).toBe(false);
    });

    it('re-fetches when called again for the same guildId', async () => {
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches')).flush([branch()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g1');
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches'));
      req.flush([branch({ branchName: 'MoP Classic' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.branches()[0].branchName).toBe('MoP Classic');
    });

    it('re-fetches when the guildId changes', async () => {
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches')).flush([branch()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.load('g2');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.endsWith('/guilds/g2/branches'))
        .flush([branch({ branchName: 'MoP Classic' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.branches()[0].branchName).toBe('MoP Classic');
    });
  });

  // ── reload ────────────────────────────────────────────────────────────────

  describe('reload', () => {
    it('re-fetches the currently tracked guild branches', async () => {
      store.load('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches')).flush([branch()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/branches'));
      req.flush([branch({ branchName: 'MoP Classic' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.branches()[0].branchName).toBe('MoP Classic');
    });
  });
});
