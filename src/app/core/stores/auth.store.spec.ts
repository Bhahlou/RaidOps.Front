import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { AuthStore } from './auth.store';
import { AuthHubService } from '../services/auth-hub.service';
import { AuthService } from '../services/auth.service';
import { ChangelogService } from '../services/changelog.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';

const STORAGE_KEY = 'raidops_user';

const mockUser: User = {
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds: [],
  notifications: [],
  seenChangelogEntryIds: [],
};

describe('AuthStore', () => {
  let getMe: ReturnType<typeof vi.fn>;
  let refresh: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let dismiss: ReturnType<typeof vi.fn>;
  let markSeen: ReturnType<typeof vi.fn>;
  let hubStart: ReturnType<typeof vi.fn>;
  let hubStop: ReturnType<typeof vi.fn>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getMe, refresh, logout } },
        { provide: AuthHubService, useValue: { start: hubStart, stop: hubStop } },
        { provide: NotificationService, useValue: { dismiss } },
        { provide: ChangelogService, useValue: { markSeen } },
      ],
    });
    return TestBed.inject(AuthStore);
  };

  beforeEach(() => {
    localStorage.clear();
    getMe = vi.fn().mockReturnValue(of(mockUser));
    refresh = vi.fn().mockReturnValue(of(undefined));
    logout = vi.fn().mockReturnValue(of(undefined));
    dismiss = vi.fn().mockReturnValue(of(undefined));
    markSeen = vi.fn().mockReturnValue(of(undefined));
    hubStart = vi.fn();
    hubStop = vi.fn();
  });

  // ── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('starts with user=null when localStorage is empty', () => {
      const store = setup();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
    });

    it('restores user from localStorage when valid JSON is stored', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      const store = setup();

      expect(store.user()).toEqual(mockUser);
      expect(store.isAuthenticated()).toBe(true);
    });

    it('clears localStorage when stored value is not valid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json{{{');

      const store = setup();

      expect(store.user()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('persists across a new session — a fresh instance restores the user cached by a previous one', () => {
      const firstSessionStore = setup();
      firstSessionStore.loadUser().subscribe();

      // Simulate the browser being closed and reopened: sessionStorage would be wiped, but
      // localStorage — and a brand new AuthStore instance reading from it — is not.
      TestBed.resetTestingModule();
      const secondSessionStore = setup();

      expect(secondSessionStore.user()).toEqual(mockUser);
      expect(secondSessionStore.isAuthenticated()).toBe(true);
    });
  });

  // ── loadUser ──────────────────────────────────────────────────────────────

  describe('loadUser', () => {
    it('updates the user signal and persists to localStorage on success', () => {
      const store = setup();

      store.loadUser().subscribe();

      expect(store.user()).toEqual(mockUser);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(mockUser);
    });

    it('propagates errors without updating state', () => {
      getMe.mockReturnValue(throwError(() => new Error('network')));
      const store = setup();

      let caught = false;
      store.loadUser().subscribe({ error: () => { caught = true; } });

      expect(caught).toBe(true);
      expect(store.user()).toBeNull();
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('calls AuthService.refresh and completes', () => {
      const store = setup();
      let completed = false;

      store.refresh().subscribe({ complete: () => { completed = true; } });

      expect(refresh).toHaveBeenCalledOnce();
      expect(completed).toBe(true);
    });

    it('deduplicates concurrent calls — returns the same observable', () => {
      const subject = new Subject<void>();
      refresh.mockReturnValue(subject.asObservable());
      const store = setup();

      const first = store.refresh();
      const second = store.refresh();

      expect(first).toBe(second);
      expect(refresh).toHaveBeenCalledOnce();
    });

    it('resets the cached observable after success so the next call hits the server again', () => {
      const store = setup();

      store.refresh().subscribe();
      store.refresh().subscribe();

      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('resets the cached observable after an error', () => {
      refresh.mockReturnValue(throwError(() => new Error('fail')));
      const store = setup();

      store.refresh().subscribe({ error: () => {} });
      store.refresh().subscribe({ error: () => {} });

      expect(refresh).toHaveBeenCalledTimes(2);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the user signal and localStorage on success', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      const store = setup();

      store.logout().subscribe();

      expect(store.user()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  // ── auth hub lifecycle ────────────────────────────────────────────────────

  describe('auth hub lifecycle', () => {
    it('does not start the hub when localStorage is empty', () => {
      setup();

      expect(hubStart).not.toHaveBeenCalled();
    });

    it('starts the hub when restoring a cached user from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));

      setup();

      expect(hubStart).toHaveBeenCalledOnce();
    });

    it('starts the hub after loadUser succeeds', () => {
      const store = setup();

      store.loadUser().subscribe();

      expect(hubStart).toHaveBeenCalledOnce();
    });

    it('starts the hub after refresh succeeds', () => {
      const store = setup();

      store.refresh().subscribe();

      expect(hubStart).toHaveBeenCalledOnce();
    });

    it('stops the hub on logout', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      const store = setup();

      store.logout().subscribe();

      expect(hubStop).toHaveBeenCalledOnce();
    });

    it('reacts to a hub push by refreshing the token then reloading the user', () => {
      const store = setup();
      store.loadUser().subscribe();
      const onDiscordDataChanged = hubStart.mock.calls.at(-1)![0] as () => void;
      refresh.mockClear();
      getMe.mockClear();

      onDiscordDataChanged();

      expect(refresh).toHaveBeenCalledOnce();
      expect(getMe).toHaveBeenCalledOnce();
    });

    it('does not reload the user if the push-triggered refresh fails', () => {
      const store = setup();
      store.loadUser().subscribe();
      const onDiscordDataChanged = hubStart.mock.calls.at(-1)![0] as () => void;
      refresh.mockReturnValue(throwError(() => new Error('refresh failed')));
      getMe.mockClear();

      onDiscordDataChanged();

      expect(getMe).not.toHaveBeenCalled();
    });
  });

  // ── notifications ─────────────────────────────────────────────────────────

  describe('notifications', () => {
    it('is empty when there is no user', () => {
      const store = setup();

      expect(store.notifications()).toEqual([]);
    });

    it('reflects the current user notifications', () => {
      const notification = { type: NotificationType.BranchOfficerRolesNotConfigured, guildId: 'g1', guildName: 'RaidOps' };
      getMe.mockReturnValue(of({ ...mockUser, notifications: [notification] }));
      const store = setup();

      store.loadUser().subscribe();

      expect(store.notifications()).toEqual([notification]);
    });
  });

  // ── dismissNotification ───────────────────────────────────────────────────

  describe('dismissNotification', () => {
    const notificationA = { type: NotificationType.BranchOfficerRolesNotConfigured, guildId: 'g1', guildName: 'Guild A' };
    const notificationB = { type: NotificationType.BranchOfficerRolesNotConfigured, guildId: 'g2', guildName: 'Guild B' };

    it('calls NotificationService.dismiss with the type and guildId', () => {
      const store = setup();
      store.loadUser().subscribe();

      store.dismissNotification(NotificationType.BranchOfficerRolesNotConfigured, 'g1').subscribe();

      expect(dismiss).toHaveBeenCalledWith(NotificationType.BranchOfficerRolesNotConfigured, 'g1');
    });

    it('removes only the matching notification from the user signal and localStorage', () => {
      getMe.mockReturnValue(of({ ...mockUser, notifications: [notificationA, notificationB] }));
      const store = setup();
      store.loadUser().subscribe();

      store.dismissNotification(NotificationType.BranchOfficerRolesNotConfigured, 'g1').subscribe();

      expect(store.notifications()).toEqual([notificationB]);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).notifications).toEqual([notificationB]);
    });

    it('does nothing when there is no user', () => {
      const store = setup();

      store.dismissNotification(NotificationType.BranchOfficerRolesNotConfigured, 'g1').subscribe();

      expect(store.user()).toBeNull();
    });
  });

  // ── markChangelogSeen ─────────────────────────────────────────────────────

  describe('markChangelogSeen', () => {
    it('calls ChangelogService.markSeen with the entry ids', () => {
      const store = setup();
      store.loadUser().subscribe();

      store.markChangelogSeen(['entry-1']).subscribe();

      expect(markSeen).toHaveBeenCalledWith(['entry-1']);
    });

    it('merges the new ids into the user signal and localStorage', () => {
      getMe.mockReturnValue(of({ ...mockUser, seenChangelogEntryIds: ['entry-1'] }));
      const store = setup();
      store.loadUser().subscribe();

      store.markChangelogSeen(['entry-2']).subscribe();

      expect(store.user()!.seenChangelogEntryIds).toEqual(['entry-1', 'entry-2']);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).seenChangelogEntryIds).toEqual(['entry-1', 'entry-2']);
    });

    it('deduplicates ids already recorded as seen', () => {
      getMe.mockReturnValue(of({ ...mockUser, seenChangelogEntryIds: ['entry-1'] }));
      const store = setup();
      store.loadUser().subscribe();

      store.markChangelogSeen(['entry-1', 'entry-2']).subscribe();

      expect(store.user()!.seenChangelogEntryIds).toEqual(['entry-1', 'entry-2']);
    });

    it('does nothing when there is no user', () => {
      const store = setup();

      store.markChangelogSeen(['entry-1']).subscribe();

      expect(store.user()).toBeNull();
    });
  });
});
