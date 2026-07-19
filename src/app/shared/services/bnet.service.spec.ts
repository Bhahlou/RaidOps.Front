import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BnetService } from './bnet.service';

describe('BnetService', () => {
  let service: BnetService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BnetService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('unlinkBnetAccount', () => {
    it('sends DELETE /bnet/accounts/:bnetId', () => {
      let completed = false;
      service.unlinkBnetAccount('123').subscribe(() => { completed = true; });

      const req = controller.expectOne(r => r.url.endsWith('/bnet/accounts/123'));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBe(true);
    });
  });
});
