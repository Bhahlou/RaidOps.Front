import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationType } from '../models/notification.model';

@Service()
export class NotificationService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Records that the current user dismissed the given notification. */
  dismiss(type: NotificationType, guildId: string): Observable<void> {
    return this.#http.post<void>(`${this.#api}/notifications/dismiss`, { type, guildId });
  }
}
