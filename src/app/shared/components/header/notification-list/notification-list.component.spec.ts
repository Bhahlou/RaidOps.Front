import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationListComponent } from './notification-list.component';
import { Notification, NotificationType } from '../../../../core/models/notification.model';

const notification = (overrides?: Partial<Notification>): Notification => ({
  type: NotificationType.BranchOfficerRolesNotConfigured,
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

      expect(component.messageKey(notification())).toBe('notifications.branchOfficerRolesNotConfigured');
    });

    it('returns the i18n key for BranchRegionNotConfigured', () => {
      setup();

      expect(component.messageKey(notification({ type: NotificationType.BranchRegionNotConfigured }))).toBe('notifications.branchRegionNotConfigured');
    });

    it('returns the i18n key for RaidNotificationsNotConfigured', () => {
      setup();

      expect(component.messageKey(notification({ type: NotificationType.RaidNotificationsNotConfigured }))).toBe('notifications.raidNotificationsNotConfigured');
    });

    it('returns the i18n key for RaidCompositionNotificationsNotConfigured', () => {
      setup();

      expect(component.messageKey(notification({ type: NotificationType.RaidCompositionNotificationsNotConfigured }))).toBe('notifications.raidCompositionNotificationsNotConfigured');
    });
  });

  // ── link ──────────────────────────────────────────────────────────────────

  describe('link', () => {
    it('builds the guild roster settings route for BranchOfficerRolesNotConfigured', () => {
      setup();

      expect(component.link(notification({ guildId: 'g42' }))).toEqual(['/guilds', 'g42', 'settings', 'roster']);
    });

    it('builds the guild settings route for GuildLanguageNotConfigured', () => {
      setup();

      expect(component.link(notification({ type: NotificationType.GuildLanguageNotConfigured, guildId: 'g42' })))
        .toEqual(['/guilds', 'g42', 'settings']);
    });

    it('builds the guild notifications settings route for AbsenceNotificationsNotConfigured', () => {
      setup();

      expect(component.link(notification({ type: NotificationType.AbsenceNotificationsNotConfigured, guildId: 'g42' })))
        .toEqual(['/guilds', 'g42', 'settings', 'notifications']);
    });

    it('builds the guild general settings route for BranchRegionNotConfigured', () => {
      setup();

      expect(component.link(notification({ type: NotificationType.BranchRegionNotConfigured, guildId: 'g42' })))
        .toEqual(['/guilds', 'g42', 'settings', 'general']);
    });

    it('builds the guild notifications settings route for RaidNotificationsNotConfigured', () => {
      setup();

      expect(component.link(notification({ type: NotificationType.RaidNotificationsNotConfigured, guildId: 'g42' })))
        .toEqual(['/guilds', 'g42', 'settings', 'notifications']);
    });

    it('builds the guild notifications settings route for RaidCompositionNotificationsNotConfigured', () => {
      setup();

      expect(component.link(notification({ type: NotificationType.RaidCompositionNotificationsNotConfigured, guildId: 'g42' })))
        .toEqual(['/guilds', 'g42', 'settings', 'notifications']);
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
