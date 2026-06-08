import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BnetService } from './bnet.service';
import { BnetAccount } from '../../features/characters/models/bnet-account.model';

const mockAccount: BnetAccount = {
  bnetId: '123456',
  battleTag: 'TestUser#1234',
  region: 'eu',
  tokenExpiry: '2025-12-31T00:00:00Z',
};

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

  describe('getBnetAccount', () => {
    it('sends GET to /bnet/account and returns the account', () => {
      let result: BnetAccount | null | undefined;
      service.getBnetAccount().subscribe(a => { result = a; });

      const req = controller.expectOne(r => r.url.endsWith('/bnet/account'));
      expect(req.request.method).toBe('GET');
      req.flush(mockAccount);

      expect(result).toEqual(mockAccount);
    });

    it('emits null on 404 (no BNet account linked)', () => {
      let result: BnetAccount | null | undefined;
      service.getBnetAccount().subscribe(a => { result = a; });

      const req = controller.expectOne(r => r.url.endsWith('/bnet/account'));
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(result).toBeNull();
    });

    it('propagates non-404 HTTP errors', () => {
      let caughtError: unknown;
      service.getBnetAccount().subscribe({ error: e => { caughtError = e; } });

      const req = controller.expectOne(r => r.url.endsWith('/bnet/account'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(caughtError).toBeInstanceOf(HttpErrorResponse);
      expect((caughtError as HttpErrorResponse).status).toBe(500);
    });
  });
});
