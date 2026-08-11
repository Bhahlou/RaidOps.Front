import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { GuildAuditLogComponent } from './guild-audit-log.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AuditLogStore } from '../../stores/audit-log.store';
import { AuditLogEntry } from '../../models/audit-log-entry.model';
import { GuildAuditAction } from '../../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../../models/guild-audit-category.enum';

const entry = (overrides?: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: 1,
  actorDiscordId: 'actor-1',
  actorUsername: 'Bhahlou',
  actorAvatarHash: null,
  actorGuildAvatarUrl: null,
  actionType: GuildAuditAction.GuildRegistered,
  category: GuildAuditCategory.Guild,
  variables: null,
  occurredAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('GuildAuditLogComponent', () => {
  let store: { entries: ReturnType<typeof signal>; hasMore: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>; loadingMore: ReturnType<typeof signal>;
    load: ReturnType<typeof vi.fn>; loadMore: ReturnType<typeof vi.fn> };
  let transloco: { translate: ReturnType<typeof vi.fn>; getActiveLang: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<GuildAuditLogComponent>;

  const setup = (
    guildId: string | null = 'g1',
    paramMap$: Observable<ParamMap> = of(convertToParamMap(guildId ? { id: guildId } : {})),
  ) => {
    store = {
      entries: signal([]),
      hasMore: signal(false),
      loading: signal(false),
      loadingMore: signal(false),
      load: vi.fn().mockReturnValue(of(undefined)),
      loadMore: vi.fn().mockReturnValue(of(undefined)),
    };
    transloco = { translate: vi.fn((key: string) => key), getActiveLang: vi.fn(() => 'fr') };

    TestBed.configureTestingModule({
      imports: [GuildAuditLogComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: paramMap$,
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(null) } },
        { provide: AuditLogStore, useValue: store },
        { provide: TranslocoService, useValue: transloco },
      ],
    }).overrideComponent(GuildAuditLogComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(GuildAuditLogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('loads the first page on init', () => {
    setup();

    expect(store.load).toHaveBeenCalledWith('g1');
  });

  it('reloads when the guild switches (route param change, component reused)', () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1' }));
    setup('g1', paramMap$);
    expect(store.load).toHaveBeenCalledWith('g1');

    paramMap$.next(convertToParamMap({ id: 'g2' }));
    fixture.detectChanges();

    expect(store.load).toHaveBeenCalledWith('g2');
  });

  it('sets i18nKey to sidenav.guild.auditLog on the last breadcrumb', () => {
    expect(setup().breadcrumbs().at(-1)?.i18nKey).toBe('sidenav.guild.auditLog');
  });

  describe('hasEntries', () => {
    it('is false when the store has no entries loaded', () => {
      const component = setup();

      expect(component.hasEntries()).toBe(false);
    });

    it('is true once the store has entries, regardless of the active filters', () => {
      const component = setup();
      store.entries.set([entry()]);

      expect(component.hasEntries()).toBe(true);
    });
  });

  describe('onFilterChange / selectCategoryFilter (mutually exclusive server-side filters)', () => {
    it('onFilterChange reloads with the selected action type and updates selectedFilter', () => {
      const component = setup();
      component.onFilterChange(GuildAuditAction.MemberJoined);

      expect(store.load).toHaveBeenCalledWith('g1', GuildAuditAction.MemberJoined);
      expect(component.selectedFilter()).toBe(GuildAuditAction.MemberJoined);
    });

    it('onFilterChange clears any active category filter', () => {
      const component = setup();
      component.selectCategoryFilter(GuildAuditCategory.Roster);

      component.onFilterChange(GuildAuditAction.MemberJoined);

      expect(component.selectedCategory()).toBeUndefined();
    });

    it('selectCategoryFilter reloads with the selected category and updates selectedCategory', () => {
      const component = setup();
      component.selectCategoryFilter(GuildAuditCategory.Settings);

      expect(store.load).toHaveBeenCalledWith('g1', undefined, GuildAuditCategory.Settings);
      expect(component.selectedCategory()).toBe(GuildAuditCategory.Settings);
    });

    it('selectCategoryFilter clears any active action filter', () => {
      const component = setup();
      component.onFilterChange(GuildAuditAction.MemberJoined);

      component.selectCategoryFilter(GuildAuditCategory.Settings);

      expect(component.selectedFilter()).toBeUndefined();
    });

    it('resets selectedFilter and selectedCategory when the guild switches', () => {
      const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'g1' }));
      const component = setup('g1', paramMap$);
      component.onFilterChange(GuildAuditAction.MemberJoined);

      paramMap$.next(convertToParamMap({ id: 'g2' }));
      fixture.detectChanges();

      expect(component.selectedFilter()).toBeUndefined();
      expect(component.selectedCategory()).toBeUndefined();
    });
  });

  describe('client-side filters (actor / change / date range)', () => {
    it('selectActorFilter narrows sortedEntries to an exact actor match', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorDiscordId: 'a1' }),
        entry({ id: 2, actorDiscordId: 'a2' }),
      ]);

      component.selectActorFilter('a1');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([1]);
    });

    it('selectChangeFilter narrows sortedEntries to an exact rendered change match', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actionType: GuildAuditAction.MemberJoined, category: GuildAuditCategory.Roster, variables: { characterName: 'Arthas' } }),
        entry({ id: 2, actionType: GuildAuditAction.MemberJoined, category: GuildAuditCategory.Roster, variables: { characterName: 'Zaza' } }),
      ]);

      component.selectChangeFilter('Arthas');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([1]);
    });

    it('date range filters narrow sortedEntries to entries within [start, end] inclusive', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, occurredAt: '2026-01-01T00:00:00Z' }),
        entry({ id: 2, occurredAt: '2026-06-15T00:00:00Z' }),
        entry({ id: 3, occurredAt: '2026-12-31T00:00:00Z' }),
      ]);

      component.setDateRangeStart(new Date(2026, 5, 1));
      component.setDateRangeEnd(new Date(2026, 5, 30));

      expect(component.sortedEntries().map((e) => e.id)).toEqual([2]);
    });

    it('clearDateRange removes both bounds', () => {
      const component = setup();
      store.entries.set([entry({ id: 1, occurredAt: '2026-01-01T00:00:00Z' })]);
      component.setDateRangeStart(new Date(2026, 5, 1));
      component.setDateRangeEnd(new Date(2026, 5, 30));

      component.clearDateRange();

      expect(component.dateRangeStart()).toBeNull();
      expect(component.dateRangeEnd()).toBeNull();
      expect(component.sortedEntries().map((e) => e.id)).toEqual([1]);
    });

    it('combines with sorting', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorDiscordId: 'a1', actorUsername: 'Arthas' }),
        entry({ id: 2, actorDiscordId: 'a1', actorUsername: 'Arthas' }),
        entry({ id: 3, actorDiscordId: 'a2', actorUsername: 'Zaza' }),
      ]);
      component.selectActorFilter('a1');
      component.toggleSort('time');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([1, 2]);
    });
  });

  describe('formatDate', () => {
    it('formats the timestamp using the active app language', () => {
      const component = setup();
      component.formatDate('2026-01-01T00:00:00Z');

      expect(transloco.getActiveLang).toHaveBeenCalled();
    });
  });

  describe('sorting', () => {
    it('sortIcon returns null when the column is not the active sort', () => {
      const component = setup();

      expect(component.sortIcon('actor')).toBeNull();
    });

    it('toggleSort sets ascending order on first click', () => {
      const component = setup();
      component.toggleSort('actor');

      expect(component.sortIcon('actor')).toBe('arrow_upward');
    });

    it('toggleSort flips direction on a second click of the same column', () => {
      const component = setup();
      component.toggleSort('actor');
      component.toggleSort('actor');

      expect(component.sortIcon('actor')).toBe('arrow_downward');
    });

    it('toggleSort resets to ascending when switching to a different column', () => {
      const component = setup();
      component.toggleSort('actor');
      component.toggleSort('actor');
      component.toggleSort('time');

      expect(component.sortIcon('actor')).toBeNull();
      expect(component.sortIcon('time')).toBe('arrow_upward');
    });

    it('sortedEntries sorts by actor name', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorUsername: 'Zaza' }),
        entry({ id: 2, actorUsername: 'Arthas' }),
      ]);
      component.toggleSort('actor');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([2, 1]);
    });

    it('sortedEntries reverses order on second click', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorUsername: 'Zaza' }),
        entry({ id: 2, actorUsername: 'Arthas' }),
      ]);
      component.toggleSort('actor');
      component.toggleSort('actor');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([1, 2]);
    });

    it('sortedEntries returns entries unsorted when no column is active', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorUsername: 'Zaza' }),
        entry({ id: 2, actorUsername: 'Arthas' }),
      ]);

      expect(component.sortedEntries().map((e) => e.id)).toEqual([1, 2]);
    });

    it('toggleSort flips back to ascending on a third click of the same column', () => {
      const component = setup();
      component.toggleSort('actor');
      component.toggleSort('actor');
      component.toggleSort('actor');

      expect(component.sortIcon('actor')).toBe('arrow_upward');
    });

    it('sortedEntries sorts by category, action, and change for those columns', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, category: GuildAuditCategory.Settings, actionType: GuildAuditAction.SettingsUpdated, variables: { changedFields: 'timezone', oldTimezone: 'Z', newTimezone: 'A' } }),
        entry({ id: 2, category: GuildAuditCategory.Guild, actionType: GuildAuditAction.GuildRegistered, variables: { guildName: 'A Guild' } }),
      ]);

      component.toggleSort('category');
      expect(component.sortedEntries().map((e) => e.id)).toEqual([2, 1]);

      component.toggleSort('action');
      expect(component.sortedEntries().map((e) => e.id)).toEqual([2, 1]);

      component.toggleSort('change');
      expect(component.sortedEntries().map((e) => e.id)).toEqual([2, 1]);
    });

    it('sorts by actor id when actorUsername is null', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorDiscordId: 'zzz', actorUsername: null }),
        entry({ id: 2, actorDiscordId: 'aaa', actorUsername: null }),
      ]);
      component.toggleSort('actor');

      expect(component.sortedEntries().map((e) => e.id)).toEqual([2, 1]);
    });
  });

  describe('filter option lists', () => {
    it('availableActors dedupes by actor id and sorts by display name', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorDiscordId: 'a1', actorUsername: 'Zaza' }),
        entry({ id: 2, actorDiscordId: 'a1', actorUsername: 'Zaza' }),
        entry({ id: 3, actorDiscordId: 'a2', actorUsername: 'Arthas' }),
      ]);

      expect(component.availableActors()).toEqual([
        { id: 'a2', name: 'Arthas' },
        { id: 'a1', name: 'Zaza' },
      ]);
    });

    it('availableActors falls back to the actor id when actorUsername is null', () => {
      const component = setup();
      store.entries.set([entry({ actorDiscordId: 'a1', actorUsername: null })]);

      expect(component.availableActors()).toEqual([{ id: 'a1', name: 'a1' }]);
    });

    it('actorFilterOptions maps availableActors to filter-menu options', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actorDiscordId: 'a1', actorUsername: 'Arthas' }),
        entry({ id: 2, actorDiscordId: 'a2', actorUsername: 'Zaza' }),
      ]);

      expect(component.actorFilterOptions()).toEqual([
        { value: 'a1', label: 'Arthas' },
        { value: 'a2', label: 'Zaza' },
      ]);
    });

    it('availableCategories only lists categories actually present among loaded entries', () => {
      const component = setup();
      store.entries.set([entry({ category: GuildAuditCategory.Roster })]);

      expect(component.availableCategories()).toEqual([GuildAuditCategory.Roster]);
    });

    it('categoryFilterOptions maps availableCategories to labeled filter-menu options', () => {
      const component = setup();
      store.entries.set([entry({ category: GuildAuditCategory.Roster })]);

      expect(component.categoryFilterOptions()).toEqual([
        { value: GuildAuditCategory.Roster, label: component.categoryLabel(GuildAuditCategory.Roster) },
      ]);
    });

    it('availableActionTypes only lists action types actually present among loaded entries', () => {
      const component = setup();
      store.entries.set([entry({ actionType: GuildAuditAction.MemberJoined })]);

      expect(component.availableActionTypes()).toEqual([GuildAuditAction.MemberJoined]);
    });

    it('actionFilterOptions maps availableActionTypes to labeled filter-menu options', () => {
      const component = setup();
      store.entries.set([entry({ actionType: GuildAuditAction.MemberJoined })]);

      expect(component.actionFilterOptions()).toEqual([
        { value: GuildAuditAction.MemberJoined, label: component.actionLabel(GuildAuditAction.MemberJoined) },
      ]);
    });

    it('availableChanges lists distinct rendered change summaries, sorted', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actionType: GuildAuditAction.MemberJoined, variables: { characterName: 'Zaza' } }),
        entry({ id: 2, actionType: GuildAuditAction.MemberJoined, variables: { characterName: 'Arthas' } }),
        entry({ id: 3, actionType: GuildAuditAction.MemberJoined, variables: { characterName: 'Arthas' } }),
      ]);

      expect(component.availableChanges()).toEqual(['Arthas', 'Zaza']);
    });

    it('changeFilterOptions maps availableChanges to filter-menu options', () => {
      const component = setup();
      store.entries.set([
        entry({ id: 1, actionType: GuildAuditAction.MemberJoined, variables: { characterName: 'Arthas' } }),
        entry({ id: 2, actionType: GuildAuditAction.MemberJoined, variables: { characterName: 'Zaza' } }),
      ]);

      expect(component.changeFilterOptions()).toEqual([
        { value: 'Arthas', label: 'Arthas' },
        { value: 'Zaza', label: 'Zaza' },
      ]);
    });
  });

  describe('loadMore', () => {
    it('delegates to the store', () => {
      const component = setup();
      component.loadMore();

      expect(store.loadMore).toHaveBeenCalled();
    });
  });

  describe('guildRegisteredDisplay', () => {
    it('returns the guild name and icon hash for GuildRegistered', () => {
      const component = setup();

      expect(component.guildRegisteredDisplay(entry({
        actionType: GuildAuditAction.GuildRegistered,
        variables: { guildName: 'Test Guild', guildIconHash: 'icon123' },
      }))).toEqual({ name: 'Test Guild', iconHash: 'icon123' });
    });

    it('returns iconHash null when the guild has no custom icon', () => {
      const component = setup();

      expect(component.guildRegisteredDisplay(entry({
        actionType: GuildAuditAction.GuildRegistered,
        variables: { guildName: 'Test Guild' },
      }))).toEqual({ name: 'Test Guild', iconHash: null });
    });

    it('returns null when guildName is missing', () => {
      const component = setup();

      expect(component.guildRegisteredDisplay(entry({ actionType: GuildAuditAction.GuildRegistered }))).toBeNull();
    });

    it('returns null for action types other than GuildRegistered', () => {
      const component = setup();

      expect(component.guildRegisteredDisplay(entry({
        actionType: GuildAuditAction.MemberJoined,
        variables: { guildName: 'Test Guild' },
      }))).toBeNull();
    });
  });

  describe('characterChangeDisplay', () => {
    it('returns name, classId and class color for MemberJoined', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberJoined,
        variables: { characterName: 'Arthas', characterClassId: '2' },
      }))).toEqual({ name: 'Arthas', classId: 2, color: '#F58CBA' });
    });

    it('works the same way for MemberLeft', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberLeft,
        variables: { characterName: 'Arthas', characterClassId: '2' },
      }))).toEqual({ name: 'Arthas', classId: 2, color: '#F58CBA' });
    });

    it('also resolves the character for MemberRankUpdated (not just join/leave)', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { characterName: 'Arthas', characterClassId: '2', oldRank: 'Alt', newRank: 'Main' },
      }))).toEqual({ name: 'Arthas', classId: 2, color: '#F58CBA' });
    });

    it('also resolves the character for MemberExcluded', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberExcluded,
        variables: { characterName: 'Arthas', characterClassId: '2' },
      }))).toEqual({ name: 'Arthas', classId: 2, color: '#F58CBA' });
    });

    it('returns classId and color null when characterClassId is not present in variables', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberJoined,
        variables: { characterName: 'Arthas' },
      }))).toEqual({ name: 'Arthas', classId: null, color: null });
    });

    it('returns color null when characterClassId has no entry in CLASS_COLORS', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.MemberJoined,
        variables: { characterName: 'Arthas', characterClassId: '99' },
      }))).toEqual({ name: 'Arthas', classId: 99, color: null });
    });

    it('returns null for an action type outside CharacterChangeActionTypes, regardless of variables', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({ actionType: GuildAuditAction.GuildRegistered }))).toBeNull();
    });

    it('returns null when characterName is missing even for an action type that does carry a character (e.g. SlotAssigned)', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.SlotAssigned,
        variables: { characterClassId: '6' },
      }))).toBeNull();
    });

    it.each([
      GuildAuditAction.SlotAssigned,
      GuildAuditAction.SlotUnassigned,
      GuildAuditAction.SlotAssignmentSpecChanged,
    ])('also resolves the character for %s (raid composition entries)', (actionType) => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType,
        variables: { characterName: 'Arthas', characterClassId: '6' },
      }))).toEqual({ name: 'Arthas', classId: 6, color: '#C41F3B' });
    });

    it('returns null for SlotsSwapped — it names two characters, not one', () => {
      const component = setup();

      expect(component.characterChangeDisplay(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: { characterAName: 'Arthas', characterBName: 'Jaina' },
      }))).toBeNull();
    });
  });

  describe('slotsSwappedDisplay', () => {
    it('returns both characters with class color and (group-slot) folded into the name', () => {
      const component = setup();

      expect(component.slotsSwappedDisplay(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: {
          characterAName: 'Arthas', characterAClassId: '6', groupNumberA: '1', slotNumberA: '3',
          characterBName: 'Jaina', characterBClassId: '8', groupNumberB: '2', slotNumberB: '1',
          eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00',
        },
      }))).toEqual({
        a: { name: 'Arthas (1-3)', classId: 6, color: '#C41F3B' },
        b: { name: 'Jaina (2-1)', classId: 8, color: '#69CCF0' },
        suffix: ' — Split 1 · 05/08/2026 20:00',
      });
    });

    it('omits the (group-slot) suffix when coordinates are missing', () => {
      const component = setup();

      const result = component.slotsSwappedDisplay(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: { characterAName: 'Arthas', characterBName: 'Jaina' },
      }));

      expect(result?.a.name).toBe('Arthas');
      expect(result?.b.name).toBe('Jaina');
    });

    it('returns null when either character name is missing', () => {
      const component = setup();

      expect(component.slotsSwappedDisplay(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: { characterAName: 'Arthas' },
      }))).toBeNull();
    });

    it('returns null for action types other than SlotsSwapped', () => {
      const component = setup();

      expect(component.slotsSwappedDisplay(entry({
        actionType: GuildAuditAction.SlotAssigned,
        variables: { characterName: 'Arthas' },
      }))).toBeNull();
    });
  });

  describe('changeSuffix', () => {
    it('returns the raw (untranslated) rank transition for MemberRankUpdated', () => {
      const component = setup();

      expect(component.changeSuffix(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { characterName: 'Arthas', oldRank: 'Alt', newRank: 'Main' },
      }))).toBe(' : Alt → Main');
      expect(transloco.translate).not.toHaveBeenCalledWith('auditLog.rank.Alt');
    });

    it('returns null for action types other than MemberRankUpdated', () => {
      const component = setup();

      expect(component.changeSuffix(entry({
        actionType: GuildAuditAction.MemberJoined,
        variables: { characterName: 'Arthas' },
      }))).toBeNull();
    });

    it('returns null when oldRank/newRank are missing', () => {
      const component = setup();

      expect(component.changeSuffix(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { characterName: 'Arthas' },
      }))).toBeNull();
    });

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'appends the (group-slot) coordinate and event context for %s',
      (actionType) => {
        const component = setup();

        expect(component.changeSuffix(entry({
          actionType,
          variables: { characterName: 'Arthas', groupNumber: '2', slotNumber: '3', eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00' },
        }))).toBe(' (2-3) — Split 1 · 05/08/2026 20:00');
      },
    );

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'omits the coordinate for %s when group/slot are missing, keeping just the event context',
      (actionType) => {
        const component = setup();

        expect(component.changeSuffix(entry({
          actionType,
          variables: { characterName: 'Arthas', eventName: 'Split 1' },
        }))).toBe(' — Split 1');
      },
    );

    it('appends the old/new spec transition and event context for SlotAssignmentSpecChanged', () => {
      const component = setup();

      expect(component.changeSuffix(entry({
        actionType: GuildAuditAction.SlotAssignmentSpecChanged,
        variables: { characterName: 'Arthas', oldSpecName: 'Blood', newSpecName: 'Frost', eventName: 'Split 1' },
      }))).toBe(' : Blood → Frost — Split 1');
    });

    it('omits the spec transition for SlotAssignmentSpecChanged when oldSpecName/newSpecName are missing', () => {
      const component = setup();

      expect(component.changeSuffix(entry({
        actionType: GuildAuditAction.SlotAssignmentSpecChanged,
        variables: { characterName: 'Arthas', eventName: 'Split 1' },
      }))).toBe(' — Split 1');
    });
  });

  describe('settingsFieldChanges', () => {
    it('returns nothing when variables are missing', () => {
      const component = setup();

      expect(component.settingsFieldChanges(entry({ actionType: GuildAuditAction.SettingsUpdated }))).toEqual([]);
    });

    it('returns nothing for legacy entries that predate changedFields', () => {
      const component = setup();

      expect(component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London' },
      }))).toEqual([]);
    });

    it('builds a timezone change from changedFields', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'timezone', oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London' },
      }));

      expect(changes).toEqual([{
        labelKey: 'auditLog.settingsFields.timezone',
        summary: 'Europe/Paris → Europe/London',
      }]);
    });

    it('shows an em dash for the timezone field when oldTimezone is missing (first-time configuration)', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'timezone', newTimezone: 'Europe/Paris' },
      }));

      expect(changes[0].summary).toBe('— → Europe/Paris');
    });

    it('builds a language change from changedFields', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'language', oldLanguage: 'en', newLanguage: 'fr' },
      }));

      expect(changes).toEqual([{
        labelKey: 'auditLog.settingsFields.language',
        summary: 'en → fr',
      }]);
    });

    it('shows an em dash for the language field when oldLanguage is missing (first-time configuration)', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'language', newLanguage: 'fr' },
      }));

      expect(changes[0].summary).toBe('— → fr');
    });

    it('translates roster mode labels', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'rosterMode', oldRosterMode: 'Open', newRosterMode: 'DiscordRoleOnly' },
      }));

      expect(transloco.translate).toHaveBeenCalledWith('guildSettings.branches.rosterMode.open');
      expect(transloco.translate).toHaveBeenCalledWith('guildSettings.branches.rosterMode.discordRoleOnly');
      expect(changes[0].summary).toBe('guildSettings.branches.rosterMode.open → guildSettings.branches.rosterMode.discordRoleOnly');
    });

    it('shows an em dash for the roster mode field when oldRosterMode is missing (first-time configuration)', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'rosterMode', newRosterMode: 'Open' },
      }));

      expect(changes[0].summary).toBe('— → guildSettings.branches.rosterMode.open');
    });

    it('translates signup mode labels', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'signupMode', oldSignupMode: 'DefaultPresent', newSignupMode: 'Signup' },
      }));

      expect(transloco.translate).toHaveBeenCalledWith('guildSettings.branches.signupMode.defaultPresent');
      expect(transloco.translate).toHaveBeenCalledWith('guildSettings.branches.signupMode.signup');
      expect(changes[0].summary).toBe('guildSettings.branches.signupMode.defaultPresent → guildSettings.branches.signupMode.signup');
    });

    it('shows an em dash for the signup mode field when oldSignupMode is missing (first-time configuration)', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'signupMode', newSignupMode: 'DefaultPresent' },
      }));

      expect(changes[0].summary).toBe('— → guildSettings.branches.signupMode.defaultPresent');
    });

    it('builds a role change with resolved name and color for minRosterRoleId', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: {
          changedFields: 'minRosterRoleId',
          oldMinRosterRoleName: 'Officiers', oldMinRosterRoleColor: '16711680',
          newMinRosterRoleName: 'Raiders',
        },
      }));

      expect(changes[0].roleChange).toEqual({
        old: { name: 'Officiers', color: '#ff0000', iconUrl: null },
        new: { name: 'Raiders', color: null, iconUrl: null },
      });
      expect(changes[0].summary).toBe('Officiers → Raiders');
    });

    it('treats an unresolved role (bot not in guild) as null rather than failing', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'minRosterRoleId' },
      }));

      expect(changes[0].roleChange).toEqual({ old: null, new: null });
      expect(changes[0].summary).toBe('— → —');
    });

    it('builds a role change with resolved name and color for minOfficerRoleId', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: {
          changedFields: 'minOfficerRoleId',
          oldMinOfficerRoleName: 'Officiers', oldMinOfficerRoleColor: '16711680',
          newMinOfficerRoleName: 'Raiders',
        },
      }));

      expect(changes[0].roleChange).toEqual({
        old: { name: 'Officiers', color: '#ff0000', iconUrl: null },
        new: { name: 'Raiders', color: null, iconUrl: null },
      });
      expect(changes[0].summary).toBe('Officiers → Raiders');
    });

    it('treats an unresolved officer role (bot not in guild) as null rather than failing', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'minOfficerRoleId' },
      }));

      expect(changes[0].roleChange).toEqual({ old: null, new: null });
      expect(changes[0].summary).toBe('— → —');
    });

    it('returns one entry per field, in changedFields order', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: {
          changedFields: 'timezone,rosterMode',
          oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London',
          oldRosterMode: 'Open', newRosterMode: 'Open',
        },
      }));

      expect(changes.map((c) => c.labelKey)).toEqual([
        'auditLog.settingsFields.timezone',
        'auditLog.settingsFields.rosterMode',
      ]);
    });

    it('ignores an unrecognized field name in changedFields', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'someFutureField' },
      }));

      expect(changes).toEqual([]);
    });

    it('returns nothing for legacy NotificationSettingsUpdated entries that predate changedEvents', () => {
      const component = setup();

      expect(component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: { eventCount: '3' },
      }))).toEqual([]);
    });

    it('returns nothing for legacy NotificationSettingsReset entries that predate changedEvents', () => {
      const component = setup();

      expect(component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsReset,
        variables: { guildBranchId: '7', eventType: 'AbsenceAdded' },
      }))).toEqual([]);
    });

    it('builds a notification event change for NotificationSettingsUpdated, from Off to a channel', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: {
          changedEvents: 'AbsenceAdded',
          oldAbsenceAddedEnabled: 'false',
          newAbsenceAddedEnabled: 'true',
          newAbsenceAddedChannelName: 'general',
        },
      }));

      expect(changes).toEqual([{
        labelKey: 'guildSettings.notificationSettings.events.AbsenceAdded',
        summary: 'auditLog.notificationOff → general',
      }]);
    });

    it('builds a notification event change for NotificationSettingsUpdated, from a channel to Off', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: {
          changedEvents: 'AbsenceRemoved',
          oldAbsenceRemovedEnabled: 'true',
          oldAbsenceRemovedChannelName: 'mod-log',
          newAbsenceRemovedEnabled: 'false',
        },
      }));

      expect(changes).toEqual([{
        labelKey: 'guildSettings.notificationSettings.events.AbsenceRemoved',
        summary: 'mod-log → auditLog.notificationOff',
      }]);
    });

    it('builds a notification event change for a channel swap while staying enabled', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: {
          changedEvents: 'RaidPublished',
          oldRaidPublishedEnabled: 'true',
          oldRaidPublishedChannelName: 'general',
          newRaidPublishedEnabled: 'true',
          newRaidPublishedChannelName: 'raid-announce',
        },
      }));

      expect(changes[0].summary).toBe('general → raid-announce');
    });

    it('falls back to an em dash when a notification event is enabled but its channel name is unresolved', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: { changedEvents: 'AbsenceAdded', oldAbsenceAddedEnabled: 'true', newAbsenceAddedEnabled: 'true' },
      }));

      expect(changes[0].summary).toBe('— → —');
    });

    it('returns one entry per event, in changedEvents order', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: {
          changedEvents: 'AbsenceAdded,RaidPublished',
          oldAbsenceAddedEnabled: 'false', newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'general',
          oldRaidPublishedEnabled: 'true', oldRaidPublishedChannelName: 'raids', newRaidPublishedEnabled: 'false',
        },
      }));

      expect(changes.map((c) => c.labelKey)).toEqual([
        'guildSettings.notificationSettings.events.AbsenceAdded',
        'guildSettings.notificationSettings.events.RaidPublished',
      ]);
    });

    it('reads NotificationSettingsReset the same way, via changedEvents', () => {
      const component = setup();

      const changes = component.settingsFieldChanges(entry({
        actionType: GuildAuditAction.NotificationSettingsReset,
        variables: {
          changedEvents: 'AbsenceAdded',
          oldAbsenceAddedEnabled: 'true',
          oldAbsenceAddedChannelName: 'branch-log',
          newAbsenceAddedEnabled: 'true',
          newAbsenceAddedChannelName: 'guild-log',
        },
      }));

      expect(changes).toEqual([{
        labelKey: 'guildSettings.notificationSettings.events.AbsenceAdded',
        summary: 'branch-log → guild-log',
      }]);
    });
  });

  describe('changeSummary', () => {
    it('shows the guild name for GuildRegistered', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.GuildRegistered,
        variables: { guildName: 'Test Guild', guildIconHash: 'icon123' },
      }))).toBe('Test Guild');
    });

    it('falls back to an em dash for GuildRegistered when guildName is missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.GuildRegistered }))).toBe('—');
    });

    it.each([
      GuildAuditAction.BranchActivated,
      GuildAuditAction.BranchDeactivated,
      GuildAuditAction.BranchRosterSettingsUpdated,
      GuildAuditAction.BranchRegionUpdated,
    ])('shows the branch name for %s', (actionType) => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType,
        variables: { branchId: '3', branchName: 'Classic Era' },
      }))).toBe('Classic Era');
    });

    it.each([
      GuildAuditAction.BranchActivated,
      GuildAuditAction.BranchDeactivated,
      GuildAuditAction.BranchRosterSettingsUpdated,
      GuildAuditAction.BranchRegionUpdated,
    ])('falls back to an em dash for %s when branchName is missing', (actionType) => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType }))).toBe('—');
    });

    it('shows the plain character name for MemberJoined/MemberLeft/MemberExcluded', () => {
      const component = setup();

      for (const actionType of [GuildAuditAction.MemberJoined, GuildAuditAction.MemberLeft, GuildAuditAction.MemberExcluded]) {
        expect(component.changeSummary(entry({ actionType, variables: { characterName: 'Arthas' } }))).toBe('Arthas');
      }
    });

    it('shows the single field summary without a label prefix when only one setting changed', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'timezone', oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London' },
      }))).toBe('Europe/Paris → Europe/London');
    });

    it('joins multiple changed settings fields with a label prefix and separator', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: {
          changedFields: 'timezone,rosterMode',
          oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London',
          oldRosterMode: 'Open', newRosterMode: 'Open',
        },
      }))).toBe('auditLog.settingsFields.timezone: Europe/Paris → Europe/London · auditLog.settingsFields.rosterMode: guildSettings.branches.rosterMode.open → guildSettings.branches.rosterMode.open');
    });

    it('shows an em dash for SettingsUpdated when changedFields is absent (legacy entry)', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.SettingsUpdated }))).toBe('—');
    });

    it('builds the field summary for OfficerThresholdUpdated the same way as SettingsUpdated', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.OfficerThresholdUpdated,
        variables: {
          changedFields: 'minOfficerRoleId',
          oldMinOfficerRoleName: 'Officiers',
          newMinOfficerRoleName: 'Raiders',
        },
      }))).toBe('Officiers → Raiders');
    });

    it('shows the single event summary without a label prefix for NotificationSettingsUpdated', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: { changedEvents: 'AbsenceAdded', oldAbsenceAddedEnabled: 'false', newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'general' },
      }))).toBe('auditLog.notificationOff → general');
    });

    it('joins multiple changed notification events with a label prefix and separator', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: {
          changedEvents: 'AbsenceAdded,RaidPublished',
          oldAbsenceAddedEnabled: 'false', newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'general',
          oldRaidPublishedEnabled: 'true', oldRaidPublishedChannelName: 'raids', newRaidPublishedEnabled: 'false',
        },
      }))).toBe(
        'guildSettings.notificationSettings.events.AbsenceAdded: auditLog.notificationOff → general · ' +
        'guildSettings.notificationSettings.events.RaidPublished: raids → auditLog.notificationOff',
      );
    });

    it('shows the event summary for NotificationSettingsReset the same way as NotificationSettingsUpdated', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.NotificationSettingsReset,
        variables: {
          changedEvents: 'AbsenceAdded',
          oldAbsenceAddedEnabled: 'true', oldAbsenceAddedChannelName: 'branch-log',
          newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'guild-log',
        },
      }))).toBe('branch-log → guild-log');
    });

    it('shows an em dash for NotificationSettingsReset when nothing was actually overridden', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.NotificationSettingsReset }))).toBe('—');
    });

    it('shows the raw (untranslated) rank transition for MemberRankUpdated', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { characterName: 'Arthas', oldRank: 'Alt', newRank: 'Main' },
      }));

      expect(transloco.translate).not.toHaveBeenCalledWith('auditLog.rank.Alt');
      expect(result).toBe('Arthas : Alt → Main');
    });

    it('falls back to the character name for MemberRankUpdated when ranks are missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { characterName: 'Arthas' },
      }))).toBe('Arthas');
    });

    it('falls back to an em dash for MemberRankUpdated when characterName is also missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.MemberRankUpdated,
        variables: { oldRank: 'Alt', newRank: 'Main' },
      }))).toBe('—');
    });

    it('falls back to an em dash when no variables are present', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.GuildRegistered }))).toBe('—');
      expect(component.changeSummary(entry({ actionType: GuildAuditAction.MemberJoined }))).toBe('—');
    });

    it('falls back to an em dash for an availability exception missing startDate/endDate/status', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.AvailabilityExceptionDeclared }))).toBe('—');
    });

    it('falls back to the plain status word for a Partial exception with no time bounds set', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.AvailabilityExceptionDeclared,
        variables: { startDate: '2026-07-23', endDate: '2026-07-23', status: 'Partial' },
      }));

      expect(result).toBe(`${new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date('2026-07-23'))} : calendar.status.partial`);
    });

    it('falls back to an em dash for a recurring pattern entry missing cycleLengthDays', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.RecurringAvailabilityPatternCreated }))).toBe('—');
    });

    it('shows the date range and plain status for a non-Partial availability exception', () => {
      const component = setup();
      const expectedRange = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date('2026-07-23'));

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.AvailabilityExceptionDeclared,
        variables: { startDate: '2026-07-23', endDate: '2026-07-23', status: 'Absent' },
      }));

      expect(result).toBe(`${expectedRange} : calendar.status.absent`);
    });

    it('shows a date range spanning two formatted dates for a multi-day exception', () => {
      const component = setup();
      const start = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date('2026-07-23'));
      const end = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' }).format(new Date('2026-07-24'));

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.AvailabilityExceptionDeleted,
        variables: { startDate: '2026-07-23', endDate: '2026-07-24', status: 'Absent' },
      }));

      expect(result).toBe(`${start} – ${end} : calendar.status.absent`);
    });

    it('breaks a Partial exception down into late/early-leave wording instead of a bare "Partiel"', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.AvailabilityExceptionDeclared,
        variables: {
          startDate: '2026-07-23', endDate: '2026-07-23', status: 'Partial',
          availableFrom: '21:30:00', availableUntil: '',
        },
      }));

      expect(result).not.toContain('calendar.status.partial');
      expect(transloco.translate).toHaveBeenCalledWith('calendar.time.from', { time: '21h30' });
    });

    it('shows a bounded window for a Partial exception with both time bounds set', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.AvailabilityExceptionDeclared,
        variables: {
          startDate: '2026-07-23', endDate: '2026-07-23', status: 'Partial',
          availableFrom: '09:00:00', availableUntil: '17:00:00',
        },
      }));

      expect(result).toContain('9h00 – 17h00');
    });

    it('breaks a weekly recurring pattern down by weekday instead of a generic cycle count', () => {
      const component = setup();
      const monday = new Intl.DateTimeFormat('fr', { weekday: 'short' }).format(new Date(2026, 0, 5));

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternCreated,
        variables: {
          label: 'Soirées raid', cycleLengthDays: '7', anchorDate: '2026-01-05',
          days: JSON.stringify([{ offsetInCycle: 0, status: 'Absent', availableFrom: null, availableUntil: null }]),
        },
      }));

      expect(result).toBe(`Soirées raid — ${monday} : calendar.status.absent`);
    });

    it('labels each day "Jour N" (1-indexed) for a non-7-day shift rotation', () => {
      const component = setup();

      component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternUpdated,
        variables: {
          label: 'Rotation 5x8', cycleLengthDays: '10', anchorDate: '2026-01-05',
          days: JSON.stringify([{ offsetInCycle: 2, status: 'Absent', availableFrom: null, availableUntil: null }]),
        },
      }));

      expect(transloco.translate).toHaveBeenCalledWith('calendar.patternDialog.dayNumber', { n: 3 });
    });

    it('sorts multiple out-of-order days by offsetInCycle before rendering them', () => {
      const component = setup();

      component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternCreated,
        variables: {
          label: 'Rotation', cycleLengthDays: '10', anchorDate: '2026-01-05',
          days: JSON.stringify([
            { offsetInCycle: 4, status: 'Absent', availableFrom: null, availableUntil: null },
            { offsetInCycle: 1, status: 'Absent', availableFrom: null, availableUntil: null },
          ]),
        },
      }));

      const dayNumberCalls = transloco.translate.mock.calls
        .filter((call: unknown[]) => call[0] === 'calendar.patternDialog.dayNumber')
        .map((call: unknown[]) => (call[1] as { n: number }).n);
      expect(dayNumberCalls).toEqual([2, 5]); // offset 1 (n=2) rendered before offset 4 (n=5)
    });

    it('falls back to the plain cycle-length summary when the days JSON is malformed', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternCreated,
        variables: { label: 'Rotation', cycleLengthDays: '7', anchorDate: '2026-01-05', days: '{not valid json' },
      }));

      expect(result).toBe('Rotation (calendar.patternDialog.cycleSummary)');
    });

    it('falls back to the plain cycle-length summary when no per-day detail was logged (legacy entry)', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternStopped,
        variables: { label: 'Rotation 5x8', cycleLengthDays: '10' },
      }));

      expect(result).toBe('Rotation 5x8 (calendar.patternDialog.cycleSummary)');
    });

    it('falls back to the "unnamed" label when a pattern entry has no label', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RecurringAvailabilityPatternStopped,
        variables: { label: '', cycleLengthDays: '7' },
      }));

      expect(result).toBe('calendar.patternDialog.unnamed (calendar.patternDialog.cycleSummary)');
    });

    it.each([
      GuildAuditAction.RaidSeriesCreated,
      GuildAuditAction.RaidSeriesUpdated,
      GuildAuditAction.RaidSeriesDeactivated,
    ])('shows the event name for %s', (actionType) => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType, variables: { eventName: 'Split 1' } }))).toBe('Split 1');
    });

    it.each([
      GuildAuditAction.RaidSeriesCreated,
      GuildAuditAction.RaidSeriesUpdated,
      GuildAuditAction.RaidSeriesDeactivated,
    ])('falls back to an em dash for %s when eventName is missing', (actionType) => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType }))).toBe('—');
    });

    it.each([
      GuildAuditAction.RaidEventCreated,
      GuildAuditAction.RaidEventDeleted,
      GuildAuditAction.RaidEventPublished,
    ])('shows event name, guild-local time and zone names for %s', (actionType) => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType,
        variables: { eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00', raidZoneNames: 'Serpentshrine Cavern, Tempest Keep' },
      }));

      expect(result).toBe('Split 1 — 05/08/2026 20:00 · Serpentshrine Cavern, Tempest Keep');
    });

    it('shows just the event name when startsAtLocal/raidZoneNames are absent (RaidEventCreated)', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventCreated,
        variables: { eventName: 'Split 1' },
      }))).toBe('Split 1');
    });

    it('falls back to an em dash for RaidEventPublished when eventName is missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.RaidEventPublished }))).toBe('—');
    });

    it('defaults to midnight when startsAtLocal carries no time part (date only)', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventCreated,
        variables: { eventName: 'Split 1', startsAtLocal: '2026-08-05' },
      }));

      expect(result).toBe('Split 1 — 05/08/2026 00:00');
    });

    it('shows only the date diff for RaidEventUpdated when only the time changed', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventUpdated,
        variables: {
          eventName: 'Split 1',
          oldStartsAtLocal: '2026-08-05 20:00', newStartsAtLocal: '2026-08-05 21:00',
          oldRaidZoneNames: 'Serpentshrine Cavern', newRaidZoneNames: 'Serpentshrine Cavern',
        },
      }));

      expect(result).toBe('Split 1 — auditLog.raidEventFields.date : 05/08/2026 20:00 → 05/08/2026 21:00');
    });

    it('shows only the zone diff for RaidEventUpdated when only the target zones changed', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventUpdated,
        variables: {
          eventName: 'Split 1',
          oldStartsAtLocal: '2026-08-05 20:00', newStartsAtLocal: '2026-08-05 20:00',
          oldRaidZoneNames: 'Serpentshrine Cavern', newRaidZoneNames: 'Serpentshrine Cavern, Tempest Keep',
        },
      }));

      expect(result).toBe('Split 1 — auditLog.raidEventFields.raids : Serpentshrine Cavern → Serpentshrine Cavern, Tempest Keep');
    });

    it('joins both the date and zone diffs for RaidEventUpdated when both changed', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventUpdated,
        variables: {
          eventName: 'Split 1',
          oldStartsAtLocal: '2026-08-05 20:00', newStartsAtLocal: '2026-08-05 21:00',
          oldRaidZoneNames: 'Serpentshrine Cavern', newRaidZoneNames: 'Tempest Keep',
        },
      }));

      expect(result).toBe(
        'Split 1 — auditLog.raidEventFields.date : 05/08/2026 20:00 → 05/08/2026 21:00 · auditLog.raidEventFields.raids : Serpentshrine Cavern → Tempest Keep',
      );
    });

    it('shows just the event name for RaidEventUpdated when neither date nor zones actually changed (grid-size-only edit)', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.RaidEventUpdated,
        variables: {
          eventName: 'Split 1',
          oldStartsAtLocal: '2026-08-05 20:00', newStartsAtLocal: '2026-08-05 20:00',
          oldRaidZoneNames: 'Serpentshrine Cavern', newRaidZoneNames: 'Serpentshrine Cavern',
        },
      }));

      expect(result).toBe('Split 1');
    });

    it('falls back to an em dash for RaidEventUpdated when eventName is missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.RaidEventUpdated }))).toBe('—');
    });

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'shows character, (group-slot) and event context for %s',
      (actionType) => {
        const component = setup();

        const result = component.changeSummary(entry({
          actionType,
          variables: { characterName: 'Arthas', groupNumber: '2', slotNumber: '3', eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00' },
        }));

        expect(result).toBe('Arthas (2-3) — Split 1 · 05/08/2026 20:00');
      },
    );

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'falls back to an em dash for %s when characterName is missing',
      (actionType) => {
        const component = setup();

        expect(component.changeSummary(entry({ actionType }))).toBe('—');
      },
    );

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'omits the (group-slot) coordinate for %s when groupNumber/slotNumber are missing',
      (actionType) => {
        const component = setup();

        const result = component.changeSummary(entry({
          actionType,
          variables: { characterName: 'Arthas', eventName: 'Split 1' },
        }));

        expect(result).toBe('Arthas — Split 1');
      },
    );

    it.each([GuildAuditAction.SlotAssigned, GuildAuditAction.SlotUnassigned])(
      'shows just the character name for %s when neither the coordinate nor the event name are present',
      (actionType) => {
        const component = setup();

        const result = component.changeSummary(entry({
          actionType,
          variables: { characterName: 'Arthas' },
        }));

        expect(result).toBe('Arthas');
      },
    );

    it('shows character with old/new spec and event context for SlotAssignmentSpecChanged', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.SlotAssignmentSpecChanged,
        variables: { characterName: 'Arthas', oldSpecName: 'Blood', newSpecName: 'Frost', eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00' },
      }));

      expect(result).toBe('Arthas : Blood → Frost — Split 1 · 05/08/2026 20:00');
    });

    it('falls back to an em dash for SlotAssignmentSpecChanged when characterName is missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({ actionType: GuildAuditAction.SlotAssignmentSpecChanged }))).toBe('—');
    });

    it('omits the spec transition for SlotAssignmentSpecChanged when oldSpecName/newSpecName are missing', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.SlotAssignmentSpecChanged,
        variables: { characterName: 'Arthas', eventName: 'Split 1' },
      }));

      expect(result).toBe('Arthas — Split 1');
    });

    it('shows both characters, coordinates and event context for SlotsSwapped', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: {
          characterAName: 'Arthas', groupNumberA: '1', slotNumberA: '3',
          characterBName: 'Jaina', groupNumberB: '2', slotNumberB: '1',
          eventName: 'Split 1', startsAtLocal: '2026-08-05 20:00',
        },
      }));

      expect(result).toBe('Arthas (1-3) ↔ Jaina (2-1) — Split 1 · 05/08/2026 20:00');
    });

    it('falls back to an em dash for SlotsSwapped when either character name is missing', () => {
      const component = setup();

      expect(component.changeSummary(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: { characterAName: 'Arthas' },
      }))).toBe('—');
    });

    it('omits both (group-slot) coordinates for SlotsSwapped when they are missing', () => {
      const component = setup();

      const result = component.changeSummary(entry({
        actionType: GuildAuditAction.SlotsSwapped,
        variables: { characterAName: 'Arthas', characterBName: 'Jaina', eventName: 'Split 1' },
      }));

      expect(result).toBe('Arthas ↔ Jaina — Split 1');
    });
  });

  describe('actionLabel / categoryLabel / tableActionLabel', () => {
    it('actionLabel translates the action label key', () => {
      const component = setup();

      const label = component.actionLabel(GuildAuditAction.MemberLeft);

      expect(transloco.translate).toHaveBeenCalledWith('auditLog.actionLabels.MemberLeft');
      expect(label).toBe('auditLog.actionLabels.MemberLeft');
    });

    it('categoryLabel translates the category key', () => {
      const component = setup();

      const label = component.categoryLabel(GuildAuditCategory.Roster);

      expect(transloco.translate).toHaveBeenCalledWith('auditLog.categories.Roster');
      expect(label).toBe('auditLog.categories.Roster');
    });

    it('tableActionLabel shows the specific field name when exactly one setting changed', () => {
      const component = setup();

      const label = component.tableActionLabel(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: { changedFields: 'timezone', oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London' },
      }));

      expect(label).toBe('auditLog.settingsFields.timezone');
    });

    it('tableActionLabel falls back to the generic action label when several settings changed', () => {
      const component = setup();

      const label = component.tableActionLabel(entry({
        actionType: GuildAuditAction.SettingsUpdated,
        variables: {
          changedFields: 'timezone,rosterMode',
          oldTimezone: 'Europe/Paris', newTimezone: 'Europe/London',
          oldRosterMode: 'Open', newRosterMode: 'Open',
        },
      }));

      expect(label).toBe('auditLog.actionLabels.SettingsUpdated');
    });

    it('tableActionLabel falls back to the generic action label for non-SettingsUpdated entries', () => {
      const component = setup();

      const label = component.tableActionLabel(entry({ actionType: GuildAuditAction.MemberJoined }));

      expect(label).toBe('auditLog.actionLabels.MemberJoined');
    });

    it('tableActionLabel shows the specific event name when exactly one notification event changed', () => {
      const component = setup();

      const label = component.tableActionLabel(entry({
        actionType: GuildAuditAction.NotificationSettingsUpdated,
        variables: { changedEvents: 'AbsenceAdded', oldAbsenceAddedEnabled: 'false', newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'general' },
      }));

      expect(label).toBe('guildSettings.notificationSettings.events.AbsenceAdded');
    });

    it('tableActionLabel keeps the generic "reset" label for NotificationSettingsReset, even with detail available', () => {
      const component = setup();

      const label = component.tableActionLabel(entry({
        actionType: GuildAuditAction.NotificationSettingsReset,
        variables: {
          changedEvents: 'AbsenceAdded',
          oldAbsenceAddedEnabled: 'true', oldAbsenceAddedChannelName: 'branch-log',
          newAbsenceAddedEnabled: 'true', newAbsenceAddedChannelName: 'guild-log',
        },
      }));

      expect(label).toBe('auditLog.actionLabels.NotificationSettingsReset');
    });
  });
});
