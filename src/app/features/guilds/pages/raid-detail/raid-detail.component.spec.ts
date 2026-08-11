import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { RaidDetailComponent } from './raid-detail.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { RaidsService } from '../../services/raids.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GuildAccessLevel } from '../../../../core/models/guild-access-level.enum';
import { User } from '../../../../core/models/user.model';
import { RaidEventSummary } from '../../models/raid-event.model';

const userGuild = (accessLevel: GuildAccessLevel) => ({
  id: 'g1',
  name: 'Dah Boo',
  iconHash: null,
  isRegistered: true,
  isConfigured: true,
  isAdmin: false,
  accessLevel,
  branches: [{ id: 7, branchId: 3, branchName: 'Classic Anniversary', accessLevel, hasActiveCharacter: true }],
});

const fakeUser = (accessLevel: GuildAccessLevel = GuildAccessLevel.Officer): User => ({
  discordId: 'player-1',
  name: 'Dah Boo',
  avatarHash: null,
  guilds: [userGuild(accessLevel)],
  notifications: [],
  seenChangelogEntryIds: [],
});

describe('RaidDetailComponent', () => {
  let raidsService: { getEventSummary: ReturnType<typeof vi.fn>; announceGrouping: ReturnType<typeof vi.fn> };
  let snackbar: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  const setup = (opts?: { user?: User | null; summary?: RaidEventSummary | null; guildId?: string | null; branchId?: number; eventId?: number }) => {
    const summary: RaidEventSummary | null = opts?.summary === undefined ? { id: 11, name: 'Split 1' } : opts.summary;
    raidsService = {
      getEventSummary: vi.fn().mockReturnValue(summary ? of(summary) : throwError(() => new Error('not found'))),
      announceGrouping: vi.fn().mockReturnValue(of(undefined)),
    };
    snackbar = { success: vi.fn(), error: vi.fn() };
    dialog = { open: vi.fn().mockReturnValue({ closed: of(false) }) };

    const guildId = opts?.guildId === undefined ? 'g1' : opts.guildId;
    const branchId = opts?.branchId ?? 7;
    const eventId = opts?.eventId ?? 11;

    TestBed.configureTestingModule({
      imports: [RaidDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'branchId' ? String(branchId) : key === 'eventId' ? String(eventId) : guildId),
              },
            },
            paramMap: of(convertToParamMap({ id: guildId ?? '', branchId: String(branchId), eventId: String(eventId) })),
            parent: {
              snapshot: { paramMap: { get: () => guildId } },
              paramMap: of(convertToParamMap(guildId ? { id: guildId } : {})),
            },
          },
        },
        { provide: AuthStore, useValue: { user: signal(opts?.user === undefined ? fakeUser() : opts.user) } },
        { provide: RaidsService, useValue: raidsService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Dialog, useValue: dialog },
      ],
    }).overrideComponent(RaidDetailComponent, { set: { template: '', imports: [] } });

    return TestBed.createComponent(RaidDetailComponent).componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('reads eventId from the route', () => {
    expect(setup({ eventId: 42 }).eventId).toBe(42);
  });

  // ── constructor / raidName ────────────────────────────────────────────────

  describe('raidName', () => {
    it('fetches the event summary and sets raidName', () => {
      const component = setup({ summary: { id: 11, name: 'Split 1' } });

      expect(raidsService.getEventSummary).toHaveBeenCalledWith('g1', 7, 11);
      expect(component.raidName()).toBe('Split 1');
    });

    it('leaves raidName null when the fetch fails', () => {
      const component = setup({ summary: null });

      expect(component.raidName()).toBeNull();
    });
  });

  // ── breadcrumbs ───────────────────────────────────────────────────────────

  describe('breadcrumbs', () => {
    it('uses the raid name as the leaf label once loaded', () => {
      const component = setup({ summary: { id: 11, name: 'Split 1' } });

      expect(component.breadcrumbs().at(-1)).toEqual({ label: 'Split 1' });
    });

    it('falls back to the generic breadcrumb key while the name is not yet loaded', () => {
      const component = setup({ summary: null });

      expect(component.breadcrumbs().at(-1)).toEqual({ i18nKey: 'raidBuilder.detail.breadcrumb' });
    });

    it('links the raid-builder crumb to the branch\'s raids page', () => {
      const component = setup({ guildId: 'g1', branchId: 7 });

      expect(component.breadcrumbs()[1]).toEqual({ i18nKey: 'sidenav.guild.raidBuilder', link: ['/guilds', 'g1', '7', 'raids'] });
    });
  });

  // ── isOfficer ─────────────────────────────────────────────────────────────

  describe('isOfficer', () => {
    it('is false with no authenticated user', () => {
      expect(setup({ user: null }).isOfficer()).toBe(false);
    });

    it('is false for a Roster-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Roster) }).isOfficer()).toBe(false);
    });

    it('is true for an Officer-level member', () => {
      expect(setup({ user: fakeUser(GuildAccessLevel.Officer) }).isOfficer()).toBe(true);
    });
  });

  // ── triggerGrouping ───────────────────────────────────────────────────────

  describe('triggerGrouping', () => {
    it('announces grouping and shows a success snackbar', async () => {
      const component = setup();

      await component.triggerGrouping();

      expect(raidsService.announceGrouping).toHaveBeenCalledWith('g1', 7, 11);
      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.detail.groupingSent');
      expect(component.triggeringGrouping()).toBe(false);
    });

    it('opens the character-picker dialog when the requester has no character in the raid', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(dialog.open).toHaveBeenCalledWith(expect.anything(), {
        width: '420px',
        data: { guildId: 'g1', guildBranchId: 7, eventId: 11 },
      });
      expect(snackbar.error).not.toHaveBeenCalled();
    });

    it('shows a success snackbar when the character-picker dialog closes with a sent result', async () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(true) });
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.success).toHaveBeenCalledWith('raidBuilder.detail.groupingSent');
    });

    it('does not show a success snackbar when the character-picker dialog is cancelled', async () => {
      const component = setup();
      dialog.open.mockReturnValue({ closed: of(false) });
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidGroupingRequesterHasNoCharacter' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.success).not.toHaveBeenCalled();
    });

    it('shows a generic error snackbar for any other failure', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { error: 'RaidEventNotPublished' } })),
      );

      await component.triggerGrouping();

      expect(snackbar.error).toHaveBeenCalledWith('raidBuilder.detail.groupingFailed');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('resets triggeringGrouping in the finally block on failure', async () => {
      const component = setup();
      raidsService.announceGrouping.mockReturnValue(throwError(() => new HttpErrorResponse({ error: null })));

      await component.triggerGrouping();

      expect(component.triggeringGrouping()).toBe(false);
    });
  });
});
