import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SpecService } from './spec.service';
import { Spec } from '../models/spec.model';

const specs: Spec[] = [
  { id: 71, name: 'Arms', role: 'Dps', classId: 1, iconUrl: null },
  { id: 73, name: 'Protection', role: 'Tank', classId: 1, iconUrl: 'https://cdn/prot.jpg' },
];

describe('SpecService', () => {
  let service: SpecService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpecService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getAll', () => {
    it('sends GET /Specs and returns the list', () => {
      let result: Spec[] | undefined;
      service.getAll().subscribe(s => { result = s; });

      const req = controller.expectOne(r => r.url.endsWith('/Specs'));
      expect(req.request.method).toBe('GET');
      req.flush(specs);

      expect(result).toEqual(specs);
    });
  });
});
