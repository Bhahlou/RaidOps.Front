import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { GuildRosterMember } from '../models/guild-roster-member.model';
import { CharacterRank } from '../models/character-rank.enum';
import { GuildRosterStore } from './guild-roster.store';

const member = (overrides?: Partial<GuildRosterMember>): GuildRosterMember => ({
  characterId: 1,
  characterName: 'Arthas',
  classId: 6,
  className: 'Death Knight',
  classColor: '#C41F3B',
  level: 80,
  branchName: 'Classic Anniversary',
  realmSlug: 'kazzak',
  avatarUrl: null,
  playerDiscordId: 'user-1',
  playerName: 'Bhahlou',
  playerAvatarHash: null,
  raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: true }],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('GuildRosterStore', () => {
  let store: GuildRosterStore;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuildRosterStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GuildRosterStore);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── members / isLoading ──────────────────────────────────────────────────

  describe('members', () => {
    it('is null before any guild is set', () => {
      TestBed.tick();
      expect(store.members()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });
  });

  // ── loadRoster ────────────────────────────────────────────────────────────

  describe('loadRoster', () => {
    it('fetches the roster for the given guild', async () => {
      const m = [member({ characterName: 'Jaina' })];

      store.loadRoster('g1');
      TestBed.tick();

      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster'));
      expect(req.request.method).toBe('GET');
      req.flush(m);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.members()).toEqual(m);
      expect(store.isLoading()).toBe(false);
    });

    it('re-fetches every time it is called, even for the same guildId', async () => {
      store.loadRoster('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster')).flush([member()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRoster('g1');
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster'));
      req.flush([member({ characterName: 'Jaina' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.members()?.[0].characterName).toBe('Jaina');
    });

    it('re-fetches when the guildId changes', async () => {
      store.loadRoster('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster')).flush([member()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.loadRoster('g2');
      TestBed.tick();
      controller
        .expectOne((r) => r.url.endsWith('/guilds/g2/roster'))
        .flush([member({ characterName: 'Jaina' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.members()?.[0].characterName).toBe('Jaina');
    });
  });

  // ── reload ────────────────────────────────────────────────────────────────

  describe('reload', () => {
    it('re-fetches the currently tracked guild roster', async () => {
      store.loadRoster('g1');
      TestBed.tick();
      controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster')).flush([member()]);
      await TestBed.inject(ApplicationRef).whenStable();

      store.reload();
      TestBed.tick();
      const req = controller.expectOne((r) => r.url.endsWith('/guilds/g1/roster'));
      req.flush([member({ characterName: 'Jaina' })]);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.members()?.[0].characterName).toBe('Jaina');
    });
  });
});
