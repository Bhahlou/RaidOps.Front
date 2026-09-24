import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CreateGuildAttributionDefinitionPayload, GuildAttributionDefinitionPayload } from '../models/guild-attribution-definition.model';
import { AttributionCellKind } from '../models/attribution-cell-kind.enum';
import { AttributionIconSource } from '../models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../models/raid-marker-icon.enum';
import { AttributionDefinitionsService } from './attribution-definitions.service';

const BASE = '/guilds/guild-1';
const BRANCH = `${BASE}/branches/7`;

const payload: GuildAttributionDefinitionPayload = {
  label: 'Innervate',
  section: 'Personals',
  isRepeatable: true,
  cells: [
    {
      kind: AttributionCellKind.Icon,
      iconSource: AttributionIconSource.Spell,
      spellId: 29166,
      raidMarker: null,
      staticRole: null,
      slotLabel: null,
      requiredClassIds: [],
      requiredRoles: [],
      requiredSpecIds: [],
    },
  ],
};

describe('AttributionDefinitionsService', () => {
  let service: AttributionDefinitionsService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttributionDefinitionsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttributionDefinitionsService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getDefinitions', () => {
    it('sends GET to .../attribution-definitions with no raidBossId param when null', () => {
      service.getDefinitions('guild-1', 7, null).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions`) && !r.params.has('raidBossId'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('sends the raidBossId as a query param when given', () => {
      service.getDefinitions('guild-1', 7, 14).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions`) && r.params.get('raidBossId') === '14');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getRaidZones', () => {
    it('sends GET to .../branches/{id}/raids/zones', () => {
      service.getRaidZones('guild-1', 7).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/raids/zones`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getBossesForZone', () => {
    it('sends GET to .../raid-zones/{id}/bosses', () => {
      service.getBossesForZone('guild-1', 4).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BASE}/raid-zones/4/bosses`));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('setSectionIcon', () => {
    it('sends POST to .../attribution-definitions/sections/icon with the payload', () => {
      const sectionPayload = { raidBossId: 14, section: 'Interrupts', iconSource: AttributionIconSource.RaidMarker, spellId: null, raidMarker: RaidMarkerIcon.Skull, staticRole: null };
      service.setSectionIcon('guild-1', 7, sectionPayload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions/sections/icon`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(sectionPayload);
      req.flush(null);
    });
  });

  describe('createDefinition', () => {
    it('sends POST to .../attribution-definitions with the payload', () => {
      const createPayload: CreateGuildAttributionDefinitionPayload = { ...payload, raidBossId: null };
      service.createDefinition('guild-1', 7, createPayload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createPayload);
      req.flush(null);
    });
  });

  describe('updateDefinition', () => {
    it('sends PATCH to .../attribution-definitions/{id} with the payload', () => {
      service.updateDefinition('guild-1', 7, 42, payload).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions/42`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('deleteDefinition', () => {
    it('sends DELETE to .../attribution-definitions/{id}', () => {
      service.deleteDefinition('guild-1', 7, 42).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions/42`));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('reorderDefinitions', () => {
    it('sends POST to .../attribution-definitions/reorder with the ordered ids', () => {
      service.reorderDefinitions('guild-1', 7, [3, 1, 2]).subscribe();
      const req = controller.expectOne((r) => r.url.endsWith(`${BRANCH}/attribution-definitions/reorder`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ orderedIds: [3, 1, 2] });
      req.flush(null);
    });
  });

  describe('searchSpells', () => {
    it('sends GET to .../spells/search with the search params', () => {
      service.searchSpells('guild-1', 7, 'frappe', 'fr').subscribe();
      const req = controller.expectOne(
        (r) => r.url.endsWith(`${BRANCH}/spells/search`) && !r.params.has('expansionId') && r.params.get('searchTerm') === 'frappe' && r.params.get('locale') === 'fr',
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
