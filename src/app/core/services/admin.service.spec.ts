import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('syncSpells', () => {
    it('sends POST to /admin/sync-spells with an empty body', () => {
      service.syncSpells().subscribe();

      const req = controller.expectOne(r => r.url === `${environment.apiUrl}/admin/sync-spells`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });

    it('completes when the server answers successfully', () => {
      let completed = false;
      service.syncSpells().subscribe({ complete: () => { completed = true; } });

      controller.expectOne(r => r.url.endsWith('/admin/sync-spells')).flush(null);

      expect(completed).toBe(true);
    });

    it('propagates HTTP errors to the subscriber', () => {
      let status: number | undefined;
      service.syncSpells().subscribe({ error: (e) => { status = e.status; } });

      controller.expectOne(r => r.url.endsWith('/admin/sync-spells')).flush('nope', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });
});
