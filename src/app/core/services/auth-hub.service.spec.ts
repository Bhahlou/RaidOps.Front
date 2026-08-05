import { TestBed } from '@angular/core/testing';
import { HubConnectionState } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthHubService, HUB_CONNECTION_FACTORY } from './auth-hub.service';

const expectedHubUrl = `${environment.apiUrl.replace(/\/api\/v1$/, '')}/hubs/auth`;

describe('AuthHubService', () => {
  let service: AuthHubService;
  let mockConnection: { on: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; state: HubConnectionState };
  let createConnection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConnection = {
      on: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      state: HubConnectionState.Connected,
    };
    createConnection = vi.fn().mockReturnValue(mockConnection);

    TestBed.configureTestingModule({
      providers: [{ provide: HUB_CONNECTION_FACTORY, useValue: createConnection }],
    });
    service = TestBed.inject(AuthHubService);
  });

  // ── start ─────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('builds the connection against the /hubs/auth URL and starts it', () => {
      service.start(vi.fn());

      expect(createConnection).toHaveBeenCalledWith(expectedHubUrl);
      expect(mockConnection.start).toHaveBeenCalledOnce();
    });

    it('registers the callback for the DiscordDataChanged event', () => {
      const onDiscordDataChanged = vi.fn();

      service.start(onDiscordDataChanged);

      expect(mockConnection.on).toHaveBeenCalledWith('DiscordDataChanged', onDiscordDataChanged);
    });

    it('is a no-op if a connection is already open', () => {
      service.start(vi.fn());
      service.start(vi.fn());

      expect(createConnection).toHaveBeenCalledOnce();
    });

    it('clears the connection on failure so a later start() can retry', async () => {
      const rejection = Promise.reject(new Error('negotiate failed'));
      mockConnection.start.mockReturnValue(rejection);

      service.start(vi.fn());
      await rejection.catch(() => {});

      service.start(vi.fn());

      expect(createConnection).toHaveBeenCalledTimes(2);
    });

    it('does not clobber a newer connection if stop() ran before the failed start() settled', async () => {
      const rejection = Promise.reject(new Error('negotiate failed'));
      mockConnection.start.mockReturnValue(rejection);

      service.start(vi.fn());
      service.stop();
      await rejection.catch(() => {});

      // stop() already nulled #connection; the stale catch handler must not touch it again,
      // so a subsequent start() call still builds a fresh connection (not blocked, not double-cleared).
      service.start(vi.fn());

      expect(createConnection).toHaveBeenCalledTimes(2);
    });
  });

  // ── stop ──────────────────────────────────────────────────────────────────

  describe('stop', () => {
    it('is a no-op when no connection was ever started', () => {
      service.stop();

      expect(mockConnection.stop).not.toHaveBeenCalled();
    });

    it('stops the connection when not already disconnected', () => {
      mockConnection.state = HubConnectionState.Connected;
      service.start(vi.fn());

      service.stop();

      expect(mockConnection.stop).toHaveBeenCalledOnce();
    });

    it('does not call stop() again when the connection is already disconnected', () => {
      mockConnection.state = HubConnectionState.Disconnected;
      service.start(vi.fn());

      service.stop();

      expect(mockConnection.stop).not.toHaveBeenCalled();
    });

    it('allows a fresh start() after stop()', () => {
      service.start(vi.fn());
      service.stop();

      service.start(vi.fn());

      expect(createConnection).toHaveBeenCalledTimes(2);
    });
  });
});
