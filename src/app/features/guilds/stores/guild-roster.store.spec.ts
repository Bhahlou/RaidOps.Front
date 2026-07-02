import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GuildRosterMember } from '../models/guild-roster-member.model';
import { CharacterRank } from '../models/character-rank.enum';
import { GuildRosterService } from '../services/guild-roster.service';
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
  let service: { getRoster: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    service = { getRoster: vi.fn().mockReturnValue(of([member()])) };

    TestBed.configureTestingModule({
      providers: [
        GuildRosterStore,
        { provide: GuildRosterService, useValue: service },
      ],
    });
    store = TestBed.inject(GuildRosterStore);
  });

  // ── members / isLoading ──────────────────────────────────────────────────

  describe('members', () => {
    it('is null before any load', () => {
      expect(store.members()).toBeNull();
    });

    it('reports isLoading true before any load', () => {
      expect(store.isLoading()).toBe(true);
    });
  });

  // ── loadRoster ────────────────────────────────────────────────────────────

  describe('loadRoster', () => {
    it('calls the service and updates the members signal', () => {
      const m = [member({ characterName: 'Jaina' })];
      service.getRoster.mockReturnValue(of(m));

      store.loadRoster('g1').subscribe();

      expect(service.getRoster).toHaveBeenCalledWith('g1');
      expect(store.members()).toEqual(m);
      expect(store.isLoading()).toBe(false);
    });

    it('returns the cached value without re-fetching for the same guildId', () => {
      store.loadRoster('g1').subscribe();
      store.loadRoster('g1').subscribe();

      expect(service.getRoster).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when the guildId changes', () => {
      store.loadRoster('g1').subscribe();
      service.getRoster.mockReturnValue(of([member({ characterName: 'Jaina' })]));
      store.loadRoster('g2').subscribe();

      expect(service.getRoster).toHaveBeenCalledTimes(2);
      expect(store.members()?.[0].characterName).toBe('Jaina');
    });

    it('re-fetches when force is true, even for the same guildId', () => {
      store.loadRoster('g1').subscribe();
      store.loadRoster('g1', true).subscribe();

      expect(service.getRoster).toHaveBeenCalledTimes(2);
    });
  });

  // ── invalidate ────────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('clears the cached members', () => {
      store.loadRoster('g1').subscribe();

      store.invalidate();

      expect(store.members()).toBeNull();
    });

    it('forces a re-fetch on next loadRoster for the same guildId', () => {
      store.loadRoster('g1').subscribe();
      store.invalidate();
      store.loadRoster('g1').subscribe();

      expect(service.getRoster).toHaveBeenCalledTimes(2);
    });
  });
});
