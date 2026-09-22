import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RaidCompositionPreviewsService } from './raid-composition-previews.service';

const BASE = '/guilds/g1/branches/7/composition-previews';

describe('RaidCompositionPreviewsService', () => {
  let service: RaidCompositionPreviewsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RaidCompositionPreviewsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RaidCompositionPreviewsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getPreviews', () => {
    it('sends GET to the branch base URL', () => {
      service.getPreviews('g1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getPreview', () => {
    it('sends GET to .../:id', () => {
      service.getPreview('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('GET');
      req.flush(null);
    });
  });

  describe('createPreview', () => {
    it('sends POST to the branch base URL with the payload', () => {
      service.createPreview('g1', 7, { name: '40-man', groupCount: 8 }).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(BASE));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: '40-man', groupCount: 8 });
      req.flush({ body: { id: 1 } });
    });
  });

  describe('renamePreview', () => {
    it('sends PATCH to .../:id with the new name', () => {
      service.renamePreview('g1', 7, 11, 'New name').subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'New name' });
      req.flush(null);
    });
  });

  describe('duplicatePreview', () => {
    it('sends POST to .../:id/duplicate with the new name', () => {
      service.duplicatePreview('g1', 7, 11, 'Copy').subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11/duplicate`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ newName: 'Copy' });
      req.flush({ body: { id: 2 } });
    });
  });

  describe('deletePreview', () => {
    it('sends DELETE to .../:id', () => {
      service.deletePreview('g1', 7, 11).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('updateSlot', () => {
    it('sends PATCH to .../:id/slots with the slot payload', () => {
      const payload = { groupNumber: 1, slotNumber: 2, wowClassId: 1, specId: 71, note: 'Bob' };
      service.updateSlot('g1', 7, 11, payload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/11/slots`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });
});
