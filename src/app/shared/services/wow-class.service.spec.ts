import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WowClassService } from './wow-class.service';
import { WowClass } from '../models/wow-class.model';

const classes: WowClass[] = [
  { id: 1, name: 'Warrior', color: 'C79C6E', firstExpansionId: 1 },
  { id: 2, name: 'Paladin', color: 'F58CBA', firstExpansionId: 1 },
];

describe('WowClassService', () => {
  let service: WowClassService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WowClassService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getAll', () => {
    it('sends GET /wowclasses and returns the list', () => {
      let result: WowClass[] | undefined;
      service.getAll().subscribe((c) => {
        result = c;
      });

      const req = controller.expectOne((r) => r.url.endsWith('/wowclasses'));
      expect(req.request.method).toBe('GET');
      req.flush(classes);

      expect(result).toEqual(classes);
    });
  });
});
