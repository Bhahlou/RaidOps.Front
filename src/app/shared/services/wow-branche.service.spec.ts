import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WowBrancheService } from './wow-branche.service';
import { Branch } from '../models/branch.model';

const branches: Branch[] = [
  { id: 1, name: 'Retail', bnetNamespacePrefix: 'profile-eu', currentExpansionShortCode: 'TWW' },
  { id: 2, name: 'Classic Anniversary', bnetNamespacePrefix: 'profile-classic1x-eu', currentExpansionShortCode: 'ANNIVERSARY' },
];

describe('WowBrancheService', () => {
  let service: WowBrancheService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WowBrancheService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getAll', () => {
    it('sends GET /WowBranches and returns the list', () => {
      let result: Branch[] | undefined;
      service.getAll().subscribe(b => { result = b; });

      const req = controller.expectOne(r => r.url.endsWith('/WowBranches'));
      expect(req.request.method).toBe('GET');
      req.flush(branches);

      expect(result).toEqual(branches);
    });
  });
});
