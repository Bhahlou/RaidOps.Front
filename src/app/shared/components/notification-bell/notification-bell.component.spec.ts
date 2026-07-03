import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { NotificationBellComponent } from './notification-bell.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { Notification, NotificationType } from '../../../core/models/notification.model';

const notification = (overrides?: Partial<Notification>): Notification => ({
  type: NotificationType.OfficerThresholdNotConfigured,
  guildId: 'guild-1',
  guildName: 'RaidOps',
  ...overrides,
});

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let component: NotificationBellComponent;
  let dismissNotification: ReturnType<typeof vi.fn>;

  const setup = (notifications: Notification[]) => {
    dismissNotification = vi.fn().mockReturnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        {
          provide: AuthStore,
          useValue: { notifications: signal(notifications), dismissNotification },
        },
      ],
    }).overrideComponent(NotificationBellComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  // ── visibleNotifications ──────────────────────────────────────────────────

  describe('visibleNotifications', () => {
    it('returns notifications of a known type', () => {
      const n = notification();
      setup([n]);

      expect(component.visibleNotifications()).toEqual([n]);
    });

    it('drops notifications of an unrecognized type', () => {
      setup([notification({ type: 'SomeRemovedType' as NotificationType })]);

      expect(component.visibleNotifications()).toEqual([]);
    });
  });

  // ── count ─────────────────────────────────────────────────────────────────

  describe('count', () => {
    it('is 0 when there are no visible notifications', () => {
      setup([]);

      expect(component.count()).toBe(0);
    });

    it('matches the number of visible (known-type) notifications', () => {
      setup([notification({ guildId: 'g1' }), notification({ guildId: 'g2' })]);

      expect(component.count()).toBe(2);
    });

    it('excludes unrecognized-type notifications from the count', () => {
      setup([notification(), notification({ type: 'SomeRemovedType' as NotificationType })]);

      expect(component.count()).toBe(1);
    });
  });

  // ── onDismiss ─────────────────────────────────────────────────────────────

  describe('onDismiss', () => {
    it('dismisses the notification via the store', () => {
      setup([]);
      const n = notification();

      component.onDismiss(n);

      expect(dismissNotification).toHaveBeenCalledWith(n.type, n.guildId);
    });
  });
});
