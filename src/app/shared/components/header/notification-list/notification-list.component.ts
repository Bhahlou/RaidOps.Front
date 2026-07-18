import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Notification, NotificationType } from '../../../../core/models/notification.model';
import { ButtonComponent } from '../../buttons/button/button.component';

/**
 * i18n key for each notification type, interpolated with `{ guildName }`. Exported so
 * `NotificationBellComponent` can filter out types this build doesn't recognize — e.g. stale
 * data cached client-side (sessionStorage) from before a type was renamed/removed, or a
 * front/back deploy order mismatch — before showing them in the badge count or the list.
 */
export const NOTIFICATION_MESSAGE_KEYS: Partial<Record<NotificationType, string>> = {
  [NotificationType.OfficerThresholdNotConfigured]: 'notifications.officerThresholdNotConfigured',
};

/** Route the notification's call-to-action link points to. */
const LINK_BUILDERS: Partial<Record<NotificationType, (notification: Notification) => unknown[]>> =
  {
    [NotificationType.OfficerThresholdNotConfigured]: (n) => ['/guilds', n.guildId, 'settings'],
  };

/** Pure, presentational list of notification rows — caller owns filtering/state. */
@Component({
  selector: 'app-notification-list',
  imports: [TranslocoPipe, ButtonComponent],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent {
  readonly notifications = input<Notification[]>([]);
  readonly dismissed = output<Notification>();

  messageKey(notification: Notification): string {
    return NOTIFICATION_MESSAGE_KEYS[notification.type]!;
  }

  link(notification: Notification): unknown[] {
    return LINK_BUILDERS[notification.type]!(notification);
  }

  dismiss(notification: Notification): void {
    this.dismissed.emit(notification);
  }
}
