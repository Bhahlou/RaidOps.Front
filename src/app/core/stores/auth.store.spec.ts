import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../models/notification.model';
import { User } from '../models/user.model';

const SESSION_KEY = 'raidops_user';

const mockUser: User = {
  discordId: '123',
  name: 'TestUser',
  avatarHash: null,
  guilds: [],
  notifications: [],
};

describe('AuthStore', () => {
  let getMe: ReturnType<typeof vi.fn>;
  let refresh: ReturnType<typeof vi.fn>;
  let logout: ReturnType<typeof vi.fn>;
  let dismiss: ReturnType<typeof vi.fn>;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getMe, refresh, logout } },
        { provide: NotificationService, useValue: { dismiss } },
      ],
    });
    return TestBed.inject(AuthStore);
  };

  beforeEach(() => {
    sessionStorage.clear();
    getMe = vi.fn().mockReturnValue(of(mockUser));
    refresh = vi.fn().mockReturnValue(of(undefined));
    logout = vi.fn().mockReturnValue(of(undefined));
    dismiss = vi.fn().mockReturnValue(of(undefined));
  });

  // ── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('starts with user=null when sessionStorage is empty', () => {
      const store = setup();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
    });

    it('restores user from sessionStorage when valid JSON is stored', () => {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));

      const store = setup();

      expect(store.user()).toEqual(mockUser);
      expect(store.isAuthenticated()).toBe(true);
    });

    it('clears sessionStorage when stored value is not valid JSON', () => {
      sessionStorage.setItem(SESSION_KEY, 'not-json{{{');

      const store = setup();

      expect(store.user()).toBeNull();
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  // ── loadUser ──────────────────────────────────────────────────────────────

  describe('loadUser', () => {
    it('updates the user signal and persists to sessionStorage on success', () => {
      const store = setup();

      store.loadUser().subscribe();

      expect(store.user()).toEqual(mockUser);
      expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!)).toEqual(mockUser);
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
    it('clears the user signal and sessionStorage on success', () => {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
      const store = setup();

      store.logout().subscribe();

      expect(store.user()).toBeNull();
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  // ── notifications ─────────────────────────────────────────────────────────

  describe('notifications', () => {
    it('is empty when there is no user', () => {
      const store = setup();

      expect(store.notifications()).toEqual([]);
    });

    it('reflects the current user notifications', () => {
      const notification = { type: NotificationType.OfficerThresholdNotConfigured, guildId: 'g1', guildName: 'RaidOps' };
      getMe.mockReturnValue(of({ ...mockUser, notifications: [notification] }));
      const store = setup();

      store.loadUser().subscribe();

      expect(store.notifications()).toEqual([notification]);
    });
  });

  // ── dismissNotification ───────────────────────────────────────────────────

  describe('dismissNotification', () => {
    const notificationA = { type: NotificationType.OfficerThresholdNotConfigured, guildId: 'g1', guildName: 'Guild A' };
    const notificationB = { type: NotificationType.OfficerThresholdNotConfigured, guildId: 'g2', guildName: 'Guild B' };

    it('calls NotificationService.dismiss with the type and guildId', () => {
      const store = setup();
      store.loadUser().subscribe();

      store.dismissNotification(NotificationType.OfficerThresholdNotConfigured, 'g1').subscribe();

      expect(dismiss).toHaveBeenCalledWith(NotificationType.OfficerThresholdNotConfigured, 'g1');
    });

    it('removes only the matching notification from the user signal and sessionStorage', () => {
      getMe.mockReturnValue(of({ ...mockUser, notifications: [notificationA, notificationB] }));
      const store = setup();
      store.loadUser().subscribe();

      store.dismissNotification(NotificationType.OfficerThresholdNotConfigured, 'g1').subscribe();

      expect(store.notifications()).toEqual([notificationB]);
      expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).notifications).toEqual([notificationB]);
    });

    it('does nothing when there is no user', () => {
      const store = setup();

      store.dismissNotification(NotificationType.OfficerThresholdNotConfigured, 'g1').subscribe();

      expect(store.user()).toBeNull();
    });
  });
});
