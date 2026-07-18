import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { GuildRosterListComponent } from './guild-roster-list.component';
import { GuildRosterStore } from '../../stores/guild-roster.store';
import { CharacterStore } from '../../../characters/stores/character.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';
import { GuildRosterMember } from '../../models/guild-roster-member.model';
import { CharacterRank } from '../../models/character-rank.enum';

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
  playerDiscordId: 'owner-1',
  playerName: 'Bhahlou',
  playerAvatarHash: null,
  raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: true }],
  characterRank: CharacterRank.Main,
  joinedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('GuildRosterListComponent', () => {
  let store: {
    isLoading: ReturnType<typeof signal>;
    members: ReturnType<typeof signal>;
    loadRoster: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let characterStore: {
    membershipErrorKey: ReturnType<typeof vi.fn>;
    updateRank: ReturnType<typeof vi.fn>;
    leaveGuild: ReturnType<typeof vi.fn>;
    updatingRankCharacterId: ReturnType<typeof signal>;
    leavingCharacterId: ReturnType<typeof signal>;
  };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let authStore: { user: ReturnType<typeof signal> };
  let transloco: {
    getActiveLang: ReturnType<typeof vi.fn>;
    activeLang: ReturnType<typeof signal>;
    translate: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<GuildRosterListComponent>;

  const setup = (
    guildId = 'g1',
    userGuilds: { id: string; accessLevel: GuildAccessLevel }[] = [],
    discordId = 'viewer-1',
    confirmKick = true,
    loggedOut = false,
  ) => {
    store = {
      isLoading: signal(false),
      members: signal([]),
      loadRoster: vi.fn(),
      reload: vi.fn(),
    };
    characterStore = {
      membershipErrorKey: vi.fn().mockReturnValue('characterDetail.guilds.errors.generic'),
      updateRank: vi.fn().mockReturnValue(of({ message: 'ok' })),
      leaveGuild: vi.fn().mockReturnValue(of({ message: 'ok' })),
      updatingRankCharacterId: signal<number | null>(null),
      leavingCharacterId: signal<number | null>(null),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(confirmKick) }) };
    authStore = {
      user: signal(
        loggedOut ? null : { discordId, name: 'Viewer', avatarHash: null, guilds: userGuilds },
      ),
    };
    transloco = {
      getActiveLang: vi.fn(() => 'fr'),
      activeLang: signal('fr'),
      translate: vi.fn((key: string) => key),
    };

    TestBed.configureTestingModule({
      imports: [GuildRosterListComponent],
      providers: [
        { provide: GuildRosterStore, useValue: store },
        { provide: CharacterStore, useValue: characterStore },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
        { provide: AuthStore, useValue: authStore },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(GuildRosterListComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildRosterListComponent);
    fixture.componentRef.setInput('guildId', guildId);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('force-loads the roster for the given guildId', () => {
      setup('g42');

      expect(store.loadRoster).toHaveBeenCalledWith('g42');
    });
  });

  describe('formatDate', () => {
    it('formats the timestamp using the active app language', () => {
      const component = setup();

      component.formatDate('2026-01-01T00:00:00Z');

      expect(transloco.getActiveLang).toHaveBeenCalled();
    });
  });

  describe('isOfficer', () => {
    it('is false when the user has no relation to the guild', () => {
      const component = setup('g1', []);
      expect(component.isOfficer()).toBe(false);
    });

    it('is false when the user has Roster access but not Officer', () => {
      const component = setup('g1', [{ id: 'g1', accessLevel: GuildAccessLevel.Roster }]);
      expect(component.isOfficer()).toBe(false);
    });

    it('is true when the user has Officer access on this guild', () => {
      const component = setup('g1', [{ id: 'g1', accessLevel: GuildAccessLevel.Officer }]);
      expect(component.isOfficer()).toBe(true);
    });

    it('is false when logged out (no user)', () => {
      const component = setup('g1', [], 'viewer-1', true, true);
      expect(component.isOfficer()).toBe(false);
    });
  });

  describe('rankSelectOptions', () => {
    it('maps every rank to a value/translated-label pair', () => {
      const component = setup();

      const options = component.rankSelectOptions();

      expect(options).toEqual([
        { value: CharacterRank.Main, label: `roster.list.rank.${CharacterRank.Main}` },
        { value: CharacterRank.Split, label: `roster.list.rank.${CharacterRank.Split}` },
        { value: CharacterRank.Alt, label: `roster.list.rank.${CharacterRank.Alt}` },
      ]);
      expect(transloco.translate).toHaveBeenCalled();
    });
  });

  describe('toggleRowExpand / isRowExpanded', () => {
    it('starts collapsed', () => {
      const component = setup();
      expect(component.isRowExpanded(1)).toBe(false);
    });

    it('expands then collapses a row', () => {
      const component = setup();

      component.toggleRowExpand(1);
      expect(component.isRowExpanded(1)).toBe(true);

      component.toggleRowExpand(1);
      expect(component.isRowExpanded(1)).toBe(false);
    });
  });

  describe('characterLink', () => {
    it('builds the character detail route from branch/realm/name', () => {
      const component = setup();
      expect(component.characterLink(member({ branchName: 'Classic Anniversary', realmSlug: 'kazzak', characterName: 'Arthas' })))
        .toEqual(['/characters', 'classic-anniversary', 'kazzak', 'arthas']);
    });
  });

  describe('canEditRank', () => {
    it('is true for the character owner even without officer access', () => {
      const component = setup('g1', [], 'owner-1');
      expect(component.canEditRank(member({ playerDiscordId: 'owner-1' }))).toBe(true);
    });

    it('is true for an officer on someone else\'s character', () => {
      const component = setup('g1', [{ id: 'g1', accessLevel: GuildAccessLevel.Officer }], 'officer-1');
      expect(component.canEditRank(member({ playerDiscordId: 'owner-1' }))).toBe(true);
    });

    it('is false for a plain roster viewer on someone else\'s character', () => {
      const component = setup('g1', [{ id: 'g1', accessLevel: GuildAccessLevel.Roster }], 'viewer-1');
      expect(component.canEditRank(member({ playerDiscordId: 'owner-1' }))).toBe(false);
    });

    it('is false when logged out (no user)', () => {
      const component = setup('g1', [], 'viewer-1', true, true);
      expect(component.canEditRank(member({ playerDiscordId: 'owner-1' }))).toBe(false);
    });
  });

  describe('updateRank', () => {
    it('updates the rank then reloads the roster', () => {
      const component = setup();

      component.updateRank(member(), CharacterRank.Alt);

      expect(characterStore.updateRank).toHaveBeenCalledWith(1, 'g1', CharacterRank.Alt);
      expect(snackbar.success).toHaveBeenCalledWith('characterDetail.guilds.rankUpdateSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('shows an error and does not reload the roster when the call fails', () => {
      const component = setup();
      const error = { status: 400 };
      characterStore.updateRank.mockReturnValue(throwError(() => error));

      component.updateRank(member(), CharacterRank.Alt);

      expect(characterStore.membershipErrorKey).toHaveBeenCalledWith(error);
      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.generic');
      expect(snackbar.success).not.toHaveBeenCalled();
      expect(store.reload).not.toHaveBeenCalled();
    });
  });

  describe('kickMember', () => {
    it('kicks the character after confirmation and reloads the roster', () => {
      const component = setup();

      component.kickMember(member());

      expect(dialog.open).toHaveBeenCalled();
      expect(characterStore.leaveGuild).toHaveBeenCalledWith(1, 'g1');
      expect(snackbar.success).toHaveBeenCalledWith('roster.list.kickSuccess');
      expect(store.reload).toHaveBeenCalled();
    });

    it('does nothing when the confirmation dialog is cancelled', () => {
      const component = setup('g1', [], 'viewer-1', false);

      component.kickMember(member());

      expect(characterStore.leaveGuild).not.toHaveBeenCalled();
      expect(store.reload).not.toHaveBeenCalled();
    });

    it('shows an error and does not reload the roster when the call fails', () => {
      const component = setup();
      const error = { status: 400 };
      characterStore.leaveGuild.mockReturnValue(throwError(() => error));

      component.kickMember(member());

      expect(characterStore.membershipErrorKey).toHaveBeenCalledWith(error);
      expect(snackbar.error).toHaveBeenCalledWith('characterDetail.guilds.errors.generic');
      expect(snackbar.success).not.toHaveBeenCalled();
      expect(store.reload).not.toHaveBeenCalled();
    });
  });

  describe('availableClasses', () => {
    it('deduplicates members by classId and sorts alphabetically by className', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, classId: 6, className: 'Death Knight' }),
        member({ characterId: 2, classId: 1, className: 'Warrior' }),
        member({ characterId: 3, classId: 6, className: 'Death Knight' }),
        member({ characterId: 4, classId: 2, className: 'Paladin' }),
      ]);

      expect(component.availableClasses()).toEqual([
        { classId: 6, className: 'Death Knight', classColor: '#C41F3B' },
        { classId: 2, className: 'Paladin', classColor: '#C41F3B' },
        { classId: 1, className: 'Warrior', classColor: '#C41F3B' },
      ]);
    });

    it('is empty when there are no members', () => {
      const component = setup();
      store.members.set([]);
      expect(component.availableClasses()).toEqual([]);
    });

    it('is empty when the roster has not loaded yet (null members)', () => {
      const component = setup();
      store.members.set(null);
      expect(component.availableClasses()).toEqual([]);
    });
  });

  describe('availableSpecs', () => {
    it('deduplicates by the main spec only and sorts alphabetically by name', () => {
      const component = setup();
      store.members.set([
        member({
          characterId: 1,
          raidSpecs: [
            { specId: 1, name: 'Frost', iconUrl: null, isMain: true },
            { specId: 2, name: 'Unholy', iconUrl: null, isMain: false },
          ],
        }),
        member({
          characterId: 2,
          raidSpecs: [{ specId: 3, name: 'Arms', iconUrl: null, isMain: true }],
        }),
        member({
          characterId: 3,
          raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: true }],
        }),
      ]);

      expect(component.availableSpecs()).toEqual([
        { specId: 3, name: 'Arms', iconUrl: null },
        { specId: 1, name: 'Frost', iconUrl: null },
      ]);
    });

    it('excludes members without a main spec', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, raidSpecs: [{ specId: 2, name: 'Unholy', iconUrl: null, isMain: false }] }),
      ]);

      expect(component.availableSpecs()).toEqual([]);
    });

    it('is empty when the roster has not loaded yet (null members)', () => {
      const component = setup();
      store.members.set(null);
      expect(component.availableSpecs()).toEqual([]);
    });
  });

  describe('toggleClass / isClassSelected', () => {
    it('selects then deselects a class', () => {
      const component = setup();

      expect(component.isClassSelected(6)).toBe(false);
      component.toggleClass(6);
      expect(component.isClassSelected(6)).toBe(true);
      component.toggleClass(6);
      expect(component.isClassSelected(6)).toBe(false);
    });
  });

  describe('toggleSpec / isSpecSelected', () => {
    it('selects then deselects a spec', () => {
      const component = setup();

      expect(component.isSpecSelected(1)).toBe(false);
      component.toggleSpec(1);
      expect(component.isSpecSelected(1)).toBe(true);
      component.toggleSpec(1);
      expect(component.isSpecSelected(1)).toBe(false);
    });
  });

  describe('toggleRank / isRankSelected', () => {
    it('selects then deselects a rank', () => {
      const component = setup();

      expect(component.isRankSelected(CharacterRank.Alt)).toBe(false);
      component.toggleRank(CharacterRank.Alt);
      expect(component.isRankSelected(CharacterRank.Alt)).toBe(true);
      component.toggleRank(CharacterRank.Alt);
      expect(component.isRankSelected(CharacterRank.Alt)).toBe(false);
    });
  });

  describe('date range filters', () => {
    it('sets and clears the start/end dates', () => {
      const component = setup();
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 0, 31);

      component.setDateRangeStart(start);
      component.setDateRangeEnd(end);
      expect(component.dateRangeStart()).toBe(start);
      expect(component.dateRangeEnd()).toBe(end);

      component.clearDateRange();
      expect(component.dateRangeStart()).toBeNull();
      expect(component.dateRangeEnd()).toBeNull();
    });
  });

  describe('setSearch', () => {
    it('sets the search query', () => {
      const component = setup();
      component.setSearch('Arthas');
      expect(component.searchQuery()).toBe('Arthas');
    });
  });

  describe('hasActiveFilters', () => {
    it('is false with no filters applied', () => {
      const component = setup();
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('is true when a class is selected', () => {
      const component = setup();
      component.toggleClass(6);
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is true when a spec is selected', () => {
      const component = setup();
      component.toggleSpec(1);
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is true when a rank is selected', () => {
      const component = setup();
      component.toggleRank(CharacterRank.Alt);
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is true when a date range start is set', () => {
      const component = setup();
      component.setDateRangeStart(new Date(2026, 0, 1));
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is true when a date range end is set', () => {
      const component = setup();
      component.setDateRangeEnd(new Date(2026, 0, 31));
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is true when a non-blank search query is set', () => {
      const component = setup();
      component.setSearch('  Arthas  ');
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('is false when the search query is only whitespace', () => {
      const component = setup();
      component.setSearch('   ');
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    it('resets every filter and the search query', () => {
      const component = setup();
      component.toggleClass(6);
      component.toggleSpec(1);
      component.toggleRank(CharacterRank.Alt);
      component.setDateRangeStart(new Date(2026, 0, 1));
      component.setDateRangeEnd(new Date(2026, 0, 31));
      component.setSearch('Arthas');

      component.clearAllFilters();

      expect(component.isClassSelected(6)).toBe(false);
      expect(component.isSpecSelected(1)).toBe(false);
      expect(component.isRankSelected(CharacterRank.Alt)).toBe(false);
      expect(component.dateRangeStart()).toBeNull();
      expect(component.dateRangeEnd()).toBeNull();
      expect(component.searchQuery()).toBe('');
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('filteredMembers', () => {
    it('is null before the roster has loaded', () => {
      const component = setup();
      store.members.set(null);
      expect(component.filteredMembers()).toBeNull();
    });

    it('filters by selected class', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, classId: 6, characterName: 'Arthas' }),
        member({ characterId: 2, classId: 1, characterName: 'Garrosh' }),
      ]);

      component.toggleClass(1);

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Garrosh']);
    });

    it('filters by selected main spec only', () => {
      const component = setup();
      store.members.set([
        member({
          characterId: 1,
          characterName: 'Arthas',
          raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: true }],
        }),
        member({
          characterId: 2,
          characterName: 'Jaina',
          raidSpecs: [{ specId: 1, name: 'Frost', iconUrl: null, isMain: false }],
        }),
      ]);

      component.toggleSpec(1);

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Arthas']);
    });

    it('filters by selected rank', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', characterRank: CharacterRank.Main }),
        member({ characterId: 2, characterName: 'Jaina', characterRank: CharacterRank.Alt }),
      ]);

      component.toggleRank(CharacterRank.Alt);

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Jaina']);
    });

    it('filters by date range start (inclusive)', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', joinedAt: '2026-01-01T00:00:00Z' }),
        member({ characterId: 2, characterName: 'Jaina', joinedAt: '2026-02-01T00:00:00Z' }),
      ]);

      component.setDateRangeStart(new Date(2026, 1, 1));

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Jaina']);
    });

    it('filters by date range end (inclusive)', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', joinedAt: '2026-01-01T00:00:00Z' }),
        member({ characterId: 2, characterName: 'Jaina', joinedAt: '2026-02-01T00:00:00Z' }),
      ]);

      component.setDateRangeEnd(new Date(2026, 0, 31));

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Arthas']);
    });

    it('filters by search query matching the character name', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', playerName: 'Bhahlou' }),
        member({ characterId: 2, characterName: 'Jaina', playerName: 'Other' }),
      ]);

      component.setSearch('arth');

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Arthas']);
    });

    it('filters by search query matching the player name', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', playerName: 'Bhahlou' }),
        member({ characterId: 2, characterName: 'Jaina', playerName: 'Other' }),
      ]);

      component.setSearch('bhah');

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Arthas']);
    });

    it('excludes a member with a null player name when the query only matches on player name', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Jaina', playerName: null }),
      ]);

      // 'jaina' doesn't match the query, so the OR's right operand runs; playerName is null,
      // so it must fall back to '' instead of throwing — and '' never contains a non-empty query.
      component.setSearch('bhah');

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual([]);
    });

    it('combines multiple filters with AND semantics', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Arthas', classId: 6, characterRank: CharacterRank.Main }),
        member({ characterId: 2, characterName: 'Aramar', classId: 6, characterRank: CharacterRank.Alt }),
        member({ characterId: 3, characterName: 'Amber', classId: 1, characterRank: CharacterRank.Main }),
      ]);

      component.toggleClass(6);
      component.toggleRank(CharacterRank.Main);
      component.setSearch('ar');

      expect(component.filteredMembers()?.map((m) => m.characterName)).toEqual(['Arthas']);
    });
  });

  describe('filteredCount', () => {
    it('is null before the roster has loaded', () => {
      const component = setup();
      store.members.set(null);
      expect(component.filteredCount()).toBeNull();
    });

    it('reflects the unfiltered member count', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1 }),
        member({ characterId: 2 }),
      ]);
      expect(component.filteredCount()).toBe(2);
    });

    it('reflects the count after filters are applied', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, classId: 6 }),
        member({ characterId: 2, classId: 1 }),
      ]);

      component.toggleClass(1);

      expect(component.filteredCount()).toBe(1);
    });

    it('is 0 when no member matches the active filters', () => {
      const component = setup();
      store.members.set([member({ characterId: 1, classId: 6 })]);

      component.toggleClass(1);

      expect(component.filteredCount()).toBe(0);
    });
  });

  describe('toggleSort / sortIcon / sortedMembers', () => {
    it('returns members unsorted when no column is active, and sortIcon is null', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Jaina' }),
        member({ characterId: 2, characterName: 'Arthas' }),
      ]);

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Jaina', 'Arthas']);
      expect(component.sortIcon('character')).toBeNull();
    });

    it('is null before the roster has loaded', () => {
      const component = setup();
      store.members.set(null);
      expect(component.sortedMembers()).toBeNull();
    });

    it('sorts ascending on first toggle, then descending on a second toggle of the same column', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Jaina' }),
        member({ characterId: 2, characterName: 'Arthas' }),
      ]);

      component.toggleSort('character');
      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Arthas', 'Jaina']);
      expect(component.sortIcon('character')).toBe('arrow_upward');

      component.toggleSort('character');
      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Jaina', 'Arthas']);
      expect(component.sortIcon('character')).toBe('arrow_downward');

      component.toggleSort('character');
      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Arthas', 'Jaina']);
      expect(component.sortIcon('character')).toBe('arrow_upward');
    });

    it('resets to ascending when switching to a different column', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Jaina', level: 60 }),
        member({ characterId: 2, characterName: 'Arthas', level: 80 }),
      ]);

      component.toggleSort('character');
      component.toggleSort('character');
      component.toggleSort('level');

      expect(component.sortIcon('character')).toBeNull();
      expect(component.sortIcon('level')).toBe('arrow_upward');
      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Jaina', 'Arthas']);
    });

    it('sorts by player name, falling back to the discord id', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'A', playerName: 'Zul', playerDiscordId: 'z' }),
        member({ characterId: 2, characterName: 'B', playerName: null, playerDiscordId: 'a-fallback' }),
      ]);

      component.toggleSort('player');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['B', 'A']);
    });

    it('sorts by player name, falling back to the discord id, with the null name on the other side', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'C', playerName: null, playerDiscordId: 'a-fallback' }),
        member({ characterId: 2, characterName: 'D', playerName: 'Zul', playerDiscordId: 'z' }),
      ]);

      component.toggleSort('player');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['C', 'D']);
    });

    it('sorts by class name', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'A', className: 'Warrior' }),
        member({ characterId: 2, characterName: 'B', className: 'Death Knight' }),
      ]);

      component.toggleSort('class');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['B', 'A']);
    });

    it('sorts by level numerically', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'A', level: 80 }),
        member({ characterId: 2, characterName: 'B', level: 60 }),
      ]);

      component.toggleSort('level');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['B', 'A']);
    });

    it('sorts by rank order (Main, Split, Alt)', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'A', characterRank: CharacterRank.Alt }),
        member({ characterId: 2, characterName: 'B', characterRank: CharacterRank.Main }),
      ]);

      component.toggleSort('rank');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['B', 'A']);
    });

    it('sorts by joinedAt', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'A', joinedAt: '2026-03-01T00:00:00Z' }),
        member({ characterId: 2, characterName: 'B', joinedAt: '2026-01-01T00:00:00Z' }),
      ]);

      component.toggleSort('joinedAt');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['B', 'A']);
    });

    it('sorts the already-filtered list', () => {
      const component = setup();
      store.members.set([
        member({ characterId: 1, characterName: 'Jaina', classId: 6, level: 80 }),
        member({ characterId: 2, characterName: 'Arthas', classId: 6, level: 60 }),
        member({ characterId: 3, characterName: 'Garrosh', classId: 1, level: 70 }),
      ]);

      component.toggleClass(6);
      component.toggleSort('level');

      expect(component.sortedMembers()?.map((m) => m.characterName)).toEqual(['Arthas', 'Jaina']);
    });
  });
});
