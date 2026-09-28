import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SpellService } from './spell.service';
import { Spell } from '../models/spell.model';

const spells: Spell[] = [{ id: 16176, name: 'Ancestral Healing', iconUrl: 'https://cdn/ancestral.jpg' }];

describe('SpellService', () => {
  let service: SpellService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpellService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('search', () => {
    it('sends GET /spells/search with the expansion, term and locale as query params', () => {
      let result: Spell[] | undefined;
      service.search(12, 'heal', 'fr').subscribe((s) => {
        result = s;
      });

      const req = controller.expectOne((r) => r.url.endsWith('/spells/search'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('expansionId')).toBe('12');
      expect(req.request.params.get('searchTerm')).toBe('heal');
      expect(req.request.params.get('locale')).toBe('fr');
      req.flush(spells);

      expect(result).toEqual(spells);
    });
  });
});
