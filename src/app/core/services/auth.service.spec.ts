import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { LOCATION } from '../tokens/location.token';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let controller: HttpTestingController;
  let mockAssign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAssign = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCATION, useValue: { assign: mockAssign } },
      ],
    });

    service = TestBed.inject(AuthService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe('getMe', () => {
    it('sends GET /api/v1/user/me and returns the user', () => {
      const mockUser: User = {
        discordId: '123456789',
        name: 'TestUser',
        avatarHash: 'abc123',
        guilds: [],
      };

      let result: User | undefined;
      service.getMe().subscribe(u => { result = u; });

      const req = controller.expectOne(r => r.url.endsWith('/user/me'));
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    it('sends POST /api/v1/discordAuth/refresh with an empty body', () => {
      let completed = false;
      service.refresh().subscribe({ complete: () => { completed = true; } });

      const req = controller.expectOne(r => r.url.endsWith('/discordAuth/refresh'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      expect(completed).toBe(true);
    });
  });

  describe('logout', () => {
    it('sends POST /api/v1/discordAuth/logout with an empty body', () => {
      let completed = false;
      service.logout().subscribe({ complete: () => { completed = true; } });

      const req = controller.expectOne(r => r.url.endsWith('/discordAuth/logout'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);

      expect(completed).toBe(true);
    });
  });

  describe('signup', () => {
    it('redirects to /api/v1/discordAuth/signup', () => {
      service.signup();
      expect(mockAssign).toHaveBeenCalledWith(expect.stringContaining('/discordAuth/signup'));
    });
  });
});
