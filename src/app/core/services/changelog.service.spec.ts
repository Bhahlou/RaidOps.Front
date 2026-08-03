import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ChangelogService } from './changelog.service';

describe('ChangelogService', () => {
  let service: ChangelogService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChangelogService, provideHttpClient(), provideHttpClientTesting()],
    });
    service    = TestBed.inject(ChangelogService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // ── markSeen ──────────────────────────────────────────────────────────────

  describe('markSeen', () => {
    it('sends POST to /user/changelog-seen with the entry ids', () => {
      service.markSeen(['entry-1', 'entry-2']).subscribe();

      const req = controller.expectOne(r => r.url.endsWith('/user/changelog-seen'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ entryIds: ['entry-1', 'entry-2'] });
      req.flush(null);
    });
  });
});
