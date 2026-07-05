import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthStore } from '../../../core/stores/auth.store';
import { Notification } from '../../../core/models/notification.model';
import {
  NOTIFICATION_MESSAGE_KEYS,
  NotificationListComponent,
} from '../notification-list/notification-list.component';

/**
 * Header trigger: a bell icon with a badge count, opening a dropdown panel of the user's active
 * notifications on click. Replaces an earlier always-visible inline banner, which had no bound on
 * how many rows it could stack (one per admin-owned guild missing a setting).
 */
@Component({
  selector: 'app-notification-bell',
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslocoPipe,
    NotificationListComponent,
  ],
  templateUrl: './notification-bell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  readonly #authStore = inject(AuthStore);

  /** Drops any notification of a type this build doesn't recognize (see NOTIFICATION_MESSAGE_KEYS). */
  readonly visibleNotifications = computed(() =>
    this.#authStore.notifications().filter((n) => n.type in NOTIFICATION_MESSAGE_KEYS),
  );

  readonly count = computed(() => this.visibleNotifications().length);

  onDismiss(notification: Notification): void {
    this.#authStore.dismissNotification(notification.type, notification.guildId).subscribe();
  }
}
