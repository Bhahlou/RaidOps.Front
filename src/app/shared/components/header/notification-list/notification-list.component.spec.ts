import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationListComponent } from './notification-list.component';
import { Notification, NotificationType } from '../../../../core/models/notification.model';

const notification = (overrides?: Partial<Notification>): Notification => ({
  type: NotificationType.OfficerThresholdNotConfigured,
  guildId: 'guild-1',
  guildName: 'RaidOps',
  ...overrides,
});

describe('NotificationListComponent', () => {
  let fixture: ComponentFixture<NotificationListComponent>;
  let component: NotificationListComponent;

  const setup = (notifications: Notification[] = []) => {
    TestBed.configureTestingModule({
      imports: [NotificationListComponent],
    }).overrideComponent(NotificationListComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(NotificationListComponent);
    fixture.componentRef.setInput('notifications', notifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  // ── messageKey ────────────────────────────────────────────────────────────

  describe('messageKey', () => {
    it('returns the i18n key for a known notification type', () => {
      setup();

      expect(component.messageKey(notification())).toBe('notifications.officerThresholdNotConfigured');
    });
  });

  // ── link ──────────────────────────────────────────────────────────────────

  describe('link', () => {
    it('builds the guild settings route for OfficerThresholdNotConfigured', () => {
      setup();

      expect(component.link(notification({ guildId: 'g42' }))).toEqual(['/guilds', 'g42', 'settings']);
    });
  });

  // ── dismiss ───────────────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('emits the dismissed notification', () => {
      setup();
      const n = notification();
      const spy = vi.spyOn(component.dismissed, 'emit');

      component.dismiss(n);

      expect(spy).toHaveBeenCalledWith(n);
    });
  });
});
