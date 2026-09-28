import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdminService } from './admin.service';
import { RaidBuffDefinitionInput } from '../../shared/models/raid-buff-definition.model';
import { RaidBuffKind } from '../../shared/models/raid-buff-kind.enum';
import { RaidBuffScope } from '../../shared/models/raid-buff-scope.enum';

const definition: RaidBuffDefinitionInput = {
  spellId: 16176,
  scope: RaidBuffScope.Raid,
  kind: RaidBuffKind.Buff,
  labelEn: '+25% armor',
  labelFr: '+25 % d\'armure',
  labelDe: '+25 % Rüstung',
  exclusiveGroupKey: null,
  capacityPoolKey: null,
  sortOrder: 10,
  sources: [{ classId: 7, specId: 264 }],
};

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

  describe('saveRaidBuff', () => {
    it('sends PUT to /admin/raid-buffs/{expansionId} with the definition and unwraps the body', () => {
      let result: unknown;
      service.saveRaidBuff(12, definition).subscribe((r) => (result = r));

      const req = controller.expectOne(r => r.url === `${environment.apiUrl}/admin/raid-buffs/12`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe(definition);
      req.flush({ message: 'ok', body: { created: 1, updated: 0, deleted: 0 }, status: 'ok' });

      expect(result).toEqual({ created: 1, updated: 0, deleted: 0 });
    });
  });

  describe('importRaidBuffs', () => {
    it('sends POST to /admin/raid-buffs/{expansionId}/import with the definitions and pruneMissing, and unwraps the body', () => {
      let result: unknown;
      service.importRaidBuffs(12, [definition], true).subscribe((r) => (result = r));

      const req = controller.expectOne(r => r.url === `${environment.apiUrl}/admin/raid-buffs/12/import`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ definitions: [definition], pruneMissing: true });
      req.flush({ message: 'ok', body: { created: 0, updated: 1, deleted: 2 }, status: 'ok' });

      expect(result).toEqual({ created: 0, updated: 1, deleted: 2 });
    });
  });

  describe('updateRaidBuff', () => {
    it('sends PUT to /admin/raid-buffs/definitions/{id} with the definition', () => {
      service.updateRaidBuff(42, definition).subscribe();

      const req = controller.expectOne(r => r.url === `${environment.apiUrl}/admin/raid-buffs/definitions/42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe(definition);
      req.flush(null);
    });
  });

  describe('deleteRaidBuff', () => {
    it('sends DELETE to /admin/raid-buffs/{id}', () => {
      service.deleteRaidBuff(7).subscribe();

      const req = controller.expectOne(r => r.url === `${environment.apiUrl}/admin/raid-buffs/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
