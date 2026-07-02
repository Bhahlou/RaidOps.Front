import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NotificationType } from '../models/notification.model';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service    = TestBed.inject(NotificationService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── dismiss ───────────────────────────────────────────────────────────────

  describe('dismiss', () => {
    it('sends POST to /notifications/dismiss with the type and guildId', () => {
      service.dismiss(NotificationType.OfficerThresholdNotConfigured, 'guild-1').subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/notifications/dismiss'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: NotificationType.OfficerThresholdNotConfigured, guildId: 'guild-1' });
      req.flush(null);
    });
  });
});
