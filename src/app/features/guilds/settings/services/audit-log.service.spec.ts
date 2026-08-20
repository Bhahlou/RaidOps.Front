import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuditLogPage } from '../models/audit-log-page.model';
import { GuildAuditAction } from '../models/guild-audit-action.enum';
import { GuildAuditCategory } from '../models/guild-audit-category.enum';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditLogService, provideHttpClient(), provideHttpClientTesting()],
    });
    service    = TestBed.inject(AuditLogService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getEntries', () => {
    it('sends GET to /guilds/:id/audit-log with page and pageSize params', () => {
      const expected: AuditLogPage = { entries: [], hasMore: false };
      let result: AuditLogPage | undefined;

      service.getEntries('guild-1', 1, 25).subscribe(r => (result = r));

      const req = controller.expectOne(
        r => r.url.endsWith('/guilds/guild-1/audit-log')
          && r.params.get('page') === '1'
          && r.params.get('pageSize') === '25'
          && !r.params.has('actionType'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });

    it('includes the actionType param when provided', () => {
      service.getEntries('guild-1', 2, 25, GuildAuditAction.MemberRankUpdated).subscribe();

      const req = controller.expectOne(
        r => r.url.endsWith('/guilds/guild-1/audit-log')
          && r.params.get('actionType') === 'MemberRankUpdated',
      );
      req.flush({ entries: [], hasMore: false });
    });

    it('includes the category param when provided', () => {
      service.getEntries('guild-1', 1, 25, undefined, GuildAuditCategory.Roster).subscribe();

      const req = controller.expectOne(
        r => r.url.endsWith('/guilds/guild-1/audit-log')
          && r.params.get('category') === 'Roster'
          && !r.params.has('actionType'),
      );
      req.flush({ entries: [], hasMore: false });
    });
  });
});
